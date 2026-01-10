package main

import (
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"log"
	"os"
	"sync"
	"time"
)

const (
	// GDPRCacheDuration is how long to cache the GDPR mode setting
	GDPRCacheDuration = 5 * time.Minute
)

// GDPRManager handles GDPR settings and IP hashing with daily salt rotation
type GDPRManager struct {
	db         *sql.DB
	cachedMode bool
	cacheTime  time.Time
	secret     string
	mu         sync.RWMutex
}

// Global GDPR manager instance
var globalGDPRManager *GDPRManager
var gdprOnce sync.Once

// InitGDPRManager initializes the global GDPR manager with a database connection
func InitGDPRManager(db *sql.DB) {
	gdprOnce.Do(func() {
		secret := os.Getenv("GDPR_SECRET")
		if secret == "" {
			secret = "apex-gdpr-default-secret" // Fallback for dev, should be set in production
			log.Println("Warning: GDPR_SECRET not set, using default. Set this in production!")
		}
		globalGDPRManager = &GDPRManager{
			db:     db,
			secret: secret,
		}
	})
}

// GetGDPRManager returns the singleton GDPR manager instance
func GetGDPRManager() *GDPRManager {
	return globalGDPRManager
}

// IsGDPREnabled checks if GDPR Ghost Mode is enabled
// Reads from apex_settings table, caches result for 5 minutes
func (g *GDPRManager) IsGDPREnabled() bool {
	if g == nil || g.db == nil {
		// Fallback to env var if manager not initialized
		return os.Getenv("GDPR_MODE") == "true"
	}

	g.mu.RLock()
	// Use cached value if still valid
	if time.Since(g.cacheTime) < GDPRCacheDuration {
		mode := g.cachedMode
		g.mu.RUnlock()
		return mode
	}
	g.mu.RUnlock()

	// Query database for current setting
	enabled := g.queryGDPRSetting()

	// Cache the result
	g.mu.Lock()
	g.cachedMode = enabled
	g.cacheTime = time.Now()
	g.mu.Unlock()

	return enabled
}

// queryGDPRSetting reads the gdpr_mode setting from the database
func (g *GDPRManager) queryGDPRSetting() bool {
	var value string
	err := g.db.QueryRow(`
		SELECT option_value FROM wp_apex_settings 
		WHERE option_name = 'gdpr_mode' 
		LIMIT 1
	`).Scan(&value)

	if err != nil {
		if err != sql.ErrNoRows {
			log.Printf("GDPR: Error reading setting: %v", err)
		}
		// Fallback to env var if DB query fails
		return os.Getenv("GDPR_MODE") == "true"
	}

	return value == "1" || value == "true" || value == "enabled"
}

// HashIP creates a privacy-preserving hash of the IP address
// Uses SHA256 with a daily-rotating salt: sha256(ip + secret + YYYY-MM-DD)
func (g *GDPRManager) HashIP(ip string) string {
	salt := g.getDailySalt()
	data := ip + salt
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:])
}

// getDailySalt generates a salt that rotates daily
// Format: secret + YYYY-MM-DD
func (g *GDPRManager) getDailySalt() string {
	today := time.Now().Format("2006-01-02")
	return g.secret + today
}

// HashIPIfEnabled hashes the IP only if GDPR mode is enabled
// Returns original IP if GDPR is off, hashed IP if GDPR is on
func (g *GDPRManager) HashIPIfEnabled(ip string) string {
	if g.IsGDPREnabled() {
		return g.HashIP(ip)
	}
	return ip
}

// InvalidateCache forces a refresh of the cached GDPR setting
func (g *GDPRManager) InvalidateCache() {
	g.mu.Lock()
	defer g.mu.Unlock()
	g.cacheTime = time.Time{} // Reset to zero time
}
