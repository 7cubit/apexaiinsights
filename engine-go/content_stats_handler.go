package main

import (
	"fmt"

	"github.com/gofiber/fiber/v2"
)

// ContentStatsHandler provides aggregated content statistics
type ContentStatsHandler struct {
	repo *Repository
}

func NewContentStatsHandler(repo *Repository) *ContentStatsHandler {
	return &ContentStatsHandler{repo: repo}
}

// GetContentStats returns aggregated content metrics
// GET /v1/stats/content?range=7d|30d|90d
func (h *ContentStatsHandler) GetContentStats(c *fiber.Ctx) error {
	rangeParam := c.Query("range", "7d")

	var days int
	switch rangeParam {
	case "30d":
		days = 30
	case "90d":
		days = 90
	default:
		days = 7
	}

	// Total unique URLs (posts)
	var totalPosts int
	h.repo.db.QueryRow(`
		SELECT COUNT(DISTINCT url) 
		FROM wp_apex_events 
		WHERE event_type = 'pageview'
	`).Scan(&totalPosts)

	// New posts this period (unique URLs first seen in this period)
	var newPosts int
	h.repo.db.QueryRow(`
		SELECT COUNT(DISTINCT url) 
		FROM wp_apex_events 
		WHERE event_type = 'pageview'
		AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
		AND url NOT IN (
			SELECT DISTINCT url FROM wp_apex_events 
			WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
		)
	`, days, days).Scan(&newPosts)

	// Average time on page from events with time_on_page data
	var avgTimeSeconds float64
	h.repo.db.QueryRow(`
		SELECT COALESCE(AVG(JSON_EXTRACT(payload, '$.time_on_page')), 180)
		FROM wp_apex_events 
		WHERE event_type = 'pageview'
		AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
		AND JSON_EXTRACT(payload, '$.time_on_page') IS NOT NULL
	`, days).Scan(&avgTimeSeconds)

	// Previous period avg time for comparison
	var prevAvgTime float64
	h.repo.db.QueryRow(`
		SELECT COALESCE(AVG(JSON_EXTRACT(payload, '$.time_on_page')), 180)
		FROM wp_apex_events 
		WHERE event_type = 'pageview'
		AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
		AND created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
		AND JSON_EXTRACT(payload, '$.time_on_page') IS NOT NULL
	`, days*2, days).Scan(&prevAvgTime)

	// Top performing post
	var topPostURL string
	var topPostViews int
	h.repo.db.QueryRow(`
		SELECT url, COUNT(*) as views
		FROM wp_apex_events 
		WHERE event_type = 'pageview'
		AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
		GROUP BY url
		ORDER BY views DESC
		LIMIT 1
	`, days).Scan(&topPostURL, &topPostViews)

	// Calculate decay rate (percentage of posts declining)
	var totalTrackedPosts, decliningPosts int
	h.repo.db.QueryRow(`
		SELECT COUNT(DISTINCT url) FROM wp_apex_events 
		WHERE event_type = 'pageview'
		AND created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY)
	`).Scan(&totalTrackedPosts)

	// Count posts with declining views (simplified)
	h.repo.db.QueryRow(`
		WITH CurrentPeriod AS (
			SELECT url, COUNT(*) as views 
			FROM wp_apex_events 
			WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
			AND event_type = 'pageview'
			GROUP BY url
		),
		PreviousPeriod AS (
			SELECT url, COUNT(*) as views 
			FROM wp_apex_events 
			WHERE created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY)
			AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
			AND event_type = 'pageview'
			GROUP BY url
		)
		SELECT COUNT(*) FROM PreviousPeriod p
		LEFT JOIN CurrentPeriod c ON p.url = c.url
		WHERE COALESCE(c.views, 0) < p.views * 0.85
	`).Scan(&decliningPosts)

	var decayRate float64
	if totalTrackedPosts > 0 {
		decayRate = float64(decliningPosts) / float64(totalTrackedPosts) * 100
	}

	// Format time difference
	timeDiff := avgTimeSeconds - prevAvgTime
	timeChangeStr := "0s"
	if timeDiff > 0 {
		timeChangeStr = "+" + formatSeconds(timeDiff)
	} else if timeDiff < 0 {
		timeChangeStr = "-" + formatSeconds(-timeDiff)
	}

	// Extract title from top post URL
	topPostTitle := extractTitleFromURL(topPostURL)

	return c.JSON(fiber.Map{
		"total_posts":       totalPosts,
		"new_this_period":   newPosts,
		"avg_read_time":     formatSecondsToTime(avgTimeSeconds),
		"read_time_change":  timeChangeStr,
		"decay_rate":        decayRate,
		"decaying_posts":    decliningPosts,
		"top_post":          topPostTitle,
		"top_post_views":    topPostViews,
		"range":             rangeParam,
	})
}

func formatSeconds(s float64) string {
	secs := int(s)
	if secs >= 60 {
		return formatSecondsToTime(s)
	}
	return fmt.Sprintf("%ds", secs)
}

func formatSecondsToTime(s float64) string {
	mins := int(s) / 60
	secs := int(s) % 60
	return fmt.Sprintf("%d:%02d", mins, secs)
}

func extractTitleFromURL(url string) string {
	if len(url) < 10 {
		return "Homepage"
	}
	
	for i := len(url) - 1; i >= 0; i-- {
		if url[i] == '/' && i < len(url)-1 {
			slug := url[i+1:]
			return capitalizeSlugForTitle(slug)
		}
	}
	return "Content Page"
}

func capitalizeSlugForTitle(slug string) string {
	if len(slug) == 0 {
		return ""
	}
	result := make([]byte, 0, len(slug))
	nextUpper := true
	for i := 0; i < len(slug); i++ {
		c := slug[i]
		if c == '-' || c == '_' {
			result = append(result, ' ')
			nextUpper = true
		} else if nextUpper && c >= 'a' && c <= 'z' {
			result = append(result, c-32)
			nextUpper = false
		} else {
			result = append(result, c)
			nextUpper = false
		}
	}
	return string(result)
}
