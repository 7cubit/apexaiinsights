package main

import (
	"errors"
	"fmt"
	"log"
	"os"

	"github.com/apex-ai/engine-go/agent"
	"github.com/gofiber/fiber/v2"
	"github.com/redis/go-redis/v9"
)

type ChatPayload struct {
	Question string `json:"question"`
}

func SetupChatEndpoint(app *fiber.App, repo *Repository) {
	// Initialize QueryBuilder Agent
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		log.Println("Warning: OPENAI_API_KEY not set. Chat features will use fallback responses.")
	}

	qb := agent.NewQueryBuilder(apiKey)

	app.Post("/v1/ask", func(c *fiber.Ctx) error {
		var payload ChatPayload
		if err := c.BodyParser(&payload); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid JSON",
			})
		}

		if payload.Question == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Question is required",
			})
		}

		// Check license/grace period before AI features
		license := GetLicenseValidator()
		if !license.IsProModeEnabled() {
			log.Println("License expired, returning license fallback for chat")
			status := license.GetLicenseStatus()
			return c.JSON(fiber.Map{
				"status":          "license_expired",
				"answer":          FallbackLicenseExpired,
				"is_fallback":     true,
				"license_expired": true,
				"days_remaining":  status.DaysRemaining,
			})
		}

		// 1. Context Injection: Get last 24h summary
		summaryStats, _ := repo.RunReadOnlyQuery(`
			SELECT count(*) as sessions, MAX(created_at) as last_event 
			FROM wp_apex_events 
			WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
		`)

		contextStr := "No recent local data."
		if len(summaryStats) > 0 {
			contextStr = fmt.Sprintf("Recent (24h) Local Sessions: %v. ", summaryStats[0]["sessions"])
		}

		// Inject GA4 Truth Gap Context
		redisHost := os.Getenv("REDIS_HOST")
		if redisHost == "" {
			redisHost = "redis:6379"
		}
		rdb := redis.NewClient(&redis.Options{Addr: redisHost})
		ga4Data, err := rdb.Get(c.Context(), "ga4:latest_metrics").Result()
		if err == nil {
			contextStr += fmt.Sprintf("GA4 Context: %s. ", ga4Data)
			contextStr += "Instruction: If there's a discrepancy between Local and GA4 data, explain it using 'Truth Gap' logic (e.g., recovered ad-block for more local traffic, or bot filtering for more GA4 traffic)."
		}

		// 2. Generate SQL (with graceful fallback)
		sqlQuery, err := qb.GenerateSQL(payload.Question, contextStr)
		if err != nil {
			log.Printf("QueryBuilder Error: %v, returning fallback", err)

			// Check for typed errors to provide appropriate fallback
			fallbackReason := "AI temporarily unavailable"
			if errors.Is(err, agent.ErrMissingAPIKey) {
				fallbackReason = "API key not configured"
			} else if errors.Is(err, agent.ErrAPITimeout) {
				fallbackReason = "Request timed out"
			} else if errors.Is(err, agent.ErrNoResponse) {
				fallbackReason = "No AI response received"
			}

			fallback := GetChatFallback(fallbackReason)
			return c.JSON(fiber.Map{
				"status":      "partial",
				"answer":      fallback.Insight,
				"is_fallback": true,
				"reason":      fallback.Reason,
			})
		}

		// 3. Execute SQL (Validator checks happened inside GenerateSQL)
		results, err := repo.RunReadOnlyQuery(sqlQuery)
		if err != nil {
			log.Printf("Execution Error: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to execute generated query",
			})
		}

		// 4. Return Data
		return c.JSON(fiber.Map{
			"status": "ok",
			"query":  sqlQuery,
			"data":   results,
			"answer": fmt.Sprintf("I found %d results for your query.", len(results)), // Simplified text answer for now
		})
	})
}
