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

	// Generate and insert B2B Leads
	leadCount := h.seedLeads()

	// Generate and insert Social Mentions & Shares
	socialCount := h.seedSocialData()

	// Generate and insert Performance Metrics
	perfCount := h.seedPerformanceMetrics()

	// Generate and insert Security Audit Logs
	auditCount := h.seedSecurityAuditLog()

	// Generate and insert God Mode Instances
	instanceCount := h.seedGodModeInstances()

	// Generate and insert Developer Webhooks
	webhookCount := h.seedDeveloperWebhooks()

	log.Printf("Demo data seeding complete: %d pageviews, %d orders, %d leads, %d social, %d performance, %d audit, %d instances, %d webhooks", pageviewCount, orderCount, leadCount, socialCount, perfCount, auditCount, instanceCount, webhookCount)

	return c.JSON(fiber.Map{
		"status":      "success",
		"pageviews":   pageviewCount,
		"orders":      orderCount,
		"leads":       leadCount,
		"social":      socialCount,
		"performance": perfCount,
		"audit":       auditCount,
		"instances":   instanceCount,
		"webhooks":    webhookCount,
		"message":     "Demo data seeded successfully",
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

			// Generate a sequence of 1-4 pageviews per session
			steps := rand.Intn(4) + 1
			for s := 0; s < steps; s++ {
				event := Event{
					Type:      "pageview",
					SessionID: sessionID,
					Timestamp: timestamp.Add(time.Duration(s*rand.Intn(300)) * time.Second).Unix(),
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

func (h *DemoSeederHandler) seedLeads() int {
	leads := []struct {
		Name      string
		Domain    string
		Industry  string
		Employees string
	}{
		{"NVIDIA Corporation", "nvidia.com", "Semiconductors", "10,000+"},
		{"Adobe Inc.", "adobe.com", "Software", "5,000-10,000"},
		{"Stripe", "stripe.com", "Fintech", "1,000-5,000"},
		{"Figma", "figma.com", "Design Tools", "500-1,000"},
		{"Vercel", "vercel.com", "Cloud Infrastructure", "200-500"},
	}

	count := 0
	for _, l := range leads {
		_, err := h.repo.GetDB().Exec(`
			INSERT IGNORE INTO wp_apex_b2b_leads 
			(company_name, domain, industry, employee_count, confidence_score, first_seen, last_seen, visit_count)
			VALUES (?, ?, ?, ?, ?, NOW(), NOW(), ?)
		`, l.Name, l.Domain, l.Industry, l.Employees, 85+rand.Intn(10), 1+rand.Intn(5))

		if err == nil {
			count++
		}
	}
	return count
}

func (h *DemoSeederHandler) seedPerformanceMetrics() int {
	urls := []string{
		"https://demo-site.com/",
		"https://demo-site.com/products",
		"https://demo-site.com/blog",
		"https://demo-site.com/pricing",
	}

	devices := []string{"mobile", "desktop"}
	count := 0

	now := time.Now()

	for i := 0; i < 100; i++ {
		lcp := 800 + rand.Float64()*2500 // 0.8s to 3.3s
		cls := rand.Float64() * 0.2      // 0 to 0.2
		inp := 50 + rand.Float64()*300   // 50ms to 350ms
		ttfb := 100 + rand.Float64()*500 // 100ms to 600ms
		fcp := 500 + rand.Float64()*1000 // 500ms to 1.5s

		h.repo.db.Exec(`
			INSERT INTO wp_apex_performance_metrics (session_id, url, lcp, cls, inp, ttfb, fcp, device_type, created_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
		`, generateDemoSessionID(), urls[rand.Intn(len(urls))], lcp, cls, inp, ttfb, fcp, devices[rand.Intn(len(devices))], now.Add(-time.Duration(rand.Intn(7*24))*time.Hour))
		count++
	}

	return count
}

func (h *DemoSeederHandler) seedSocialData() int {
	mentions := []struct {
		Content   string
		Platform  string
		Sentiment int
	}{
		{"Absolutely love the new #ApexAIInsights dashboard. UX is incredible! 🚀", "twitter", 1},
		{"Apex insights helped us recover 15% of abandoned carts in the first week. Highly recommend.", "twitter", 1},
		{"Not sure about the new pricing, seems a bit steep for smaller teams. #Analytics", "twitter", -1},
		{"Just integrated Apex with our WooCommerce store. Setting up was a breeze.", "twitter", 1},
		{"The data accuracy is much better than our previous tool.", "twitter", 1},
	}

	count := 0
	for _, m := range mentions {
		_, err := h.repo.GetDB().Exec(`
			INSERT IGNORE INTO wp_apex_social_mentions (platform, content, author, sentiment_score)
			VALUES (?, ?, ?, ?)
		`, m.Platform, m.Content, "demo_user_"+fmt.Sprint(rand.Intn(100)), m.Sentiment)
		if err == nil {
			count++
		}
	}

	// Seed some share events to drive K-Factor
	for i := 0; i < 50; i++ {
		h.repo.SaveEvent(Event{
			Type:      "share",
			SessionID: generateDemoSessionID(),
			Timestamp: time.Now().Add(-time.Duration(rand.Intn(24)) * time.Hour).Unix(),
			URL:       "https://demo-site.com/products/pro-license",
			IP:        "127.0.0.1",
			UserAgent: "DemoBot/1.0",
		})
	}

	// Seed some Dark Social sessions (deep links with no referrer)
	for i := 0; i < 30; i++ {
		sessionID := generateDemoSessionID()
		landingPage := "https://demo-site.com/blog/best-practices"
		h.repo.GetDB().Exec(`
			INSERT INTO wp_apex_sessions (session_id, visitor_id, landing_page, referrer, created_at)
			VALUES (?, ?, ?, ?, ?)
		`, sessionID, "demo_visitor_"+fmt.Sprint(rand.Intn(1000)), landingPage, "", time.Now().Add(-time.Duration(rand.Intn(24))*time.Hour))

		// Pageview event for it as well
		h.repo.SaveEvent(Event{
			Type:      "pageview",
			SessionID: sessionID,
			Timestamp: time.Now().Unix(),
			URL:       landingPage,
			Referrer:  "",
		})
	}

	return count
}

func (h *DemoSeederHandler) seedSecurityAuditLog() int {
	actions := []struct {
		Actor   string
		Action  string
		Target  string
		Details string
	}{
		{"admin", "login_success", "wp-admin", "Successful login from 192.168.1.100"},
		{"system", "malware_scan", "https://example.com", "Safe Browsing check completed"},
		{"admin", "settings_updated", "apex_settings", "GDPR Mode enabled"},
		{"system", "blocklist_update", "192.168.1.50", "IP blocked: Suspicious activity"},
		{"user_john", "login_failed", "wp-admin", "Invalid password attempt"},
		{"system", "gdpr_deletion_request", "john@example.com", "Pending manual review"},
		{"admin", "plugin_activated", "apex-ai-insights", "Plugin activated successfully"},
		{"system", "security_scan", "wp-content/uploads", "No malicious files detected"},
	}

	count := 0
	now := time.Now()

	for i, action := range actions {
		h.repo.db.Exec(`
			INSERT INTO wp_apex_audit_log (actor, action, target_resource, details, created_at)
			VALUES (?, ?, ?, ?, ?)
		`, action.Actor, action.Action, action.Target, action.Details, now.Add(-time.Duration(i)*time.Hour))
		count++
	}

	return count
}

func (h *DemoSeederHandler) seedGodModeInstances() int {
	instances := []struct {
		Domain  string
		Version string
		Status  string
	}{
		{"client-site-1.com", "2.1.0", "active"},
		{"ecommerce-store.io", "2.1.0", "active"},
		{"blog-network.org", "2.0.5", "active"},
		{"agency-client.co", "2.1.0", "inactive"},
		{"test-environment.dev", "2.1.1", "active"},
	}

	count := 0
	now := time.Now()

	for i, inst := range instances {
		apiKey := fmt.Sprintf("demo_key_%d_%s", i, generateDemoSessionID())
		heartbeat := now.Add(-time.Duration(i*5) * time.Second) // Stagger heartbeats

		h.repo.db.Exec(`
			INSERT INTO wp_apex_instances (domain, api_key, status, plugin_version, last_heartbeat, created_at)
			VALUES (?, ?, ?, ?, ?, ?)
			ON DUPLICATE KEY UPDATE status=VALUES(status), last_heartbeat=VALUES(last_heartbeat)
		`, inst.Domain, apiKey, inst.Status, inst.Version, heartbeat, now)
		count++
	}

	return count
}

func (h *DemoSeederHandler) seedDeveloperWebhooks() int {
	webhooks := []struct {
		TargetURL  string
		EventTypes string
	}{
		{"https://api.myapp.com/apex-webhook", `["alert", "report"]`},
		{"https://hooks.slack.com/services/DEMO123", `["alert"]`},
		{"https://zapier.com/hooks/catch/demo456", `["conversion", "lead"]`},
	}

	count := 0
	for _, wh := range webhooks {
		secret := fmt.Sprintf("whsec_%s", generateDemoSessionID())
		h.repo.db.Exec(`
			INSERT INTO wp_apex_webhooks (target_url, event_types, secret, is_active)
			VALUES (?, ?, ?, 1)
			ON DUPLICATE KEY UPDATE is_active=1
		`, wh.TargetURL, wh.EventTypes, secret)
		count++
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
