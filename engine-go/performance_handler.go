package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"time"

	"github.com/gofiber/fiber/v2"
)

type PerformanceHandler struct {
	Repo         *Repository
	PageSpeedKey string
	cache        fiber.Map
	cacheTime    time.Time
}

func NewPerformanceHandler(repo *Repository, apiKey string) *PerformanceHandler {
	return &PerformanceHandler{
		Repo:         repo,
		PageSpeedKey: apiKey,
		cache:        make(fiber.Map),
	}
}

// IngestRUM: Receives Core Web Vitals from the frontend
func (h *PerformanceHandler) IngestRUM(c *fiber.Ctx) error {
	type RUMPayload struct {
		SessionID string  `json:"sid"`
		Url       string  `json:"url"`
		LCP       float64 `json:"lcp"`
		CLS       float64 `json:"cls"`
		INP       float64 `json:"inp"`
		TTFB      float64 `json:"ttfb"`
		FCP       float64 `json:"fcp"`
		Device    string  `json:"device"` // mobile, desktop
	}

	var p RUMPayload
	if err := c.BodyParser(&p); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid payload"})
	}

	// Basic Validation
	if p.Url == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Missing URL"})
	}

	// 1. Slow Page Alert (Phase 14)
	if p.LCP > 2500 {
		// In a real system, send this to NotificationSystem (channel/worker)
		log.Printf("[ALERT] Slow Page Detected (LCP > 2.5s): %s (%.2f ms)", p.Url, p.LCP)
	}

	// 2. Non-blocking Ingestion (Low Memory Footprint Mode)
	// Return 200 immediately, handle DB in background
	go func(payload RUMPayload) {
		_, err := h.Repo.db.Exec(`
			INSERT INTO wp_apex_performance_metrics (session_id, url, lcp, cls, inp, ttfb, fcp, device_type)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		`, payload.SessionID, payload.Url, payload.LCP, payload.CLS, payload.INP, payload.TTFB, payload.FCP, payload.Device)

		if err != nil {
			log.Printf("RUM Insert Error: %v", err)
		}
	}(p)

	return c.JSON(fiber.Map{"status": "captured", "mode": "async"})
}

// GetPerformanceStats: Aggregates RUM data for dashboard
func (h *PerformanceHandler) GetPerformanceStats(c *fiber.Ctx) error {
	rows, err := h.Repo.RunReadOnlyQuery(`
        SELECT 
            AVG(lcp) as avg_lcp,
            AVG(cls) as avg_cls,
            AVG(inp) as avg_inp,
            AVG(ttfb) as avg_ttfb,
            COUNT(*) as sample_size
        FROM wp_apex_performance_metrics
        WHERE created_at >= NOW() - INTERVAL 7 DAY
    `)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if len(rows) == 0 {
		return c.JSON(fiber.Map{
			"avg_lcp":     0,
			"avg_cls":     0,
			"avg_inp":     0,
			"avg_ttfb":    0,
			"sample_size": 0,
		})
	}

	res := rows[0]
	return c.JSON(fiber.Map{
		"avg_lcp":     castToFloat(res["avg_lcp"]),
		"avg_cls":     castToFloat(res["avg_cls"]),
		"avg_inp":     castToFloat(res["avg_inp"]),
		"avg_ttfb":    castToFloat(res["avg_ttfb"]),
		"sample_size": castToFloat(res["sample_size"]),
	})
}

// RunPageSpeed: Triggers a scan via Google PSI API
func (h *PerformanceHandler) RunPageSpeed(c *fiber.Ctx) error {
	targetURL := c.Query("url")
	if targetURL == "" {
		return c.Status(400).JSON(fiber.Map{"error": "URL required"})
	}

	strategy := c.Query("strategy", "mobile") // mobile or desktop

	apiKey := h.PageSpeedKey
	if apiKey == "" || apiKey == "your-pagespeed-key" {
		// Mock response if API key is not configured to avoid breaking UI
		log.Println("[WARN] PAGESPEED_API_KEY not configured. Returning mock data.")
		return c.JSON(fiber.Map{
			"url":      targetURL,
			"strategy": strategy,
			"score":    85,
			"script_impact": []fiber.Map{
				{"url": "https://example.com/wp-content/plugins/some-plugin/script.js", "wasted_bytes": 45000, "plugin": "Some Plugin"},
			},
			"lazy_load_candidates": []string{"https://example.com/wp-content/uploads/hero.jpg"},
			"mock":                 true,
		})
	}

	apiURL := fmt.Sprintf("https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=%s&key=%s&strategy=%s&category=PERFORMANCE", targetURL, apiKey, strategy)

	resp, err := http.Get(apiURL)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to contact Google API"})
	}
	defer resp.Body.Close()

	body, _ := ioutil.ReadAll(resp.Body)

	// Parse partial response for the Score
	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to parse API response"})
	}

	// Extract Score and Lighthouse Result
	var score float64
	var lighthouse map[string]interface{}

	if lh, ok := result["lighthouseResult"].(map[string]interface{}); ok {
		lighthouse = lh
		// Get Score
		if cats, ok := lighthouse["categories"].(map[string]interface{}); ok {
			if perf, ok := cats["performance"].(map[string]interface{}); ok {
				if s, ok := perf["score"].(float64); ok {
					score = s
				}
			}
		}
	}

	// Extract Audits
	audits, _ := lighthouse["audits"].(map[string]interface{})

	// 1. Script Impact Analysis (Unused JS)
	var impact []map[string]interface{}
	if unused, ok := audits["unused-javascript-summary"].(map[string]interface{}); ok {
		if details, ok := unused["details"].(map[string]interface{}); ok {
			if items, ok := details["items"].([]interface{}); ok {
				for _, item := range items {
					if i, ok := item.(map[string]interface{}); ok {
						url, _ := i["url"].(string)
						wasted, _ := i["wastedBytes"].(float64)
						if url != "" {
							impact = append(impact, map[string]interface{}{
								"url":          url,
								"wasted_bytes": wasted,
								"plugin":       detectPluginFromURL(url), // Helper logic
							})
						}
					}
				}
			}
		}
	}

	// 2. Smart Asset Loading (Offscreen Images)
	var images []string
	if offscreen, ok := audits["offscreen-images"].(map[string]interface{}); ok {
		if details, ok := offscreen["details"].(map[string]interface{}); ok {
			if items, ok := details["items"].([]interface{}); ok {
				for _, item := range items {
					if i, ok := item.(map[string]interface{}); ok {
						url, _ := i["url"].(string)
						if url != "" {
							images = append(images, url)
						}
					}
				}
			}
		}
	}

	// 3. CDN Usage Tracker
	// Naive check: Are static assets served from the main domain?
	// We can't easily check ALL requests without raw network list, but we can check the impactful scripts/images found above.
	// We will infer based on the first few impactful assets.

	return c.JSON(fiber.Map{
		"url":                  targetURL,
		"strategy":             strategy,
		"score":                score * 100, // 0-100
		"script_impact":        impact,
		"lazy_load_candidates": images,
		// "raw_json_summary": result, // Omit large raw JSON to save bandwidth/memory
	})
}

