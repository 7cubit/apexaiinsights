package main

import (
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
)

type SearchHandler struct {
	repo *Repository
}

func NewSearchHandler(repo *Repository) *SearchHandler {
	return &SearchHandler{repo: repo}
}

type SearchPayload struct {
	Query       string `json:"query"`
	ResultCount int    `json:"result_count"`
	SessionID   string `json:"session_id"`
	UA          string `json:"ua"`
}

type NotFoundPayload struct {
	URL       string `json:"url"`
	Referrer  string `json:"referrer"`
	SessionID string `json:"session_id"`
	UA        string `json:"ua"`
}

// IngestSearch tracks internal search queries
func (h *SearchHandler) IngestSearch(c *fiber.Ctx) error {
	var payload SearchPayload
	if err := c.BodyParser(&payload); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid payload"})
	}

	if payload.UA == "" {
		payload.UA = c.Get("User-Agent")
	}

	_, err := h.repo.db.Exec(`
		INSERT INTO wp_apex_search_analytics (query, result_count, ua, session_id, created_at)
		VALUES (?, ?, ?, ?, ?)
	`, payload.Query, payload.ResultCount, payload.UA, payload.SessionID, time.Now())

	if err != nil {
		log.Printf("Search insert error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Storage failed"})
	}

	return c.JSON(fiber.Map{"status": "ok"})
}

// Ingest404 tracks 404 errors
func (h *SearchHandler) Ingest404(c *fiber.Ctx) error {
	var payload NotFoundPayload
	if err := c.BodyParser(&payload); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid payload"})
	}

	if payload.UA == "" {
		payload.UA = c.Get("User-Agent")
	}

	_, err := h.repo.db.Exec(`
		INSERT INTO wp_apex_404_logs (url, referrer, ua, session_id, created_at)
		VALUES (?, ?, ?, ?, ?)
	`, payload.URL, payload.Referrer, payload.UA, payload.SessionID, time.Now())

	if err != nil {
		log.Printf("404 insert error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Storage failed"})
	}

	return c.JSON(fiber.Map{"status": "ok"})
}

// GetSearchStats aggregates search data for the dashboard
func (h *SearchHandler) GetSearchStats(c *fiber.Ctx) error {
	// 1. Top Queries
	rows, err := h.repo.db.Query(`
		SELECT query, COUNT(*) as count, AVG(result_count) as avg_results 
		FROM wp_apex_search_analytics 
		GROUP BY query 
		ORDER BY count DESC 
		LIMIT 10
	`)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	type SearchStat struct {
		Query      string  `json:"query"`
		Count      int     `json:"count"`
		AvgResults float64 `json:"avg_results"`
	}
	var topQueries []SearchStat

	for rows.Next() {
		var s SearchStat
		if err := rows.Scan(&s.Query, &s.Count, &s.AvgResults); err == nil {
			topQueries = append(topQueries, s)
		}
	}

	// 2. Zero Result Searches (Content Gaps)
	gapRows, err := h.repo.db.Query(`
		SELECT query, COUNT(*) as count 
		FROM wp_apex_search_analytics 
		WHERE result_count = 0 
		GROUP BY query 
		ORDER BY count DESC 
		LIMIT 10
	`)
	if err != nil {
		log.Printf("Gap query error: %v", err)
	} else {
		defer gapRows.Close()
	}

	var gaps []struct {
		Query string `json:"query"`
		Count int    `json:"count"`
	}

	if gapRows != nil {
		for gapRows.Next() {
			var g struct {
				Query string `json:"query"`
				Count int    `json:"count"`
			}
			if err := gapRows.Scan(&g.Query, &g.Count); err == nil {
				gaps = append(gaps, g)
			}
		}
	}

	// 3. Recent 404s
	notfoundRows, err := h.repo.db.Query(`
		SELECT url, referrer, COUNT(*) as count 
		FROM wp_apex_404_logs 
		GROUP BY url, referrer 
		ORDER BY created_at DESC 
		LIMIT 10
	`)
	if err != nil {
		log.Printf("404 query error: %v", err)
	} else {
		defer notfoundRows.Close()
	}

	var recent404s []struct {
		URL      string `json:"url"`
		Referrer string `json:"referrer"`
		Count    int    `json:"count"`
	}

	if notfoundRows != nil {
		for notfoundRows.Next() {
			var n struct {
				URL      string `json:"url"`
				Referrer string `json:"referrer"`
				Count    int    `json:"count"`
			}
			if err := notfoundRows.Scan(&n.URL, &n.Referrer, &n.Count); err == nil {
				recent404s = append(recent404s, n)
			}
		}
	}

	return c.JSON(fiber.Map{
		"top_queries": topQueries,
		"gaps":        gaps,
		"recent_404s": recent404s,
	})
}
