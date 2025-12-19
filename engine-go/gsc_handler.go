package main

import (
	"strconv"

	"github.com/apex-ai/engine-go/gsc"
	"github.com/gofiber/fiber/v2"
)

type GSCHandler struct {
	service *gsc.GSCService
}

func NewGSCHandler(service *gsc.GSCService) *GSCHandler {
	return &GSCHandler{service: service}
}

func (h *GSCHandler) GetTrafficOverlay(c *fiber.Ctx) error {
	days := 30
	if d := c.Query("days"); d != "" {
		if parsed, err := strconv.Atoi(d); err == nil {
			days = parsed
		}
	}

	stats, err := h.service.GetTrafficOverlay(days)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(stats)
}
