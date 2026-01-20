package main

import (
	"log"
	"net/http"         // New import for pprof server
	_ "net/http/pprof" // New import for pprof side effects
	"os"

	"github.com/apex-ai/engine-go/gsc"
	"github.com/apex-ai/engine-go/recon"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/compress"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	app := fiber.New()

	app.Use(logger.New())
	app.Use(compress.New(compress.Config{
		Level: compress.LevelBestSpeed, // 1
	}))

	// Phase 18: Memory Profiler
	go func() {
		log.Println("Starting Pprof on localhost:6060")
		log.Println(http.ListenAndServe("localhost:6060", nil))
	}()

	// Initialize database repository
	repo, err := NewRepository()
	if err != nil {
		log.Printf("Warning: Database connection failed: %v (running in limited mode)", err)
	} else {
		defer repo.Close()

		// Run Schema Migration
		repo.Migrate()

		// Initialize GDPR Manager with database connection
		InitGDPRManager(repo.GetDB())

		// Initialize Apex Recon Engine
		// Assuming files are mapped to /app/data or similar in Docker
		reconEngine, err := recon.NewReconEngine("data/GeoLite2-ASN.mmdb", "data/blacklist.json")
		if err != nil {
			log.Printf("Warning: Failed to init Recon Engine: %v", err)
		} else {
			log.Println("Aspect Recon Engine fully operational.")
		}

		// Setup collect endpoint with worker pool
		SetupCollectEndpoint(app, repo, reconEngine)
		// Setup Chat AI endpoint
		SetupChatEndpoint(app, repo)
		// Setup GA4 Integration endpoints
		SetupGA4Endpoints(app, repo)

		// Setup Prediction endpoint
		predictionHandler := NewPredictionHandler()
		app.Post("/v1/predict/inventory", predictionHandler.PredictInventory)

		// Setup Content Decay endpoint (Phase 7)
		decayHandler := NewDecayHandler(repo)
		app.Get("/v1/analysis/decay", decayHandler.GetContentDecay)

		// Setup GSC Overlay endpoint (Phase 7)
		gscService := gsc.NewGSCService(os.Getenv("GSC_API_KEY"))
		gscHandler := NewGSCHandler(gscService)
		app.Get("/v1/analysis/gsc-overlay", gscHandler.GetTrafficOverlay)

		// Setup Author Leaderboard (Phase 7)
		authorHandler := NewAuthorHandler(repo)
		app.Get("/v1/analysis/authors", authorHandler.GetLeaderboard)

		// Setup Readability (Phase 25)
		readabilityHandler := NewReadabilityHandler(repo)
		app.Get("/v1/analysis/readability", readabilityHandler.GetStats)

		// Setup Cannibalization Endpoint (Phase 7)
		cannibalizationHandler := NewCannibalizationHandler()
		app.Get("/v1/analysis/cannibalization", cannibalizationHandler.GetAlerts)

		// Setup Session Recording (Phase 8)
		recordingHandler := NewRecordingHandler(repo)
		app.Post("/v1/replay/ingest", recordingHandler.IngestChunk)
		app.Get("/v1/replay/list", recordingHandler.GetRecentRecordings) // New endpoint
		app.Get("/v1/replay/:sessionId", recordingHandler.GetSessionRecording)

		// Setup Form Telemetry (Phase 9)
		telemetryHandler := NewTelemetryHandler(repo)
		app.Post("/v1/telemetry", telemetryHandler.IngestTelemetry)

		// Setup AI Optimization (Phase 9)
		optimizationHandler := NewOptimizationHandler()
		app.Post("/v1/optimize/form", optimizationHandler.GetSuggestions)

		// Phase 10: Search & SEO
		searchHandler := NewSearchHandler(repo)
		pplxHandler := NewPerplexityHandler()

		app.Post("/v1/search/track", searchHandler.IngestSearch)
		app.Get("/v1/search/stats", searchHandler.GetSearchStats)
		app.Post("/v1/404/track", searchHandler.Ingest404)
		app.Post("/v1/ai/answer", pplxHandler.GetAnswer)

		// Phase 11: Auto-Pilot
		autoHandler := NewAutomationHandler(repo)
		app.Post("/v1/automation/rules", autoHandler.CreateRule)
		app.Get("/v1/automation/rules", autoHandler.GetRules)
		app.Delete("/v1/automation/rules/:id", autoHandler.DeleteRule)
		app.Post("/v1/automation/rules/:id/test", autoHandler.TestRule)
		app.Post("/v1/automation/event", autoHandler.IngestEvent) // Internal Event bus

		// Setup Form Stats Aggregation (Phase 9)
		formStatsHandler := NewFormStatsHandler(repo)
		app.Get("/v1/stats/forms", formStatsHandler.GetStats)

		// KPI Stats Endpoint (Production Readiness)
		kpiHandler := NewKPIHandler(repo)
		app.Get("/v1/stats/kpi", kpiHandler.GetKPIStats)

		// Content Stats Endpoint (Production Readiness)
		contentStatsHandler := NewContentStatsHandler(repo)
		app.Get("/v1/stats/content", contentStatsHandler.GetContentStats)

		// WooCommerce Endpoints (Production Readiness)
		wooHandler := NewWooCommerceHandler(repo)
		app.Get("/v1/woocommerce/stats", wooHandler.GetWooStats)
		app.Get("/v1/woocommerce/velocity", wooHandler.GetProductVelocity)
	}

	// Start Background Jobs
	go StartRecordingPruner(repo)

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.SendString("OK")
	})

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		log.Fatal("FATAL: JWT_SECRET environment variable is required. Set it in your .env file.")
	}

	// JWT Handshake endpoint (Task 5)
	app.Post("/handshake", jwtMiddleware(secret), func(c *fiber.Ctx) error {
		// Basic handshake verification
		return c.JSON(fiber.Map{
			"status": "connected",
			"engine": "ApexAI Fiber Engine",
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Apex Engine starting on port %s", port)
	// Phase 12: Segmentation
	segmentHandler := NewSegmentationHandler(repo)
	app.Get("/v1/segmentation/cohorts", segmentHandler.GetCohorts)
	app.Get("/v1/segmentation/scores", segmentHandler.CalculateScores)
	app.Get("/v1/segmentation/sankey", segmentHandler.GetSankey)
	app.Get("/v1/segmentation/segments", segmentHandler.GetSegments)
	app.Get("/v1/segmentation/leads", segmentHandler.GetLeads)
	app.Post("/v1/segmentation/segments", segmentHandler.CreateSegment)
	app.Delete("/v1/segmentation/segments/:id", segmentHandler.DeleteSegment)
	app.Post("/v1/segmentation/downloads", segmentHandler.TrackDownload)

	// Phase 13: Social & Viral
	socialHandler := NewSocialHandler(repo)
	app.Post("/v1/social/ingest", socialHandler.IngestSocialMetrics)
	app.Get("/v1/social/refresh", socialHandler.FetchMentions)
	app.Get("/v1/social/stats", socialHandler.GetSocialStats)
	app.Get("/v1/social/dark-social", socialHandler.DetectDarkSocial)

	campaignHandler := NewCampaignHandler(repo)
	app.Get("/v1/campaigns/stats", campaignHandler.GetCampaignStats)
	app.Post("/v1/campaigns/generate", campaignHandler.GenerateUTM)

	// Phase 14: Performance
	perfHandler := NewPerformanceHandler(repo, os.Getenv("PAGESPEED_API_KEY"))
	app.Post("/v1/performance/rum", perfHandler.IngestRUM)
	app.Get("/v1/performance/stats", perfHandler.GetPerformanceStats)
	app.Get("/v1/performance/scan", perfHandler.RunPageSpeed)
	app.Get("/v1/performance/db-health", perfHandler.CheckDBHealth)

	// Phase 15: Security & Compliance
	secHandler := NewSecurityHandler(repo)
	compHandler := NewComplianceHandler(repo)

	// Middleware
	app.Use(ChaosMiddleware(&CurrentChaosConfig))
	app.Use(secHandler.BlocklistMiddleware)
	app.Use(GDPRMiddleware)

	security := app.Group("/v1/security")
	security.Get("/scan", secHandler.CheckMalware)
	security.Get("/audit", secHandler.GetAuditLog)
	security.Post("/audit", secHandler.LogAudit)
	security.Post("/block", secHandler.AddToBlocklist)

	compliance := app.Group("/v1/compliance")
	compliance.Post("/delete", compHandler.HandleDataDeletion)

	// Phase 16: God Mode Controller
	godHandler := NewGodModeHandler(repo)
	god := app.Group("/v1/god")
	god.Post("/connect", godHandler.Connect) // Public-ish (needs logic to verify source or open registration)
	god.Post("/heartbeat", godHandler.Heartbeat)
	god.Get("/instances", godHandler.ListInstances) // Admin only (RBAC in prod)
	god.Post("/command", godHandler.QueueCommand)

	// Phase 17: Developer API
	devHandler := NewDeveloperHandler(repo)
	public := app.Group("/v1/public")
	public.Get("/stats", devHandler.GetPublicStats)

	dev := app.Group("/v1/dev")
	dev.Get("/webhooks", devHandler.ListWebhooks)
	dev.Post("/webhooks", devHandler.CreateWebhook)
	dev.Post("/webhooks/:id/test", devHandler.TestWebhook)
	dev.Post("/graphql", devHandler.GraphQLHandler)

	// Phase 18: Testing & Simulation
	// Chaos Middleware (applied conditionally based on config state inside the middleware logic if we pass the pointer,
	// but here we instantiated it. For dynamic updating in this simple setup we rely on global state in the package or a closure)
	// For simplicity in this step, we'll just register the route to Start Traffic.

	simTraffic := NewTrafficGenerator(repo)
	debug := app.Group("/debug")
	debug.Post("/simulate", simTraffic.StartSimulation)
	debug.Post("/chaos", ToggleChaos)

	consistencyHandler := NewConsistencyValidator(repo)
	debug.Get("/consistency", consistencyHandler.Validate)

	// Phase 19: Infrastructure
	cloudHandler := NewCloudHandler(repo)
	debug.Post("/cloud-offload", cloudHandler.OffloadHistoricalData)

	healthHandler := NewHealthHandler(repo)
	debug.Get("/health", healthHandler.CheckHealth)
	debug.Get("/license", healthHandler.LicenseHandshake)

	debug.Get("/update", AutoUpdateHandler)

	// Demo Data Seeder (BUG-001: Empty State fix)
	seederHandler := NewDemoSeederHandler(repo)
	system := app.Group("/v1/system")
	system.Post("/seed", seederHandler.SeedDemoData)

	log.Fatal(app.Listen(":" + port))
}
