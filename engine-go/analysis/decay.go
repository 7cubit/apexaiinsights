package analysis

import (
	"database/sql"
	"fmt"
	"log"
)

// ContentDecayResult represents a post that is losing traffic
type ContentDecayResult struct {
	PostID        int     `json:"post_id"`
	Title         string  `json:"title"`
	CurrentViews  int     `json:"current_views"`
	PreviousViews int     `json:"previous_views"`
	ChangePct     float64 `json:"change_pct"`
	Slug          string  `json:"slug"`
}

// CalculateContentDecay identifies posts with >15% traffic drop MoM
// It compares the last 30 days vs the period 30-60 days ago
func CalculateContentDecay(db *sql.DB) ([]ContentDecayResult, error) {
	// Query to compare two 30-day windows for 'post' type only
	// We use the wp_apex_events table joined with wp_posts
	// This assumes wp_posts is available in the same DB (standard WP setup)
	// If different DBs, we'd need a different approach, but sticking to standard monolithic WP DB for now.

	query := `
		WITH CurrentPeriod AS (
			SELECT 
				resource_id, 
				COUNT(*) as views 
			FROM wp_apex_events 
			WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
			AND event_type = 'pageview'
			GROUP BY resource_id
		),
		PreviousPeriod AS (
			SELECT 
				resource_id, 
				COUNT(*) as views 
			FROM wp_apex_events 
			WHERE created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY)
			AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
			AND event_type = 'pageview'
			GROUP BY resource_id
		)
		SELECT 
			p.ID as post_id,
			p.post_title as title,
			p.post_name as slug,
			COALESCE(c.views, 0) as current_views,
			COALESCE(prev.views, 0) as previous_views
		FROM wp_posts p
		JOIN PreviousPeriod prev ON p.ID = prev.resource_id
		LEFT JOIN CurrentPeriod c ON p.ID = c.resource_id
		WHERE p.post_type = 'post' 
		AND p.post_status = 'publish'
		HAVING previous_views > 10 -- Minimum threshold to avoid noise
	`

	rows, err := db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query content decay: %v", err)
	}
	defer rows.Close()

	var results []ContentDecayResult

	for rows.Next() {
		var r ContentDecayResult
		if err := rows.Scan(&r.PostID, &r.Title, &r.Slug, &r.CurrentViews, &r.PreviousViews); err != nil {
			log.Printf("Error scanning decay row: %v", err)
			continue
		}

		// Calculate Percentage Change
		// (Current - Previous) / Previous * 100
		if r.PreviousViews > 0 {
			diff := float64(r.CurrentViews - r.PreviousViews)
			r.ChangePct = (diff / float64(r.PreviousViews)) * 100
		} else {
			r.ChangePct = 100 // New post essentially (should be filtered out by HAVING, but safe fallback)
		}

		// Decay Threshold: Drop of more than 15% (i.e., < -15.0)
		if r.ChangePct < -15.0 {
			results = append(results, r)
		}
	}

	return results, nil
}
