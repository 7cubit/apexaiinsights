package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type GodModeHandler struct {
	Repo *Repository
}

func NewGodModeHandler(repo *Repository) *GodModeHandler {
	return &GodModeHandler{Repo: repo}
}

// Connect: Handshake endpoint for remote plugins to register
// POST /v1/god/connect
func (h *GodModeHandler) Connect(c *fiber.Ctx) error {
	type ConnectPayload struct {
		Domain  string `json:"domain"`
		Version string `json:"version"`
	}
	var p ConnectPayload
	if err := c.BodyParser(&p); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid payload"})
	}

	apiKey := uuid.New().String()

	// Upsert instance
	_, err := h.Repo.db.Exec(`
		INSERT INTO wp_apex_instances (domain, api_key, status, plugin_version, last_heartbeat)
		VALUES (?, ?, 'active', ?, NOW())
		ON DUPLICATE KEY UPDATE 
			status='active', 
			plugin_version=VALUES(plugin_version), 
			last_heartbeat=NOW(),
			api_key=VALUES(api_key) -- Rotate key on re-connect
	`, p.Domain, apiKey, p.Version)

	if err != nil {
		log.Printf("[GodMode] Registration failed: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "DB Error"})
	}

	return c.JSON(fiber.Map{
		"status":  "connected",
		"api_key": apiKey, // Return generated key for the plugin to store
	})
}

// Heartbeat: Receive ping, update status, and return pending commands
// POST /v1/god/heartbeat
func (h *GodModeHandler) Heartbeat(c *fiber.Ctx) error {
	apiKey := c.Get("X-Apex-Key")
	if apiKey == "" {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	// 1. Update Heartbeat
	res, err := h.Repo.db.Exec(`
		UPDATE wp_apex_instances 
		SET last_heartbeat=NOW(), status='active' 
		WHERE api_key=?
	`, apiKey)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "DB Error"})
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid Key"})
	}

	// 2. Fetch Pending Commands
	// We need the ID first. Ideally we cache Key->ID mapping.
	// For MVP doing a subquery or join is fine.
	rows, err := h.Repo.RunReadOnlyQuery(`
		SELECT c.id, c.command, c.payload 
		FROM wp_apex_remote_commands c
		JOIN wp_apex_instances i ON c.instance_id = i.id
		WHERE i.api_key = '` + apiKey + `' AND c.status = 'queued'
		ORDER BY c.created_at ASC
	`)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Command Fetch Error"})
	}

	// If commands sent, mark them as 'sent/processing'
	// Simplified loop
	// In production, transactionally mark fetched commands

	commands := []map[string]interface{}{}
	for _, r := range rows {
		commands = append(commands, r)
		// Mark as processing
		h.Repo.db.Exec(`UPDATE wp_apex_remote_commands SET status='processing' WHERE id=?`, r["id"])
	}

	return c.JSON(fiber.Map{
		"status":   "ok",
		"commands": commands,
	})
}

// ListInstances: For Dashboard
func (h *GodModeHandler) ListInstances(c *fiber.Ctx) error {
	rows, err := h.Repo.RunReadOnlyQuery(`
		SELECT id, domain, status, plugin_version, last_heartbeat,
		TIMESTAMPDIFF(SECOND, last_heartbeat, NOW()) as seconds_since_heartbeat
		FROM wp_apex_instances
		ORDER BY domain ASC
	`)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "DB Error"})
	}
	return c.JSON(rows)
}

// QueueCommand: Admin sends command to instance
func (h *GodModeHandler) QueueCommand(c *fiber.Ctx) error {
	type CmdPayload struct {
		InstanceID int    `json:"instance_id"`
		Command    string `json:"command"`
		Payload    string `json:"payload"`
	}
	var p CmdPayload
	if err := c.BodyParser(&p); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid payload"})
	}

	_, err := h.Repo.db.Exec(`
		INSERT INTO wp_apex_remote_commands (instance_id, command, payload, status)
		VALUES (?, ?, ?, 'queued')
	`, p.InstanceID, p.Command, p.Payload)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "DB Error"})
	}

	return c.JSON(fiber.Map{"status": "queued"})
}
