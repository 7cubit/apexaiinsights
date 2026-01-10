package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
)

type ComplianceHandler struct {
	Repo *Repository
}

func NewComplianceHandler(repo *Repository) *ComplianceHandler {
	return &ComplianceHandler{Repo: repo}
}

// HandleDataDeletion: Process "Right to be Forgotten"
func (h *ComplianceHandler) HandleDataDeletion(c *fiber.Ctx) error {
	email := c.Query("email") // In real usage, this should be authenticated context
	if email == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Email required"})
	}

	// 1. Delete Social Mentions (if matching author, tricky without verified identity)
	// 2. Delete Events linked to specific user ID (if email maps to user_id)
	// For MVP: Log the request

	log.Printf("[GDPR] Deletion Request for: %s", email)

	// Create audit log
	h.Repo.db.Exec(`INSERT INTO wp_apex_audit_log (actor, action, target_resource, details) VALUES (?, ?, ?, ?)`,
		"system", "gdpr_deletion_request", email, "Pending manual review")

	return c.JSON(fiber.Map{"status": "request_received", "message": "Your data deletion request has been logged for processing."})
}

// GDPRMiddleware: Redacts/hashes IP if GDPR Ghost Mode is enabled
// Reads setting from apex_settings.gdpr_mode in database
func GDPRMiddleware(c *fiber.Ctx) error {
	gdpr := GetGDPRManager()

	// Check database setting or fallback to header/env
	gdprMode := false
	if gdpr != nil {
		gdprMode = gdpr.IsGDPREnabled()
	} else {
		// Fallback if manager not initialized
		gdprMode = os.Getenv("GDPR_MODE") == "true"
	}

	// Also allow header override for per-request GDPR
	if c.Get("X-Apex-GDPR") == "true" {
		gdprMode = true
	}

	if gdprMode {
		// Hash IP with daily salt instead of full redaction
		originalIP := c.IP()
		hashedIP := "REDACTED"
		if gdpr != nil {
			hashedIP = gdpr.HashIP(originalIP)
		}
		c.Locals("ip_address", hashedIP)
		c.Locals("user_agent", "REDACTED")
		c.Locals("gdpr_active", true)
	} else {
		c.Locals("ip_address", c.IP())
		c.Locals("user_agent", c.Get("User-Agent"))
		c.Locals("gdpr_active", false)
	}

	return c.Next()
}
