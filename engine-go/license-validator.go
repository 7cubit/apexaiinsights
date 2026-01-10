package main

import (
	"log"
	"os"
	"strconv"
	"sync"
	"time"
)

const (
	// GracePeriodDays is the number of days the engine runs in Pro Mode without a license
	GracePeriodDays = 7
	// GraceFileName is the file that tracks when the grace period started
	GraceFileName = "data/.grace_started"
)

// LicenseStatus represents the current state of the license
type LicenseStatus struct {
	Status        string `json:"status"`         // "licensed", "grace_active", "grace_expired"
	DaysRemaining int    `json:"days_remaining"` // Days left in grace period (0 if licensed or expired)
	GraceStart    string `json:"grace_start,omitempty"`
	GraceEnd      string `json:"grace_end,omitempty"`
	Message       string `json:"message"`
}

// LicenseValidator handles license validation and grace period tracking
type LicenseValidator struct {
	licenseKey    string
	graceFile     string
	graceDuration time.Duration
	mu            sync.RWMutex
	cachedStatus  *LicenseStatus
	cacheTime     time.Time
}

// Global license validator instance
var globalLicenseValidator *LicenseValidator
var licenseOnce sync.Once

// GetLicenseValidator returns the singleton license validator instance
func GetLicenseValidator() *LicenseValidator {
	licenseOnce.Do(func() {
		globalLicenseValidator = NewLicenseValidator()
	})
	return globalLicenseValidator
}

// NewLicenseValidator creates a new license validator
func NewLicenseValidator() *LicenseValidator {
	return &LicenseValidator{
		licenseKey:    os.Getenv("APEX_LICENSE_KEY"),
		graceFile:     GraceFileName,
		graceDuration: time.Duration(GracePeriodDays) * 24 * time.Hour,
	}
}

// IsProModeEnabled returns true if AI features should be enabled
// This is the central check for all AI-powered features
func (lv *LicenseValidator) IsProModeEnabled() bool {
	status := lv.GetLicenseStatus()
	return status.Status == "licensed" || status.Status == "grace_active"
}

// GetLicenseStatus returns detailed status about the current license state
func (lv *LicenseValidator) GetLicenseStatus() LicenseStatus {
	lv.mu.RLock()
	// Use cached status if valid (cache for 1 minute to avoid file I/O)
	if lv.cachedStatus != nil && time.Since(lv.cacheTime) < time.Minute {
		status := *lv.cachedStatus
		lv.mu.RUnlock()
		return status
	}
	lv.mu.RUnlock()

	// Calculate fresh status
	status := lv.calculateStatus()

	// Cache the result
	lv.mu.Lock()
	lv.cachedStatus = &status
	lv.cacheTime = time.Now()
	lv.mu.Unlock()

	return status
}

// calculateStatus determines the current license status
func (lv *LicenseValidator) calculateStatus() LicenseStatus {
	// Check if a valid license key is present
	if lv.isLicenseKeyValid() {
		return LicenseStatus{
			Status:        "licensed",
			DaysRemaining: 0,
			Message:       "Pro license active. All AI features enabled.",
		}
	}

	// No license key - check grace period
	graceStart := lv.getOrCreateGraceStart()
	if graceStart.IsZero() {
		// Failed to read/create grace file - default to expired for safety
		log.Println("Warning: Could not determine grace period start. Locking AI features.")
		return LicenseStatus{
			Status:        "grace_expired",
			DaysRemaining: 0,
			Message:       "License required. Unable to verify grace period.",
		}
	}

	graceEnd := graceStart.Add(lv.graceDuration)
	now := time.Now()

	if now.Before(graceEnd) {
		// Grace period still active
		remaining := graceEnd.Sub(now)
		daysRemaining := int(remaining.Hours() / 24)
		if remaining.Hours() > float64(daysRemaining*24) {
			daysRemaining++ // Round up partial days
		}

		return LicenseStatus{
			Status:        "grace_active",
			DaysRemaining: daysRemaining,
			GraceStart:    graceStart.Format("2006-01-02"),
			GraceEnd:      graceEnd.Format("2006-01-02"),
			Message:       "Pro trial active. AI features enabled.",
		}
	}

	// Grace period expired
	return LicenseStatus{
		Status:        "grace_expired",
		DaysRemaining: 0,
		GraceStart:    graceStart.Format("2006-01-02"),
		GraceEnd:      graceEnd.Format("2006-01-02"),
		Message:       "Trial expired. Add a license key to unlock AI features.",
	}
}

// isLicenseKeyValid checks if the license key is present and valid
func (lv *LicenseValidator) isLicenseKeyValid() bool {
	if lv.licenseKey == "" {
		return false
	}
	// Basic validation: key must be at least 16 characters
	// In production, this would call a license server
	return len(lv.licenseKey) >= 16
}

// getOrCreateGraceStart reads the grace start timestamp from file, or creates it
func (lv *LicenseValidator) getOrCreateGraceStart() time.Time {
	// Try to read existing grace file
	data, err := os.ReadFile(lv.graceFile)
	if err == nil {
		// Parse the timestamp
		timestamp, parseErr := strconv.ParseInt(string(data), 10, 64)
		if parseErr == nil {
			return time.Unix(timestamp, 0)
		}
		log.Printf("Warning: Invalid grace file format: %v", parseErr)
	}

	// File doesn't exist or is invalid - create new grace period
	if os.IsNotExist(err) {
		now := time.Now()
		timestamp := strconv.FormatInt(now.Unix(), 10)

		// Ensure data directory exists
		if err := os.MkdirAll("data", 0755); err != nil {
			log.Printf("Error creating data directory: %v", err)
			return time.Time{}
		}

		if err := os.WriteFile(lv.graceFile, []byte(timestamp), 0644); err != nil {
			log.Printf("Error creating grace file: %v", err)
			return time.Time{}
		}

		log.Printf("Grace period started: %s (expires %s)",
			now.Format("2006-01-02"),
			now.Add(lv.graceDuration).Format("2006-01-02"))

		return now
	}

	log.Printf("Error reading grace file: %v", err)
	return time.Time{}
}

// ResetGracePeriod removes the grace file (for testing purposes)
func (lv *LicenseValidator) ResetGracePeriod() error {
	lv.mu.Lock()
	defer lv.mu.Unlock()
	lv.cachedStatus = nil
	return os.Remove(lv.graceFile)
}
