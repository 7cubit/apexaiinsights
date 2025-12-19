package main

import (
	"runtime"
	"time"

	"github.com/gofiber/fiber/v2"
)

type HealthHandler struct {
	Repo *Repository
}

func NewHealthHandler(repo *Repository) *HealthHandler {
	return &HealthHandler{Repo: repo}
}

func (h *HealthHandler) CheckHealth(c *fiber.Ctx) error {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	dbStatus := "connected"
	if h.Repo.GetDB() == nil {
		dbStatus = "disconnected"
	} else if err := h.Repo.GetDB().Ping(); err != nil {
		dbStatus = "error: " + err.Error()
	}

	return c.JSON(fiber.Map{
		"status":    "healthy",
		"timestamp": time.Now().Unix(),
		"system": fiber.Map{
			"goroutines": runtime.NumGoroutine(),
			"memory_mb":  m.Alloc / 1024 / 1024,
			"os":         runtime.GOOS,
		},
		"database": fiber.Map{
			"status": dbStatus,
			// "open_connections": h.Repo.GetDB().Stats().OpenConnections,
		},
		"version": "1.0.0",
	})
}

// LicenseHandshake stubs a check against a central license server
func (h *HealthHandler) LicenseHandshake(c *fiber.Ctx) error {
	licenseKey := c.Query("key")
	if licenseKey == "" {
		return c.Status(400).JSON(fiber.Map{"valid": false, "error": "Missing key"})
	}

	// Mock valid check
	valid := licenseKey == "apex-pro-license" || len(licenseKey) > 10

	return c.JSON(fiber.Map{
		"valid":   valid,
		"tier":    "enterprise",
		"expires": time.Now().AddDate(1, 0, 0).Format("2006-01-02"),
	})
}
