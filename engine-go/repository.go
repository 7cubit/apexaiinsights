package main

import (
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/apex-ai/engine-go/recon"
	_ "github.com/go-sql-driver/mysql"
	"github.com/gofiber/fiber/v2"
	"github.com/oschwald/geoip2-golang"
)

// Event represents an incoming tracking event
type Event struct {
	Type        string                 `json:"t"`
	SessionID   string                 `json:"sid"`
	Timestamp   int64                  `json:"ts"`
	URL         string                 `json:"url"`
	Referrer    string                 `json:"ref"`
	IP          string                 `json:"ip"`
	UserAgent   string                 `json:"ua"`
	Fingerprint map[string]string      `json:"fp"`
	Data        map[string]interface{} `json:"d"`
	Country     string                 `json:"-"` // Enriched data
	City        string                 `json:"-"` // Enriched data

	// B2B Enrichment
	Company       string `json:"-"`
	IsISP         bool   `json:"-"`
	CompanyDomain string `json:"-"`
}

// Repository handles database operations
type Repository struct {
	db    *sql.DB
	geoDB *geoip2.Reader
}

// GetDB returns the underlying SQL DB connection
func (r *Repository) GetDB() *sql.DB {
	return r.db
}

// GetDailyStats returns aggregated stats for the current day
func (r *Repository) GetDailyStats() (map[string]interface{}, error) {
	// Simple mock aggregation for now, or real query
	// Real query example:
	// row := r.db.QueryRow("SELECT COUNT(*) FROM wp_apex_events WHERE DATE(created_at) = CURDATE()")

	// Returning mocked data to satisfy interface
	return map[string]interface{}{
		"visitors":    1200,
		"pageviews":   3500,
		"bounce_rate": 45.5,
	}, nil
}

// NewRepository creates a new repository instance
func NewRepository() (*Repository, error) {
	dsn := fmt.Sprintf("%s:%s@tcp(%s)/%s?parseTime=true",
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASS"),
		os.Getenv("DB_HOST"),
		os.Getenv("DB_NAME"),
	)

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, err
	}

	db.SetMaxOpenConns(100)
	db.SetMaxIdleConns(50)
	db.SetConnMaxLifetime(5 * time.Minute)

	// Load GeoIP DB
	geoDBPath := os.Getenv("GEOIP_DB_PATH")
	var geoDB *geoip2.Reader
	if geoDBPath != "" {
		geoDB, err = geoip2.Open(geoDBPath)
		if err != nil {
			log.Printf("Warning: Failed to load GeoIP database: %v", err)
		} else {
			log.Println("GeoIP database loaded successfully")
		}
	}

	return &Repository{db: db, geoDB: geoDB}, nil
}

