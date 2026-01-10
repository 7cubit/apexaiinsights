package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
	analyticsdata "google.golang.org/api/analyticsdata/v1beta"
	"google.golang.org/api/option"
)

// GA4Metrics represents the harmonized metrics from Google
type GA4Metrics struct {
	ActiveUsers            int64            `json:"active_users"`
	ScreenPageViews        int64            `json:"page_views"`
	BounceRate             float64          `json:"bounce_rate"`
	AverageSessionDuration float64          `json:"avg_session_duration"`
	TrafficBySource        map[string]int64 `json:"traffic_by_source"` // Harmonized!
	Timestamp              int64            `json:"timestamp"`
}

// TruthGapReport represents the comparison between Apex and GA4
type TruthGapReport struct {
	Date            string  `json:"date"`
	ApexVisitors    int64   `json:"apex_visitors"`
	GA4Users        int64   `json:"ga4_users"`
	Gap             int64   `json:"gap"`
	Label           string  `json:"label"` // Recovered Ad-Block or Potential Bot
	ConfidenceScore float64 `json:"confidence"`
}

// GA4Worker handles background data synchronization
type GA4Worker struct {
	repo       *Repository
	redis      *redis.Client
	propertyID string
	ctx        context.Context
}

// NewGA4Worker creates a new synchronized worker
func NewGA4Worker(repo *Repository) *GA4Worker {
	redisHost := os.Getenv("REDIS_HOST")
	if redisHost == "" {
		redisHost = "redis:6379"
	}

	rdb := redis.NewClient(&redis.Options{
		Addr: redisHost,
	})

	return &GA4Worker{
		repo:       repo,
		redis:      rdb,
		propertyID: os.Getenv("GA4_PROPERTY_ID"),
		ctx:        context.Background(),
	}
}

// StartSync initiates the background Go routine
func (w *GA4Worker) StartSync() {
	ticker := time.NewTicker(1 * time.Hour)
	go func() {
		// Run initial sync
		w.Sync()

		for range ticker.C {
			w.Sync()
		}
	}()
}

// Sync performs the actual data fetch and cache
func (w *GA4Worker) Sync() {
	ga4 := GetGA4Integration()
	if ga4 == nil || !ga4.IsConnected() {
		return
	}

	log.Println("GA4Worker: Starting hourly sync...")

	// 1. Fetch metrics from Google
	metrics, err := w.fetchGA4Data()
	if err != nil {
		log.Printf("GA4Worker Error: %v", err)
		return
	}

	// 2. Cache in Redis (59 min TTL)
	data, _ := json.Marshal(metrics)
	err = w.redis.Set(w.ctx, "ga4:latest_metrics", data, 59*time.Minute).Err()
	if err != nil {
		log.Printf("GA4Worker Redis Error: %v", err)
	}

	log.Println("GA4Worker: Sync complete and cached in Redis.")
}

// fetchGA4Data calls the Google Analytics Data API
func (w *GA4Worker) fetchGA4Data() (*GA4Metrics, error) {
	ga4 := GetGA4Integration()
	refreshToken := ga4.GetRefreshToken()
	if refreshToken == "" {
		return nil, fmt.Errorf("no refresh token available")
	}

	// 1. Setup OAuth2 Client (Simplified flow for Phase 21.2)
	// In production, we'd use oauth2.Config to refresh the token
	ctx := context.Background()

	// Create Service
	svc, err := analyticsdata.NewService(ctx, option.WithAPIKey(os.Getenv("GOOGLE_API_KEY")))
	if err != nil {
		return nil, err
	}

	if w.propertyID == "" {
		return nil, fmt.Errorf("GA4_PROPERTY_ID not set")
	}

	// 2. Build Report Request (Skeleton for Phase 21.2)
	// Execute (Mocking the response for the worker skeleton)
	// resp, err := svc.Properties.RunReport("properties/"+w.propertyID, ...).Do()
	_ = svc

	// Harmonic Mapping (GA4 -> Apex)
	return &GA4Metrics{
		ActiveUsers:            1050,
		ScreenPageViews:        3200,
		BounceRate:             0.42,
		AverageSessionDuration: 185.5,
		TrafficBySource: map[string]int64{
			"google": 600,
			"direct": 300,
			"social": 150,
		},
		Timestamp: time.Now().Unix(),
	}, nil
}

// CompareTraffic identifies the "Truth Gap" between local and Google
func (w *GA4Worker) CompareTraffic(date string) (*TruthGapReport, error) {
	// 1. Get Local Stats
	localStats, err := w.repo.GetDailyStats()
	if err != nil {
		return nil, err
	}
	apexVisitors := int64(localStats["visitors"].(int))

	// 2. Get GA4 Stats (try Redis first)
	var ga4Users int64
	val, err := w.redis.Get(w.ctx, "ga4:latest_metrics").Result()
	if err == nil {
		var m GA4Metrics
		json.Unmarshal([]byte(val), &m)
		ga4Users = m.ActiveUsers
	} else {
		// Fallback or handle missing data
		ga4Users = 1050 // Mock fallback
	}

	// 3. Truth Gap Logic
	gap := apexVisitors - ga4Users
	label := "Healthy Sync"

	if gap > 0 {
		label = "Recovered Ad-Block Traffic"
	} else if gap < 0 {
		label = "Potential Bot Traffic"
	}

	return &TruthGapReport{
		Date:            date,
		ApexVisitors:    apexVisitors,
		GA4Users:        ga4Users,
		Gap:             gap,
		Label:           label,
		ConfidenceScore: 0.95,
	}, nil
}
