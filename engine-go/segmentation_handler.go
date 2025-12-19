package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
)

type SegmentationHandler struct {
	repo *Repository
}

func NewSegmentationHandler(repo *Repository) *SegmentationHandler {
	return &SegmentationHandler{repo: repo}
}

// Cohort Analysis: Retention rates for Day 1, 7, 30
func (h *SegmentationHandler) GetCohorts(c *fiber.Ctx) error {
	// Simplified Cohort Logic:
	// 1. Get all visitors grouped by first_seen week
	// 2. Count how many returned in subsequent weeks
	// For MVP, we'll return mock data structure that mirrors what a real query would output
	// deeper SQL implementation required for production.

	type CohortRow struct {
		Date  string  `json:"date"`
		Users int     `json:"users"`
		Day1  float64 `json:"day1"`
		Day7  float64 `json:"day7"`
		Day30 float64 `json:"day30"`
	}

	// Mock Data for Visualization
	cohorts := []CohortRow{
		{Date: "Oct 01", Users: 1200, Day1: 45, Day7: 20, Day30: 10},
		{Date: "Oct 08", Users: 1450, Day1: 42, Day7: 22, Day30: 12},
		{Date: "Oct 15", Users: 1100, Day1: 48, Day7: 25, Day30: 15},
		{Date: "Oct 22", Users: 1600, Day1: 40, Day7: 18, Day30: 0},
	}

	return c.JSON(cohorts)
}

// Calculate Engagement Score & Personas
// Score = (Visits * 5) + (DurationMinutes * 2) + (Downloads * 10)
func (h *SegmentationHandler) CalculateScores(c *fiber.Ctx) error {
	// In a real scenario, this runs as a background job or on-demand for specific users
	// Here we simulate the scoring for a dashboard view

	type UserScore struct {
		UserID  string `json:"user_id"`
		Score   int    `json:"score"`
		Persona string `json:"persona"`
		Risk    string `json:"risk"` // Low, Medium, High
	}

	scores := []UserScore{
		{UserID: "user_123", Score: 85, Persona: "Power User", Risk: "Low"},
		{UserID: "user_456", Score: 12, Persona: "Window Shopper", Risk: "High"},
		{UserID: "user_789", Score: 45, Persona: "Researcher", Risk: "Medium"},
	}

	return c.JSON(scores)
}

// User Journey / Sankey Data
func (h *SegmentationHandler) GetSankey(c *fiber.Ctx) error {
	// Nodes: Pages. Links: Flow count.
	nodes := []map[string]interface{}{
		{"name": "Home"}, {"name": "Pricing"}, {"name": "Checkout"}, {"name": "Blog"},
		{"name": "Features"}, {"name": "Sign Up"},
	}

	links := []map[string]interface{}{
		{"source": 0, "target": 1, "value": 500}, // Home -> Pricing
		{"source": 0, "target": 3, "value": 300}, // Home -> Blog
		{"source": 0, "target": 4, "value": 200}, // Home -> Features
		{"source": 1, "target": 2, "value": 150}, // Pricing -> Checkout
		{"source": 1, "target": 0, "value": 100}, // Pricing -> Home (Bounce)
		{"source": 3, "target": 1, "value": 50},  // Blog -> Pricing
		{"source": 2, "target": 5, "value": 120}, // Checkout -> Sign Up
	}

	return c.JSON(fiber.Map{
		"nodes": nodes,
		"links": links,
	})
}

// Ingest Download Event
func (h *SegmentationHandler) TrackDownload(c *fiber.Ctx) error {
	type DownloadPayload struct {
		Event     string `json:"event"`
		FileUrl   string `json:"file_url"`
		Timestamp string `json:"timestamp"`
		Url       string `json:"url"`
	}
	var p DownloadPayload
	if err := c.BodyParser(&p); err != nil {
		return c.Status(400).SendString("Invalid payload")
	}

	// Store in DB
	// For now, just log it. Real impl would insert into wp_apex_downloads
	log.Printf("[Download] %s downloaded %s", p.Url, p.FileUrl)

	return c.SendStatus(200)
}
