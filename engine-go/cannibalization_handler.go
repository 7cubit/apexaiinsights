package main

import (
	"github.com/apex-ai/engine-go/analysis"
	"github.com/gofiber/fiber/v2"
)

type CannibalizationHandler struct {
}

func NewCannibalizationHandler() *CannibalizationHandler {
	return &CannibalizationHandler{}
}

func (h *CannibalizationHandler) GetAlerts(c *fiber.Ctx) error {
	results, err := analysis.CheckCannibalization()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(results)
}
