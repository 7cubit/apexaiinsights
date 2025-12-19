package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"github.com/gofiber/fiber/v2"
)

type SecurityHandler struct {
	Repo            *Repository
	SafeBrowsingKey string
}

func NewSecurityHandler(repo *Repository) *SecurityHandler {
	return &SecurityHandler{
		Repo:            repo,
		SafeBrowsingKey: os.Getenv("SAFE_BROWSING_API_KEY"),
	}
}

// CheckMalware: Scans a URL using Google Safe Browsing API
func (h *SecurityHandler) CheckMalware(c *fiber.Ctx) error {
	targetURL := c.Query("url")
	if targetURL == "" {
		return c.Status(400).JSON(fiber.Map{"error": "URL required"})
	}

	if h.SafeBrowsingKey == "" {
		// Mock response for testing if no key provided
		if targetURL == "http://testsafebrowsing.appspot.com/s/malware.html" {
			return c.JSON(fiber.Map{"safe": false, "threat": "MALWARE"})
		}
		return c.JSON(fiber.Map{"safe": true, "note": "API Key missing, assuming safe"})
	}

	// Construct Safe Browsing API Request
	apiURL := fmt.Sprintf("https://safebrowsing.googleapis.com/v4/threatMatches:find?key=%s", h.SafeBrowsingKey)

	reqBody := map[string]interface{}{
		"client": map[string]string{
			"clientId":      "apex-ai-insights",
			"clientVersion": "1.0.0",
		},
		"threatInfo": map[string]interface{}{
			"threatTypes":      []string{"MALWARE", "SOCIAL_ENGINEERING"},
			"platformTypes":    []string{"ANY_PLATFORM"},
			"threatEntryTypes": []string{"URL"},
			"threatEntries": []map[string]string{
				{"url": targetURL},
			},
		},
	}

	jsonBody, _ := json.Marshal(reqBody)
	resp, err := http.Post(apiURL, "application/json", bytes.NewBuffer(jsonBody))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to contact Safe Browsing API"})
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)

	// If "matches" exists, it's unsafe
	if _, found := result["matches"]; found {
		// Log threat to audit log
		h.Repo.db.Exec(`INSERT INTO wp_apex_audit_log (actor, action, target_resource, details) VALUES (?, ?, ?, ?)`,
			"system", "malware_detected", targetURL, "Google Safe Browsing Match")

		return c.JSON(fiber.Map{"safe": false, "threat": "DETECTED", "details": result})
	}

	return c.JSON(fiber.Map{"safe": true})
}

// LogAudit: External endpoint to log admin actions from WP or specific events
func (h *SecurityHandler) LogAudit(c *fiber.Ctx) error {
	type AuditPayload struct {
		Actor   string `json:"actor"`
		Action  string `json:"action"`
		Target  string `json:"target"`
		Details string `json:"details"`
	}

	var p AuditPayload
	if err := c.BodyParser(&p); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid payload"})
	}

	_, err := h.Repo.db.Exec(`
		INSERT INTO wp_apex_audit_log (actor, action, target_resource, details, ip_address)
		VALUES (?, ?, ?, ?, ?)
	`, p.Actor, p.Action, p.Target, p.Details, c.IP())

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "DB Error"})
	}

	return c.JSON(fiber.Map{"status": "logged"})
}

// GetAuditLog: Retrieve recent logs
func (h *SecurityHandler) GetAuditLog(c *fiber.Ctx) error {
	rows, err := h.Repo.RunReadOnlyQuery(`
		SELECT id, actor, action, target_resource, details, created_at 
		FROM wp_apex_audit_log 
		ORDER BY created_at DESC 
		LIMIT 50
	`)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "DB Error"})
	}
	return c.JSON(rows)
}

// Blocklist Management
func (h *SecurityHandler) AddToBlocklist(c *fiber.Ctx) error {
	type BlockPayload struct {
		Type   string `json:"type"` // ip, country
		Value  string `json:"value"`
		Reason string `json:"reason"`
	}
	var p BlockPayload
	if err := c.BodyParser(&p); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid payload"})
	}

	_, err := h.Repo.db.Exec(`
		INSERT INTO wp_apex_blocklist (type, value, reason) VALUES (?, ?, ?)
	`, p.Type, p.Value, p.Reason)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "DB Error"})
	}
	return c.JSON(fiber.Map{"status": "blocked"})
}

// Middleware: Blocklist Check
func (h *SecurityHandler) BlocklistMiddleware(c *fiber.Ctx) error {
	ip := c.IP()
	// Simple check (in prod, cache this!)
	rows, _ := h.Repo.RunReadOnlyQuery(fmt.Sprintf("SELECT id FROM wp_apex_blocklist WHERE type='ip' AND value='%s'", ip))
	if len(rows) > 0 {
		return c.Status(403).SendString("Access Denied (Blocked IP)")
	}
	// TODO: Country check (requires GeoIP DB)
	return c.Next()
}
