package main

import (
	"time"

	"github.com/apex-ai/engine-go/analysis"

	"github.com/gofiber/fiber/v2"
)

// PredictionHandler handles inventory prediction requests
type PredictionHandler struct{}

// PredictionRequest payload
type PredictionRequest struct {
	History []analysis.DataPoint `json:"history"`
}

func NewPredictionHandler() *PredictionHandler {
	return &PredictionHandler{}
}

func (h *PredictionHandler) PredictInventory(c *fiber.Ctx) error {
	var req PredictionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// Check if we have enough data
	if len(req.History) < 2 {
		return c.Status(400).JSON(fiber.Map{"error": "Need at least 2 data points for regression"})
	}

	// Perform Analysis
	result := analysis.PredictStockOut(req.History)

	return c.JSON(fiber.Map{
		"slope":            result.Slope,
		"days_remaining":   result.DaysRemaining,
		"stock_out_date":   result.PredictedZeroAt.Format(time.RFC3339),
		"confidence_score": result.Confidence,
		"is_risk_critical": result.DaysRemaining < 7, // Alert if < 7 days
	})
}
