package main

import (
	"fmt"
	"log"
	"math/rand"
	"time"

	"github.com/gofiber/fiber/v2"
)

// DemoSeederHandler handles demo data population for new installations
type DemoSeederHandler struct {
	repo *Repository
}

func NewDemoSeederHandler(repo *Repository) *DemoSeederHandler {
	return &DemoSeederHandler{repo: repo}
}

// SeedDemoData populates the database with 24 hours of mock traffic and 5 fake orders
// POST /v1/system/seed
func (h *DemoSeederHandler) SeedDemoData(c *fiber.Ctx) error {
	log.Println("Starting demo data seeding...")

	// Generate and insert pageviews
	pageviewCount := h.seedPageviews()

	// Generate and insert orders
	orderCount := h.seedOrders()

	log.Printf("Demo data seeding complete: %d pageviews, %d orders", pageviewCount, orderCount)

	return c.JSON(fiber.Map{
		"status":    "success",
		"pageviews": pageviewCount,
		"orders":    orderCount,
		"message":   "Demo data seeded successfully",
	})
}

func (h *DemoSeederHandler) seedPageviews() int {
	pages := []string{
		"/",
		"/about",
		"/products",
		"/pricing",
		"/blog",
		"/blog/getting-started",
		"/blog/best-practices",
		"/contact",
		"/features",
		"/demo",
	}

	referrers := []string{
		"https://google.com/search?q=analytics",
		"https://twitter.com/apexai",
		"https://facebook.com",
		"https://linkedin.com/company/apex",
		"https://producthunt.com/posts/apex-ai",
		"",
		"",
	}

	userAgents := []string{
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
		"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
		"Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
		"Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
	}

	// Demo IPs that will resolve to different locations
	demoIPs := []string{
		"8.8.8.8",        // Google DNS - US
		"1.1.1.1",        // Cloudflare - US
		"208.67.222.222", // OpenDNS - US
		"9.9.9.9",        // Quad9 - US
		"185.228.168.9",  // CleanBrowsing - UK
	}

	now := time.Now()
	count := 0

	// Generate pageviews for the last 24 hours with realistic distribution
	for hour := 0; hour < 24; hour++ {
		// Traffic multiplier based on hour (more traffic 9am-9pm)
		var multiplier int
		if hour >= 9 && hour <= 21 {
			multiplier = rand.Intn(15) + 10 // 10-25 pageviews
		} else {
			multiplier = rand.Intn(5) + 2 // 2-7 pageviews
		}

		for i := 0; i < multiplier; i++ {
			sessionID := generateDemoSessionID()
			timestamp := now.Add(-time.Duration(24-hour) * time.Hour).Add(time.Duration(rand.Intn(3600)) * time.Second)

			event := Event{
				Type:      "pageview",
				SessionID: sessionID,
				Timestamp: timestamp.Unix(),
				URL:       "https://demo-site.com" + pages[rand.Intn(len(pages))],
				Referrer:  referrers[rand.Intn(len(referrers))],
				IP:        demoIPs[rand.Intn(len(demoIPs))],
				UserAgent: userAgents[rand.Intn(len(userAgents))],
				Fingerprint: map[string]string{
					"sr": "1920x1080",
				},
				Data: map[string]interface{}{
					"scroll_depth": rand.Intn(100),
					"time_on_page": rand.Intn(300) + 10,
					"demo":         true,
				},
			}

			err := h.repo.SaveEvent(event)
			if err != nil {
				log.Printf("Warning: Failed to insert demo pageview: %v", err)
			} else {
				count++
			}
		}
	}

	return count
}

func (h *DemoSeederHandler) seedOrders() int {
	// Insert demo WooCommerce orders directly into the events table
	orders := []struct {
		product string
		revenue float64
		orderID int
	}{
		{"Pro License", 99.00, 1001},
		{"Agency Bundle", 299.00, 1002},
		{"Enterprise Plan", 499.00, 1003},
		{"Lifetime Deal", 799.00, 1004},
		{"Starter Pack", 49.00, 1005},
	}

	emails := []string{
		"demo-user1@example.com",
		"demo-user2@example.com",
		"demo-user3@example.com",
		"demo-agency@example.com",
		"demo-enterprise@example.com",
	}

	now := time.Now()
	count := 0

	for i, order := range orders {
		fees := (order.revenue * 0.029) + 0.30
		netProfit := order.revenue - fees

		event := Event{
			Type:      "order_completed",
			SessionID: fmt.Sprintf("demo_order_%d", order.orderID),
			Timestamp: now.Add(-time.Duration(rand.Intn(24)) * time.Hour).Unix(),
			URL:       fmt.Sprintf("woocommerce://order/%d", order.orderID),
			IP:        "127.0.0.1",
			UserAgent: "WooCommerce/8.0",
			Data: map[string]interface{}{
				"order_id":   order.orderID,
				"revenue":    order.revenue,
				"net_profit": netProfit,
				"fees_est":   fees,
				"currency":   "USD",
				"email":      emails[i],
				"product":    order.product,
				"demo":       true,
			},
		}

		err := h.repo.SaveEvent(event)
		if err != nil {
			log.Printf("Warning: Failed to insert demo order: %v", err)
		} else {
			count++
		}
	}

	return count
}

func generateDemoSessionID() string {
	const charset = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, 16)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return "demo_" + string(b)
}
