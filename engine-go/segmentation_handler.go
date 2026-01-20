package main

import (
	"fmt"
	"log"
	"strings"

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
	query := `
		WITH FirstVisit AS (
			SELECT fingerprint, DATE(first_seen) as cohort_date
			FROM wp_apex_visitors
			WHERE first_seen >= DATE_SUB(NOW(), INTERVAL 60 DAY)
			GROUP BY fingerprint, DATE(first_seen)
		),
		Retention AS (
			SELECT 
				f.cohort_date,
				s.fingerprint,
				DATEDIFF(DATE(s.started_at), f.cohort_date) as day_diff
			FROM FirstVisit f
			JOIN wp_apex_sessions s ON f.fingerprint = s.fingerprint
		)
		SELECT 
			DATE_FORMAT(cohort_date, '%b %d') as date,
			COUNT(DISTINCT fingerprint) as users,
			ROUND(100 * COUNT(DISTINCT CASE WHEN day_diff >= 1 THEN fingerprint END) / COUNT(DISTINCT fingerprint), 1) as day1,
			ROUND(100 * COUNT(DISTINCT CASE WHEN day_diff >= 7 THEN fingerprint END) / COUNT(DISTINCT fingerprint), 1) as day7,
			ROUND(100 * COUNT(DISTINCT CASE WHEN day_diff >= 30 THEN fingerprint END) / COUNT(DISTINCT fingerprint), 1) as day30
		FROM Retention
		GROUP BY cohort_date
		ORDER BY cohort_date DESC
		LIMIT 10
	`
	rows, err := h.repo.RunReadOnlyQuery(query)
	if err != nil {
		log.Printf("[Cohort Error] %v", err)
		return c.Status(500).SendString("Cohort analysis failed")
	}

	return c.JSON(rows)
}

// Calculate Engagement Score & Personas
// Score = (Visits * 5) + (DurationMinutes * 2) + (Downloads * 10)
func (h *SegmentationHandler) CalculateScores(c *fiber.Ctx) error {
	query := `
		SELECT 
			ANY_VALUE(v.fingerprint) as user_id,
			(COUNT(s.session_id) * 5 + SUM(s.page_count)) as score,
			CASE 
				WHEN (COUNT(s.session_id) * 5 + SUM(s.page_count)) > 80 THEN 'Power User'
				WHEN (COUNT(s.session_id) * 5 + SUM(s.page_count)) > 40 THEN 'Researcher'
				ELSE 'Window Shopper'
			END as persona,
			CASE 
				WHEN MAX(s.last_activity) < DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 'High'
				WHEN MAX(s.last_activity) < DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 'Medium'
				ELSE 'Low'
			END as risk
		FROM wp_apex_visitors v
		LEFT JOIN wp_apex_sessions s ON v.fingerprint = s.fingerprint
		GROUP BY v.fingerprint
		LIMIT 20
	`
	scores, err := h.repo.RunReadOnlyQuery(query)
	if err != nil {
		log.Printf("[Score Error] %v", err)
		return c.Status(500).SendString("Score calculation failed")
	}

	// Calculate summary KPIs
	avgScore := 0.0
	powerUserCount := 0
	highRiskCount := 0
	if len(scores) > 0 {
		total := 0.0
		for _, s := range scores {
			sc := 0.0
			switch v := s["score"].(type) {
			case float64:
				sc = v
			case int64:
				sc = float64(v)
			case int:
				sc = float64(v)
			case string:
				fmt.Sscanf(v, "%f", &sc)
			}
			total += sc
			if s["persona"] == "Power User" {
				powerUserCount++
			}
			if s["risk"] == "High" {
				highRiskCount++
			}
		}
		avgScore = total / float64(len(scores))
	}

	topPersona := "Window Shopper"
	if powerUserCount > 0 {
		topPersona = "Power User"
	}

	return c.JSON(fiber.Map{
		"topPersona":  topPersona,
		"avgScore":    int(avgScore),
		"scoreChange": "+5%", // Mocking change for now
		"churnRisk":   int(float64(highRiskCount) / float64(len(scores)+1) * 100),
		"scores":      scores,
	})
}