// detectPluginFromURL: Simple heuristics to map script URL to plugin
func detectPluginFromURL(url string) string {
	// e.g. /wp-content/plugins/woocommerce/assets/...
	// regex or simple string find would work
	// Implementation note: In a real Go app, use regexp
	if len(url) > 0 {
		// Pseudocode logic for mapping
		return "Unknown (Custom Script)"
	}
	return "Unknown"
}

// CheckDBHealth: Analyzes table sizes and autoload bloat
func (h *PerformanceHandler) CheckDBHealth(c *fiber.Ctx) error {
	// Simple memory cache (15 minutes)
	if time.Since(h.cacheTime) < 15*time.Minute && len(h.cache) > 0 {
		h.cache["cached"] = true
		h.cache["last_updated"] = h.cacheTime.Format(time.RFC3339)
		return c.JSON(h.cache)
	}
	// 1. Autoload Size & Top Offenders
	autoloadQuery := `
        SELECT option_name, LENGTH(option_value) as size_bytes
        FROM wp_options 
        WHERE autoload = 'yes'
        ORDER BY size_bytes DESC
        LIMIT 10
    `
	rows, err := h.Repo.RunReadOnlyQuery(autoloadQuery)
	topAutoloads := []map[string]interface{}{}
	totalAutoloadSize := 0.0

	if err == nil {
		for _, row := range rows {
			size := castToFloat(row["size_bytes"])
			totalAutoloadSize += size
			topAutoloads = append(topAutoloads, map[string]interface{}{
				"name": row["option_name"],
				"size": size,
			})
		}
	}

	// Calculate total autoload size (separate query for SUM if precise is needed,
	// but summing top 10 is just top 10. Let's do a proper SUM query too if requested,
	// or just reuse the previous SUM logic. Merging for brevity.)
	// Re-running SUM query for accuracy:
	sumStats, _ := h.Repo.RunReadOnlyQuery(`SELECT SUM(LENGTH(option_value)) as s FROM wp_options WHERE autoload='yes'`)
	if len(sumStats) > 0 && sumStats[0]["s"] != nil {
		totalAutoloadSize = castToFloat(sumStats[0]["s"])
	}

	// 2. Table Bloat (Information Schema)
	// Requires standard permissions.
	tableQuery := `
		SELECT TABLE_NAME, DATA_LENGTH + INDEX_LENGTH as total_size, TABLE_ROWS
		FROM information_schema.TABLES
		WHERE TABLE_SCHEMA = DATABASE()
		ORDER BY total_size DESC
		LIMIT 10
	`
	tableStats, _ := h.Repo.RunReadOnlyQuery(tableQuery)

	// 3. Transient Count (Performance/Bloat)
	transientQuery := `SELECT COUNT(*) as cnt FROM wp_options WHERE option_name LIKE '_transient_%'`
	transientRows, _ := h.Repo.RunReadOnlyQuery(transientQuery)
	transientCount := 0
	if len(transientRows) > 0 {
		transientCount = int(castToFloat(transientRows[0]["cnt"]))
	}

	h.cache = fiber.Map{
		"autoload_size_bytes": totalAutoloadSize,
		"autoload_size_mb":    totalAutoloadSize / 1024 / 1024,
		"top_autoloads":       topAutoloads,
		"largest_tables":      tableStats,
		"transient_count":     transientCount,
		"status":              "ok",
		"cached":              false,
		"last_updated":        time.Now().Format(time.RFC3339),
	}
	h.cacheTime = time.Now()

	return c.JSON(h.cache)
}

// Helper for type casting sql interface
func castToFloat(v interface{}) float64 {
	switch val := v.(type) {
	case []uint8: // Request from DB often []byte (strings)
		s := string(val)
		var f float64
		fmt.Sscanf(s, "%f", &f)
		return f
	case int64:
		return float64(val)
	case float64:
		return val
	default:
		return 0
	}
}
