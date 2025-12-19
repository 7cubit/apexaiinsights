package analysis

type CannibalizationResult struct {
	Keyword    string    `json:"keyword"`
	Urls       []string  `json:"urls"`
	Positions  []float64 `json:"positions"`
	LostClicks int       `json:"lost_clicks"`
}

// CheckCannibalization detects if multiple pages rank for the same keyword
func CheckCannibalization() ([]CannibalizationResult, error) {
	// Mock Logic for MVP (Simulating GSC analysis)
	// Real implementation would query GSC API for (Query, Page) tuples and find duplicates for Query

	return []CannibalizationResult{
		{
			Keyword:    "best ai plugins",
			Urls:       []string{"/blog/top-10-ai-plugins", "/blog/best-wordpress-plugins-2024"},
			Positions:  []float64{4.5, 6.2},
			LostClicks: 45,
		},
		{
			Keyword:    "increase wordpress speed",
			Urls:       []string{"/guide/speed-optimization", "/blog/cache-plugins"},
			Positions:  []float64{8.1, 9.5},
			LostClicks: 12,
		},
	}, nil
}
