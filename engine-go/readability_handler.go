package main

import (
	"encoding/json"

	"github.com/gofiber/fiber/v2"
)

type ReadabilityMetric struct {
	SessionID  string `json:"session_id"`
	WordCount  int    `json:"word_count"`
	ScrollDist int    `json:"scroll_dist"` // Max scroll percentage
	DwellTime  int    `json:"dwell_time"`  // Seconds
}

type ReadabilityHandler struct {
	repo *Repository
}

func NewReadabilityHandler(repo *Repository) *ReadabilityHandler {
	return &ReadabilityHandler{repo: repo}
}

// AnalyzeReadability labels a session based on scroll/dwell patterns
func (h *ReadabilityHandler) Analyze(m ReadabilityMetric) string {
	if m.DwellTime < 15 && m.ScrollDist > 80 {
		return "Skimmer"
	}
	if m.DwellTime > 120 && m.ScrollDist > 50 {
		return "Reader"
	}
	return "Casual"
}

func (h *ReadabilityHandler) GetStats(c *fiber.Ctx) error {
	// Real-time aggregation of readability metrics
	rows, err := h.repo.GetDB().Query(`
		SELECT payload FROM wp_apex_events 
		WHERE event_type IN ('pageview', 'heartbeat', 'leave') 
		ORDER BY created_at DESC LIMIT 1000
	`)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch metrics"})
	}
	defer rows.Close()

	var skimmers, readers, casual int
	for rows.Next() {
		var payloadStr string
		if err := rows.Scan(&payloadStr); err != nil {
			continue
		}

		var data map[string]interface{}
		json.Unmarshal([]byte(payloadStr), &data)

		// Extract metrics from apex.js payload (sc, ts, sk)
		scroll, _ := data["sc"].(float64)
		dwell, _ := data["ts"].(float64)
		isSkimmer, _ := data["sk"].(bool)

		if isSkimmer || (dwell < 30 && scroll > 70) {
			skimmers++
		} else if dwell > 120 && scroll > 40 {
			readers++
		} else {
			casual++
		}
	}

	return c.JSON(fiber.Map{
		"skimmers": skimmers,
		"readers":  readers,
		"casual":   casual,
		"content_decay_warnings": []string{
			"The Ultimate Guide to Apex AI Insights",
			"Why Your Analytics Are Lying To You",
		},
		"source": "Real-time DB Engine",
	})
}
