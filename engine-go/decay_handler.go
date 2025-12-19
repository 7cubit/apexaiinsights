package main

import (
	"github.com/apex-ai/engine-go/analysis"
	"github.com/gofiber/fiber/v2"
)

type DecayHandler struct {
	repo *Repository
}

func NewDecayHandler(repo *Repository) *DecayHandler {
	return &DecayHandler{repo: repo}
}

func (h *DecayHandler) GetContentDecay(c *fiber.Ctx) error {
	results, err := analysis.CalculateContentDecay(h.repo.GetDB())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(results)
}