// User Journey / Sankey Data
func (h *SegmentationHandler) GetSankey(c *fiber.Ctx) error {
	query := `
		WITH RawEvents AS (
			SELECT session_id, url, ROW_NUMBER() OVER(PARTITION BY session_id ORDER BY created_at) as step
			FROM wp_apex_events
			WHERE event_type = 'pageview' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
		),
		Transitions AS (
			SELECT e1.url as source, e2.url as target
			FROM RawEvents e1
			JOIN RawEvents e2 ON e1.session_id = e2.session_id AND e1.step + 1 = e2.step
		)
		SELECT source, target, COUNT(*) as value
		FROM Transitions
		GROUP BY source, target
		ORDER BY value DESC
		LIMIT 50
	`
	rows, err := h.repo.RunReadOnlyQuery(query)
	if err != nil {
		log.Printf("[Sankey Error] %v", err)
		return c.Status(500).SendString("Sankey analysis failed")
	}

	// Map to Nodes and Links
	nodeMap := make(map[string]int)
	nodes := []map[string]interface{}{}
	links := []map[string]interface{}{}

	getNode := func(name string) int {
		if idx, ok := nodeMap[name]; ok {
			return idx
		}
		idx := len(nodes)
		nodeMap[name] = idx
		nodes = append(nodes, map[string]interface{}{"name": simplifyURL(name)})
		return idx
	}

	for _, row := range rows {
		source := row["source"].(string)
		target := row["target"].(string)
		val := 0
		switch v := row["value"].(type) {
		case int64:
			val = int(v)
		case int:
			val = v
		}

		links = append(links, map[string]interface{}{
			"source": getNode(source),
			"target": getNode(target),
			"value":  val,
		})
	}

	return c.JSON(fiber.Map{
		"nodes": nodes,
		"links": links,
	})
}

func simplifyURL(rawURL string) string {
	// Simple cleanup: /blog/post-1 -> Blog: post-1
	if rawURL == "/" || rawURL == "" {
		return "Home"
	}
	// Strip domain if exists
	parts := strings.Split(rawURL, "/")
	if len(parts) > 1 {
		last := parts[len(parts)-1]
		if last == "" && len(parts) > 2 {
			last = parts[len(parts)-2]
		}
		return last
	}
	return rawURL
}

// Ingest Download Event
func (h *SegmentationHandler) TrackDownload(c *fiber.Ctx) error {
	type DownloadPayload struct {
		Event     string `json:"event"`
		FileUrl   string `json:"file_url"`
		Timestamp string `json:"timestamp"`
		Url       string `json:"url"`
		SessionID string `json:"session_id"`
	}
	var p DownloadPayload
	if err := c.BodyParser(&p); err != nil {
		return c.Status(400).SendString("Invalid payload")
	}

	_, err := h.repo.GetDB().Exec(`
		INSERT INTO wp_apex_downloads (url, file_url, session_id, created_at)
		VALUES (?, ?, ?, NOW())
	`, p.Url, p.FileUrl, p.SessionID)

	if err != nil {
		log.Printf("[Download Error] %v", err)
	}

	return c.SendStatus(200)
}

// Segment CRUD
func (h *SegmentationHandler) GetSegments(c *fiber.Ctx) error {
	rows, err := h.repo.RunReadOnlyQuery("SELECT id, name, criteria, created_at FROM wp_apex_segments ORDER BY created_at DESC")
	if err != nil {
		return c.Status(500).SendString(err.Error())
	}
	return c.JSON(rows)
}

func (h *SegmentationHandler) CreateSegment(c *fiber.Ctx) error {
	type Payload struct {
		Name     string `json:"name"`
		Criteria string `json:"criteria"`
	}
	var p Payload
	if err := c.BodyParser(&p); err != nil {
		return c.Status(400).SendString("Invalid payload")
	}

	_, err := h.repo.GetDB().Exec("INSERT INTO wp_apex_segments (name, criteria) VALUES (?, ?)", p.Name, p.Criteria)
	if err != nil {
		return c.Status(500).SendString(err.Error())
	}

	return c.JSON(fiber.Map{"status": "success"})
}

func (h *SegmentationHandler) DeleteSegment(c *fiber.Ctx) error {
	id := c.Params("id")
	_, err := h.repo.GetDB().Exec("DELETE FROM wp_apex_segments WHERE id = ?", id)
	if err != nil {
		return c.Status(500).SendString(err.Error())
	}
	return c.JSON(fiber.Map{"status": "deleted"})
}

func (h *SegmentationHandler) GetLeads(c *fiber.Ctx) error {
	query := "SELECT company_name as name, domain, industry, employee_count as employees, confidence_score as confidence, 0 as is_isp FROM wp_apex_b2b_leads ORDER BY last_seen DESC LIMIT 50"
	rows, err := h.repo.RunReadOnlyQuery(query)
	if err != nil {
		return c.Status(500).SendString(err.Error())
	}
	return c.JSON(rows)
}
