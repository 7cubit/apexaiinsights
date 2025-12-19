package main

import (
	"fmt"
	"math/rand"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
)

// TrafficGenerator handles traffic simulation
type TrafficGenerator struct {
	Repo *Repository
}

func NewTrafficGenerator(repo *Repository) *TrafficGenerator {
	return &TrafficGenerator{Repo: repo}
}

// StartSimulation runs a simulation with specified visitors and concurrency
func (tg *TrafficGenerator) StartSimulation(c *fiber.Ctx) error {
	visitorCount := c.QueryInt("visitors", 1000)
	concurrency := c.QueryInt("concurrency", 50)

	go tg.runSimulation(visitorCount, concurrency)

	return c.JSON(fiber.Map{
		"status":  "simulation_started",
		"message": fmt.Sprintf("Simulating %d visitors with %d concurrency", visitorCount, concurrency),
	})
}

func (tg *TrafficGenerator) runSimulation(count, concurrency int) {
	var wg sync.WaitGroup
	sem := make(chan struct{}, concurrency)

	// Random data pools
	urls := []string{"/", "/blog", "/products/1", "/contact", "/about", "/checkout"}
	refs := []string{"google.com", "facebook.com", "direct", "twitter.com"}
	events := []string{"page_view", "click", "scroll_depth", "add_to_cart"}

	for i := 0; i < count; i++ {
		wg.Add(1)
		sem <- struct{}{} // Acquire semaphore

		go func(id int) {
			defer wg.Done()
			defer func() { <-sem }() // Release semaphore

			// Simulate random user behavior
			visitorID := fmt.Sprintf("sim_user_%d", rand.Intn(100000))
			url := urls[rand.Intn(len(urls))]
			ref := refs[rand.Intn(len(refs))]
			evt := events[rand.Intn(len(events))]

			event := Event{
				Type:      evt,
				SessionID: visitorID + "_sess",
				Timestamp: time.Now().Unix(),
				URL:       url,
				Referrer:  ref,
				IP:        fmt.Sprintf("192.168.%d.%d", rand.Intn(255), rand.Intn(255)),
				UserAgent: "Apex-Traffic-Gen/1.0",
				Data:      map[string]interface{}{"simulated": true, "duration": rand.Intn(300)},
			}

			// Introduce slight random delay to mimic network jitter
			time.Sleep(time.Duration(rand.Intn(50)) * time.Millisecond)

			// We need a way to mock saving if we don't want to pollute real DB too much,
			// but for Phase 18 Load Testing, we DO want to hit the DB.
			_ = tg.Repo.SaveEvent(event)
		}(i)
	}

	wg.Wait()
	fmt.Printf("Traffic Simulation Completed: %d visitors simulated.\n", count)
}

// Chaos Config
type ChaosConfig struct {
	Enabled     bool    `json:"enabled"`
	FailureRate float64 `json:"failure_rate"` // e.g., 0.1 for 10%
	LatencyMs   int     `json:"latency_ms"`
}

// Global config instance
var CurrentChaosConfig = ChaosConfig{
	Enabled:     false,
	FailureRate: 0.1,
	LatencyMs:   2000,
}

// ChaosMiddleware injects faults into the request pipeline
func ChaosMiddleware(config *ChaosConfig) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if !config.Enabled {
			return c.Next()
		}

		// Probability check (0.0 - 1.0)
		if rand.Float64() < config.FailureRate {
			// Randomly choose a failure mode
			mode := rand.Intn(3)
			switch mode {
			case 0: // 500 Internal Server Error
				return c.Status(500).JSON(fiber.Map{"error": "Chaos Monkey strikes!"})
			case 1: // High Latency
				time.Sleep(time.Duration(config.LatencyMs) * time.Millisecond)
				return c.Next()
			case 2: // 503 Service Unavailable
				return c.Status(503).JSON(fiber.Map{"error": "Service pretending to be down"})
			}
		}

		return c.Next()
	}
}

// Handler to toggle Chaos on the fly
func ToggleChaos(c *fiber.Ctx) error {
	var input ChaosConfig
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).SendString("Invalid config")
	}
	CurrentChaosConfig = input
	return c.JSON(fiber.Map{"status": "updated", "config": CurrentChaosConfig})
}
