package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
)

type ConsistencyValidator struct {
	Repo *Repository
}

func NewConsistencyValidator(repo *Repository) *ConsistencyValidator {
	return &ConsistencyValidator{Repo: repo}
}

// Validate executes SQL checks to find orphaned records
func (cv *ConsistencyValidator) Validate(c *fiber.Ctx) error {
	results := make(map[string]int)

	db := cv.Repo.GetDB()
	if db == nil {
		return c.JSON(fiber.Map{
			"status":  "warning",
			"message": "Database not connected (Limited Mode)",
			"issues":  map[string]int{},
		})
	}

	// Check 1: Events without valid Session
	var orphanEvents int
	err := db.QueryRow("SELECT COUNT(*) FROM wp_apex_events WHERE session_id NOT IN (SELECT session_id FROM wp_apex_sessions)").Scan(&orphanEvents)
	if err != nil {
		log.Printf("Consistency check failed: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Check failed"})
	}
	results["orphan_events"] = orphanEvents

	// Check 2: Sessions without valid Visitor (Fingerprint)
	// Note: wp_apex_sessions links to visitors via fingerprint logic (or ideally a foreign key, but MyISAM/bad schema might miss it)
	var orphanSessions int
	err = db.QueryRow("SELECT COUNT(*) FROM wp_apex_sessions WHERE fingerprint NOT IN (SELECT fingerprint FROM wp_apex_visitors)").Scan(&orphanSessions)
	if err != nil {
		log.Printf("Consistency check failed: %v", err)
	}
	results["orphan_sessions"] = orphanSessions

	status := "healthy"
	if orphanEvents > 0 || orphanSessions > 0 {
		status = "inconsistent"
	}

	return c.JSON(fiber.Map{
		"status": status,
		"issues": results,
	})
}