// Migrate ensures the schema is up to date
func (r *Repository) Migrate() {
	// 1. Add columns to wp_apex_visitors if they don't exist
	// We use IGNORE/Silent failures for brevity in this MVP, or separate alter statements
	queries := []string{
		`ALTER TABLE wp_apex_visitors ADD COLUMN company_name VARCHAR(255) DEFAULT NULL`,
		`ALTER TABLE wp_apex_visitors ADD COLUMN company_domain VARCHAR(255) DEFAULT NULL`,
		`ALTER TABLE wp_apex_visitors ADD COLUMN is_isp TINYINT(1) DEFAULT 0`,
		`ALTER TABLE wp_apex_visitors ADD COLUMN lead_score INT DEFAULT 0`,

		// 2. Create Lead Vault
		`CREATE TABLE IF NOT EXISTS wp_apex_b2b_leads (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            company_name VARCHAR(255) NOT NULL,
            domain VARCHAR(255),
            industry VARCHAR(255),
            employee_count VARCHAR(50),
            confidence_score INT DEFAULT 0,
            first_seen DATETIME,
            last_seen DATETIME,
            visit_count INT DEFAULT 1,
            UNIQUE KEY unique_company (company_name)
        )`,

		// 3. Create Recordings Table (Phase 8)
		`CREATE TABLE IF NOT EXISTS wp_apex_recordings (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            session_id VARCHAR(255) NOT NULL,
            chunk_sequence INT NOT NULL,
            events_blob LONGBLOB, -- Gzipped JSON events
            created_at DATETIME,
            INDEX idx_session (session_id)
        )`,

		// 4. Form Analytics (Phase 9)
		`CREATE TABLE IF NOT EXISTS wp_apex_form_analytics (
			id BIGINT AUTO_INCREMENT PRIMARY KEY,
			session_id VARCHAR(255),
			form_id VARCHAR(255),
			payload JSON,
			created_at DATETIME,
			INDEX idx_form_session (session_id, form_id)
		)`,

		// Phase 10: Search Analytics
		`CREATE TABLE IF NOT EXISTS wp_apex_search_analytics (
			id INT AUTO_INCREMENT PRIMARY KEY,
			query TEXT,
			result_count INT,
			ua TEXT,
			session_id VARCHAR(255),
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		// Phase 10: 404 Logs
		`CREATE TABLE IF NOT EXISTS wp_apex_404_logs (
			id INT AUTO_INCREMENT PRIMARY KEY,
			url TEXT,
			referrer TEXT,
			ua TEXT,
			session_id VARCHAR(255),
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		// Phase 11: Automation Rules
		`CREATE TABLE IF NOT EXISTS wp_apex_automation_rules (
			id INT AUTO_INCREMENT PRIMARY KEY,
			name VARCHAR(255),
			trigger_type VARCHAR(50),
			trigger_config JSON,
			action_type VARCHAR(50),
			action_config JSON,
			is_active BOOLEAN DEFAULT TRUE,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		// Phase 13: Social & Viral Intelligence
		`CREATE TABLE IF NOT EXISTS wp_apex_social_mentions (
			id INT AUTO_INCREMENT PRIMARY KEY,
			platform VARCHAR(50),
			content TEXT,
			author VARCHAR(255),
			sentiment_score INT, 
			timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS wp_apex_campaigns (
			id INT AUTO_INCREMENT PRIMARY KEY,
			utm_source VARCHAR(255),
			utm_medium VARCHAR(255),
			utm_campaign VARCHAR(255),
			clicks INT DEFAULT 0,
			conversions INT DEFAULT 0,
			last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			UNIQUE KEY unique_campaign (utm_source, utm_medium, utm_campaign)
		)`,
		`CREATE TABLE IF NOT EXISTS wp_apex_influencers (
			id INT AUTO_INCREMENT PRIMARY KEY,
			name VARCHAR(255),
			coupon_code VARCHAR(100) UNIQUE,
			referral_count INT DEFAULT 0,
			roi_value FLOAT DEFAULT 0.0
		)`,

		// Phase 14: Performance & CWV
		`CREATE TABLE IF NOT EXISTS wp_apex_performance_metrics (
			id BIGINT AUTO_INCREMENT PRIMARY KEY,
			session_id VARCHAR(255),
			url TEXT,
			lcp FLOAT, -- Largest Contentful Paint (ms)
			cls FLOAT, -- Cumulative Layout Shift
			inp FLOAT, -- Interaction to Next Paint (ms)
			ttfb FLOAT, -- Time to First Byte (ms)
            fcp FLOAT, -- First Contentful Paint (ms)
			device_type VARCHAR(20),
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			INDEX idx_perf_created (created_at)
		)`,
		`CREATE TABLE IF NOT EXISTS wp_apex_db_stats (
			id INT AUTO_INCREMENT PRIMARY KEY,
			table_name VARCHAR(100),
			size_mb FLOAT,
			row_count INT,
			autoload_size_bytes INT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS wp_apex_webhooks (
			id INT AUTO_INCREMENT PRIMARY KEY,
			target_url VARCHAR(255) NOT NULL,
			event_types TEXT,
			secret VARCHAR(255),
			is_active TINYINT(1) DEFAULT 1,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		// GDPR Settings Table (Phase 24)
		`CREATE TABLE IF NOT EXISTS wp_apex_settings (
			id INT AUTO_INCREMENT PRIMARY KEY,
			option_name VARCHAR(255) NOT NULL UNIQUE,
			option_value TEXT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		)`,
	}

	for _, q := range queries {
		_, err := r.db.Exec(q)
		if err != nil && !strings.Contains(err.Error(), "Duplicate column") {
			log.Printf("Migration warning: %v", err)
		}
	}
}

// GenerateFingerprint creates a hash from IP + UserAgent + Screen Resolution
func GenerateFingerprint(ip, ua, screen string) string {
	data := ip + "|" + ua + "|" + screen
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:])
}

// IsBot checks if the user agent is a known bot
func IsBot(ua string) bool {
	ua = strings.ToLower(ua)
	botPatterns := []string{
		"bot", "crawler", "spider", "slurp", "googlebot", "bingbot",
		"yandex", "baidu", "duckduck", "facebook", "twitter", "linkedin",
		"headless", "phantom", "selenium", "puppeteer", "playwright",
		"curl", "wget", "python", "java", "ruby", "go-http", "apache-httpclient",
	}

	for _, pattern := range botPatterns {
		if strings.Contains(ua, pattern) {
			return true
		}
	}

	// Check for empty or very short user agents (often bots)
	if len(ua) < 20 {
		return true
	}

	return false
}

// EnrichWithGeoIP adds location data to the event
func (r *Repository) EnrichWithGeoIP(event *Event) {
	if r.geoDB == nil || event.IP == "" {
		return
	}

	ip := net.ParseIP(event.IP)
	if ip == nil {
		return
	}

	record, err := r.geoDB.City(ip)
	if err != nil {
		return
	}

	event.Country = record.Country.IsoCode
	event.City = record.City.Names["en"]
}

// SaveEvent stores an event in the database
func (r *Repository) SaveEvent(event Event) error {
	// Enrich with GeoIP
	r.EnrichWithGeoIP(&event)

	screen := ""
	if event.Fingerprint != nil {
		screen = event.Fingerprint["sr"]
	}

	fingerprint := GenerateFingerprint(event.IP, event.UserAgent, screen)

	// First, ensure the visitor exists (with B2B data)
	_, err := r.db.Exec(`
		INSERT INTO wp_apex_visitors (fingerprint, ip_hash, user_agent, screen_resolution, country, city, first_seen, company_name, company_domain, is_isp)
		VALUES (?, SHA2(?, 256), ?, ?, ?, ?, NOW(), ?, ?, ?)
		ON DUPLICATE KEY UPDATE 
			last_seen = NOW(),
			company_name = VALUES(company_name),
			company_domain = VALUES(company_domain)
	`, fingerprint, event.IP, event.UserAgent, screen, event.Country, event.City, event.Company, event.CompanyDomain, event.IsISP)

	if err != nil {
		log.Printf("Error inserting visitor: %v", err)
	}

	// If it's a company (not ISP, not Unknown), add to Lead Vault
	if event.Company != "" && event.Company != "Unknown" && !event.IsISP {
		_, err = r.db.Exec(`
            INSERT INTO wp_apex_b2b_leads (company_name, domain, first_seen, last_seen, visit_count)
            VALUES (?, ?, NOW(), NOW(), 1)
            ON DUPLICATE KEY UPDATE 
                last_seen = NOW(), 
                visit_count = visit_count + 1
        `, event.Company, event.CompanyDomain)
		if err != nil {
			log.Printf("Error updating Lead Vault: %v", err)
		}
	}

	// Update or insert the session
	_, err = r.db.Exec(`
		INSERT INTO wp_apex_sessions (session_id, fingerprint, started_at, last_activity, page_count)
		VALUES (?, ?, NOW(), NOW(), 1)
		ON DUPLICATE KEY UPDATE last_activity = NOW(), page_count = page_count + 1
	`, event.SessionID, fingerprint)
	if err != nil {
		log.Printf("Error inserting session: %v", err)
	}

	// Store the event
	dataJSON, _ := json.Marshal(event.Data)
	_, err = r.db.Exec(`
		INSERT INTO wp_apex_events (session_id, event_type, url, referrer, payload, created_at)
		VALUES (?, ?, ?, ?, ?, NOW())
	`, event.SessionID, event.Type, event.URL, event.Referrer, dataJSON)

	return err
}

// RunReadOnlyQuery executes a SELECT query and returns the results as a slice of maps
func (r *Repository) RunReadOnlyQuery(query string) ([]map[string]interface{}, error) {
	if r.db == nil {
		return nil, errors.New("database not connected")
	}

	// Basic safety check again (defense in depth)
	upperSQL := strings.ToUpper(strings.TrimSpace(query))
	if !strings.HasPrefix(upperSQL, "SELECT") {
		return nil, errors.New("only SELECT queries are allowed")
	}

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	// Get column names
	columns, err := rows.Columns()
	if err != nil {
		return nil, err
	}

	// Make a slice for the values
	values := make([]interface{}, len(columns))
	scanArgs := make([]interface{}, len(values))
	for i := range values {
		scanArgs[i] = &values[i]
	}

	var results []map[string]interface{}

	for rows.Next() {
		err = rows.Scan(scanArgs...)
		if err != nil {
			return nil, err
		}

		entry := make(map[string]interface{})
		for i, col := range columns {
			var v interface{}
			val := values[i]

			// Handle byte slices (BLOBs, standard text)
			b, ok := val.([]byte)
			if ok {
				v = string(b)
			} else {
				v = val
			}
			entry[col] = v
		}
		results = append(results, entry)
	}

	return results, nil
}

// Close closes the database connection and GeoIP reader
func (r *Repository) Close() error {
	if r.geoDB != nil {
		r.geoDB.Close()
	}
	return r.db.Close()
}

// WorkerPool manages a pool of workers for processing events
type WorkerPool struct {
	events     chan Event
	repository *Repository
	workers    int
	recon      *recon.ReconEngine
}

// NewWorkerPool creates a new worker pool
func NewWorkerPool(repo *Repository, rEngine *recon.ReconEngine, workers int) *WorkerPool {
	return &WorkerPool{
		events:     make(chan Event, 10000), // Buffer for 10k events
		repository: repo,
		workers:    workers,
		recon:      rEngine,
	}
}

// Start starts the worker pool
func (wp *WorkerPool) Start() {
	for i := 0; i < wp.workers; i++ {
		go func(id int) {
			for event := range wp.events {
				// Enrich with Recon Engine
				if wp.recon != nil {
					result := wp.recon.Identify(event.IP)
					event.Company = result.Organization
					event.CompanyDomain = result.CompanyDomain
					event.IsISP = result.IsISP
				}

				if err := wp.repository.SaveEvent(event); err != nil {
					log.Printf("Worker %d error: %v", id, err)
				}
			}
		}(i)
	}
}

// Submit adds an event to the processing queue
func (wp *WorkerPool) Submit(event Event) {
	select {
	case wp.events <- event:
		// Event submitted
	default:
		// Queue full, drop the event (or store to backup)
		log.Println("Event queue full, dropping event")
	}
}

var workerPool *WorkerPool

// SetupCollectEndpoint sets up the /collect endpoint
func SetupCollectEndpoint(app *fiber.App, repo *Repository, rEngine *recon.ReconEngine) {
	// Initialize worker pool with 50 workers
	workerPool = NewWorkerPool(repo, rEngine, 50)
	workerPool.Start()

	app.Post("/collect", func(c *fiber.Ctx) error {
		var event Event
		if err := c.BodyParser(&event); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid payload",
			})
		}

		// Dynamic GDPR Check - use manager with daily salt
		gdpr := GetGDPRManager()
		gdprActive := c.Get("X-Apex-GDPR") == "true"
		if gdpr != nil && gdpr.IsGDPREnabled() {
			gdprActive = true
		}
		if gdprActive && gdpr != nil {
			// Hash the IP with daily-rotating salt before it touches the database
			event.IP = gdpr.HashIP(event.IP)
		}

		// Bot detection
		if IsBot(event.UserAgent) {
			return c.JSON(fiber.Map{"status": "ignored", "reason": "bot"})
		}

		// URL validation
		if event.URL == "" || !isValidURL(event.URL) {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid URL",
			})
		}

		// Submit to worker pool (non-blocking)
		workerPool.Submit(event)

		return c.JSON(fiber.Map{"status": "ok"})
	})
}

func isValidURL(url string) bool {
	// Basic URL validation
	matched, _ := regexp.MatchString(`^https?://`, url)
	return matched
}
