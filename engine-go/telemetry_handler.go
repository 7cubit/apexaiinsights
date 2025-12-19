package main

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
)

type TelemetryHandler struct {
	repo *Repository
}

type TelemetryPayload struct {
	SessionID string          `json:"session_id"`
	FormID    string          `json:"form_id"`
	UA        string          `json:"ua"`
	Events    json.RawMessage `json:"events"`
	Metrics   json.RawMessage `json:"metrics"`
}

func NewTelemetryHandler(repo *Repository) *TelemetryHandler {
	return &TelemetryHandler{repo: repo}
}

func (h *TelemetryHandler) IngestTelemetry(c *fiber.Ctx) error {
	var payload TelemetryPayload
	if err := c.BodyParser(&payload); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid payload"})
	}

	// Basic validation
	if payload.FormID == "" {
		payload.FormID = "unknown"
	}

	// Capture User Agent from header if not in payload
	if payload.UA == "" {
		payload.UA = c.Get("User-Agent")
	}

	// Store raw payload for now.
	fullPayload := map[string]interface{}{
		"ua":      payload.UA,
		"events":  payload.Events,
		"metrics": payload.Metrics,
	}
	blob, _ := json.Marshal(fullPayload)

	_, err := h.repo.db.Exec(`
		INSERT INTO wp_apex_form_analytics (session_id, form_id, payload, created_at)
		VALUES (?, ?, ?, ?)
	`, payload.SessionID, payload.FormID, blob, time.Now())

	if err != nil {
		log.Printf("Telemetry insert error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Storage failed"})
	}

	return c.JSON(fiber.Map{"status": "ok"})
}
