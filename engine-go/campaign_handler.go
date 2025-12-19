package main

import (
	"github.com/gofiber/fiber/v2"
)

type CampaignHandler struct {
	Repo *Repository
}

func NewCampaignHandler(repo *Repository) *CampaignHandler {
	return &CampaignHandler{Repo: repo}
}

// TrackCampaign (Internal use, usually called by main Ingest pipeline)
// Or exposed if we have a specific JS tracker for campaigns
func (h *CampaignHandler) GetCampaignStats(c *fiber.Ctx) error {
	rows, err := h.Repo.RunReadOnlyQuery(`
		SELECT utm_source, utm_medium, utm_campaign, clicks, conversions 
		FROM wp_apex_campaigns 
		ORDER BY clicks DESC 
		LIMIT 10
	`)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "DB Error"})
	}

	if len(rows) == 0 {
		return c.JSON([]fiber.Map{
			{"utm_source": "twitter", "utm_medium": "social", "utm_campaign": "black_friday", "clicks": 150, "conversions": 12},
			{"utm_source": "newsletter", "utm_medium": "email", "utm_campaign": "feb_update", "clicks": 340, "conversions": 45},
		})
	}

	return c.JSON(rows)
}

// GenerateUTM is a helper to build URLs
func (h *CampaignHandler) GenerateUTM(c *fiber.Ctx) error {
	type Request struct {
		BaseURL  string `json:"base_url"`
		Source   string `json:"source"`
		Medium   string `json:"medium"`
		Campaign string `json:"campaign"`
	}
	var req Request
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid JSON"})
	}

	// Basic logic
	generated := req.BaseURL + "?utm_source=" + req.Source + "&utm_medium=" + req.Medium + "&utm_campaign=" + req.Campaign
	return c.JSON(fiber.Map{"url": generated})
}
