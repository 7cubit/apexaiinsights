package main

import (
	"bytes"
	"compress/gzip"
	"encoding/json"
	"log"

	"github.com/gofiber/fiber/v2"
)

type RecordingHandler struct {
	repo *Repository
}

type ReplayChunk struct {
	SessionID string          `json:"sid"`
	Events    json.RawMessage `json:"events"` // Keep as raw JSON to compress later
	IsFinal   bool            `json:"is_final"`
}

func NewRecordingHandler(repo *Repository) *RecordingHandler {
	return &RecordingHandler{repo: repo}
}

func (h *RecordingHandler) IngestChunk(c *fiber.Ctx) error {
	var payload ReplayChunk
	if err := c.BodyParser(&payload); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid payload"})
	}

	if payload.SessionID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Session ID required"})
	}

	// 1. Binary Compression (GZIP)
	// We compress the raw JSON events before storing to save ~80% space
	var b bytes.Buffer
	gz := gzip.NewWriter(&b)
	if _, err := gz.Write(payload.Events); err != nil {
		log.Printf("Gzip error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Compression failed"})
	}
	if err := gz.Close(); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Compression close failed"})
	}
	compressedEvents := b.Bytes()

	// 2. Store in DB
	// We need to determine sequence. For MVP, we'll just insert and rely on auto-increment ID or trust client order?
	// Ideally client sends sequence. Let's assume sequential arrival for MVP or just query by created_at.
	// In production, we'd want a sequence ID from client.

	_, err := h.repo.db.Exec(`
		INSERT INTO wp_apex_recordings (session_id, chunk_sequence, events_blob, created_at)
		VALUES (?, 0, ?, NOW())
	`, payload.SessionID, compressedEvents)

	if err != nil {
		log.Printf("Recording insert error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Storage failed"})
	}

	// Future: Rage Click Analysis here on `payload.Events` before compression

	return c.JSON(fiber.Map{"status": "ok"})
}

// GetSessionRecording retrieves and decompresses all chunks for a session
func (h *RecordingHandler) GetSessionRecording(c *fiber.Ctx) error {
	sid := c.Params("sessionId")

	rows, err := h.repo.db.Query(`
        SELECT events_blob FROM wp_apex_recordings 
        WHERE session_id = ? 
        ORDER BY id ASC
    `, sid)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Query failed"})
	}
	defer rows.Close()

	var allEvents []json.RawMessage

	for rows.Next() {
		var blob []byte
		if err := rows.Scan(&blob); err != nil {
			continue
		}

		// Decompress
		r, err := gzip.NewReader(bytes.NewReader(blob))
		if err != nil {
			continue
		}

		var chunkEvents []json.RawMessage
		if err := json.NewDecoder(r).Decode(&chunkEvents); err == nil {
			allEvents = append(allEvents, chunkEvents...)
		}
		r.Close()
	}

	return c.JSON(fiber.Map{
		"events": allEvents,
	})
}

// GetRecentRecordings lists valid sessions with optional filters
func (h *RecordingHandler) GetRecentRecordings(c *fiber.Ctx) error {
	filter := c.Query("filter") // "rage", "errors", "active"

	baseQuery := `
        SELECT r.session_id, MIN(r.created_at) as started_at, MAX(r.created_at) as last_active, COUNT(r.id) as chunks
        FROM wp_apex_recordings r
    `
	groupBy := ` GROUP BY r.session_id ORDER BY last_active DESC LIMIT 50`

	var query string
	var args []interface{}

	if filter == "rage" {
		query = baseQuery + `
            JOIN wp_apex_events e ON r.session_id = e.session_id
            WHERE e.event_name = 'rage_click'
        ` + groupBy
	} else if filter == "errors" {
		query = baseQuery + `
            JOIN wp_apex_events e ON r.session_id = e.session_id
            WHERE e.event_name = 'console_error'
        ` + groupBy
	} else if filter == "active" {
		query = `
			SELECT r.session_id, MIN(r.created_at) as started_at, MAX(r.created_at) as last_active, COUNT(r.id) as chunks
			FROM wp_apex_recordings r
			GROUP BY r.session_id
			HAVING last_active > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
			ORDER BY last_active DESC LIMIT 50
		`
	} else {
		query = baseQuery + groupBy
	}

	rows, err := h.repo.db.Query(query, args...)
	if err != nil {
		log.Printf("Query failed: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Query failed"})
	}
	defer rows.Close()

	type RecordingSummary struct {
		SessionID  string `json:"sid"`
		StartedAt  string `json:"started_at"`
		LastActive string `json:"last_active"`
		Chunks     int    `json:"chunks"`
		IsActive   bool   `json:"is_active,omitempty"`
	}

	var recordings []RecordingSummary
	for rows.Next() {
		var r RecordingSummary
		if err := rows.Scan(&r.SessionID, &r.StartedAt, &r.LastActive, &r.Chunks); err != nil {
			continue
		}
		// Calculate IsActive (redundant for "active" filter but useful for "all")
		// Ideally done in SQL but simple string check here is fine for MVP or just assume if fetched via active filter.
		// Let's simpler: Frontend can deduce "Active" if LastActive is recent.
		recordings = append(recordings, r)
	}

	return c.JSON(recordings)
}
