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

// GDPRMiddleware: Redacts IP if GDPR Mode is ON
func GDPRMiddleware(c *fiber.Ctx) error {
	gdprMode := os.Getenv("GDPR_MODE") == "true" || c.Get("X-Apex-GDPR") == "true"

	if gdprMode {
		c.Locals("ip_address", "REDACTED")
		c.Locals("user_agent", "REDACTED")
	} else {
		c.Locals("ip_address", c.IP())
		c.Locals("user_agent", c.Get("User-Agent"))
	}

	return c.Next()
}
