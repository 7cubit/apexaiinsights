package main

import (
	"github.com/apex-ai/engine-go/analysis"
	"github.com/gofiber/fiber/v2"
)

type AuthorHandler struct {
	repo *Repository
}

func NewAuthorHandler(repo *Repository) *AuthorHandler {
	return &AuthorHandler{repo: repo}
}

func (h *AuthorHandler) GetLeaderboard(c *fiber.Ctx) error {
	stats, err := analysis.CalculateAuthorLeaderboard(h.repo.GetDB())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(stats)
}
