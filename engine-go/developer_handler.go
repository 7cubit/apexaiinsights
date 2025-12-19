package main

import (
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
)

type DeveloperHandler struct {
	Repo *Repository
}

type Webhook struct {
	ID         int    `json:"id"`
	TargetURL  string `json:"target_url"`
	EventTypes string `json:"event_types"`
	Secret     string `json:"secret"`
	IsActive   bool   `json:"is_active"`
	CreatedAt  string `json:"created_at"`
}

func NewDeveloperHandler(repo *Repository) *DeveloperHandler {
	return &DeveloperHandler{Repo: repo}
}

// Public API: Get Stats (Protected by API Key - mock check for now)
func (h *DeveloperHandler) GetPublicStats(c *fiber.Ctx) error {
	apiKey := c.Get("X-Apex-API-Key")
	if apiKey == "" {
		return c.Status(401).JSON(fiber.Map{"error": "Missing API Key"})
	}

	// In real world, validate key against DB user/site
	// For now, just return aggregated stats
	stats, _ := h.Repo.GetDailyStats()
	return c.JSON(fiber.Map{
		"meta": fiber.Map{
			"timestamp": time.Now(),
			"version":   "1.0.0",
		},
		"data": stats,
	})
}

// Webhooks: List
func (h *DeveloperHandler) ListWebhooks(c *fiber.Ctx) error {
	rows, err := h.Repo.GetDB().Query("SELECT id, target_url, event_types, secret, is_active, created_at FROM wp_apex_webhooks")
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}
	defer rows.Close()

	var webhooks []Webhook
	for rows.Next() {
		var w Webhook
		if err := rows.Scan(&w.ID, &w.TargetURL, &w.EventTypes, &w.Secret, &w.IsActive, &w.CreatedAt); err != nil {
			continue
		}
		webhooks = append(webhooks, w)
	}
	return c.JSON(webhooks)
}

// Webhooks: Create
func (h *DeveloperHandler) CreateWebhook(c *fiber.Ctx) error {
	var req struct {
		TargetURL  string `json:"target_url"`
		EventTypes string `json:"event_types"` // e.g., '["alert", "report"]'
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	secret := "whsec_" + time.Now().Format("20060102150405") // Mock secret gen

	_, err := h.Repo.GetDB().Exec("INSERT INTO wp_apex_webhooks (target_url, event_types, secret) VALUES (?, ?, ?)",
		req.TargetURL, req.EventTypes, secret)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to save webhook"})
	}

	return c.JSON(fiber.Map{"status": "created", "secret": secret})
}

// Webhooks: Test Dispatch (Trigger a fake event)
func (h *DeveloperHandler) TestWebhook(c *fiber.Ctx) error {
	id := c.Params("id")
	// In production, this would look up the URL and send a POST request
	// Here we just log it
	log.Printf("[Webhook-Dispatch] Mock sending event to Webhook ID %s", id)
	return c.JSON(fiber.Map{"status": "dispatched", "payload": "mock_event"})
}

// GraphQL Stub (Simple Query)
func (h *DeveloperHandler) GraphQLHandler(c *fiber.Ctx) error {
	// This would ideally integrate with `graphql-go/graphql`
	// Returning a mock schema response for "stats" query
	return c.JSON(fiber.Map{
		"data": fiber.Map{
			"site": fiber.Map{
				"visitors": 12500,
				"revenue":  4500.50,
			},
		},
	})
}
