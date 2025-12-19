package main

import (
	"encoding/json"
	"strings"

	"github.com/gofiber/fiber/v2"
)

type FormStatsHandler struct {
	repo *Repository
}

func NewFormStatsHandler(repo *Repository) *FormStatsHandler {
	return &FormStatsHandler{repo: repo}
}

type FormFieldStat struct {
	Name         string  `json:"name"`
	TotalDwell   float64 `json:"total_dwell"`
	Interactions int     `json:"interactions"`
	DropOffs     int     `json:"drop_offs"`
	AvgDwellTime float64 `json:"avgDwellTime"`
}

type FormSummary struct {
	FormID      string                    `json:"formId"`
	Starters    int                       `json:"starters"`
	Completions int                       `json:"completions"`
	Fields      map[string]*FormFieldStat `json:"-"` // Internal map
	FieldList   []*FormFieldStat          `json:"fields"`
	DeviceStats map[string]int            `json:"device_stats"`
}

func (h *FormStatsHandler) GetStats(c *fiber.Ctx) error {
	// Re-do logic with correct understanding
	return h.getStatsCorrect(c)
}

func (h *FormStatsHandler) getStatsCorrect(c *fiber.Ctx) error {
	rows, err := h.repo.db.Query("SELECT form_id, payload FROM wp_apex_form_analytics ORDER BY created_at DESC LIMIT 1000")
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	forms := make(map[string]*FormSummary)

	for rows.Next() {
		var formID string
		var blob []byte
		if err := rows.Scan(&formID, &blob); err != nil {
			continue
		}

		if _, exists := forms[formID]; !exists {
			forms[formID] = &FormSummary{
				FormID:      formID,
				Fields:      make(map[string]*FormFieldStat),
				DeviceStats: make(map[string]int),
			}
		}
		summary := forms[formID]
		summary.Starters++ // Assume every row is a starter session

		var content struct {
			Events []struct {
				Type     string  `json:"type"`
				Field    string  `json:"field"`
				Duration float64 `json:"time"`
			} `json:"events"`
			UA string `json:"ua"`
		}

		if err := json.Unmarshal(blob, &content); err != nil {
			continue
		}

		// Device Detection
		deviceType := "desktop"
		if strings.Contains(strings.ToLower(content.UA), "mobile") || strings.Contains(strings.ToLower(content.UA), "android") || strings.Contains(strings.ToLower(content.UA), "iphone") {
			deviceType = "mobile"
		}
		summary.DeviceStats[deviceType]++

		// Check for completion
		isComplete := false
		for _, e := range content.Events {
			if e.Type == "submit" {
				isComplete = true
			}
			if e.Type == "blur" && e.Field != "" {
				if _, ok := summary.Fields[e.Field]; !ok {
					summary.Fields[e.Field] = &FormFieldStat{Name: e.Field}
				}
				stat := summary.Fields[e.Field]
				stat.Interactions++
				stat.TotalDwell += e.Duration
			}
		}
		if isComplete {
			summary.Completions++
		}
	}

	// Flatten results
	var result []*FormSummary
	for _, s := range forms {
		for _, f := range s.Fields {
			if f.Interactions > 0 {
				f.AvgDwellTime = f.TotalDwell / float64(f.Interactions)
			}
			s.FieldList = append(s.FieldList, f)
		}
		result = append(result, s)
	}

	return c.JSON(result)
}
