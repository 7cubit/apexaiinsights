package main

import (
	"net"
	"os"
	"runtime"
	"time"

	"github.com/gofiber/fiber/v2"
)

// Version info (injected at build time via ldflags)
var (
	Version   = "1.0.0-beta"
	BuildDate = "dev"
)

type HealthHandler struct {
	Repo *Repository
}

// ServiceStatus represents the health of a single service
type ServiceStatus struct {
	Status  string `json:"status"`  // "ok", "error", "disconnected"
	Latency string `json:"latency"` // Response time
	Message string `json:"message,omitempty"`
}

// HealthResponse is the complete health check response
type HealthResponse struct {
	Status    string                   `json:"status"` // "healthy", "degraded", "unhealthy"
	Timestamp int64                    `json:"timestamp"`
	Version   string                   `json:"version"`
	BuildDate string                   `json:"build_date"`
	Services  map[string]ServiceStatus `json:"services"`
	System    map[string]interface{}   `json:"system"`
	License   map[string]interface{}   `json:"license"`
}

func NewHealthHandler(repo *Repository) *HealthHandler {
	return &HealthHandler{Repo: repo}
}

// CheckHealth performs comprehensive health checks on all services
func (h *HealthHandler) CheckHealth(c *fiber.Ctx) error {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	services := make(map[string]ServiceStatus)
	overallStatus := "healthy"

	// Check MySQL
	services["mysql"] = h.checkMySQL()
	if services["mysql"].Status != "ok" {
		overallStatus = "degraded"
	}

	// Check Redis
	services["redis"] = h.checkRedis()
	if services["redis"].Status != "ok" {
		if overallStatus == "healthy" {
			overallStatus = "degraded"
		}
	}

	// Check GDPR Manager
	gdpr := GetGDPRManager()
	gdprStatus := "ok"
	if gdpr == nil {
		gdprStatus = "not_initialized"
	}
	services["gdpr_manager"] = ServiceStatus{
		Status:  gdprStatus,
		Latency: "0ms",
	}

	// Check License
	license := GetLicenseValidator()
	licenseInfo := make(map[string]interface{})
	if license != nil {
		status := license.GetLicenseStatus()
		licenseInfo["status"] = status.Status
		licenseInfo["valid"] = license.IsProModeEnabled()
		licenseInfo["days_remaining"] = status.DaysRemaining
	} else {
		licenseInfo["status"] = "not_initialized"
		licenseInfo["valid"] = false
	}

	// If both MySQL and Redis are down, mark as unhealthy
	if services["mysql"].Status != "ok" && services["redis"].Status != "ok" {
		overallStatus = "unhealthy"
	}

	response := HealthResponse{
		Status:    overallStatus,
		Timestamp: time.Now().Unix(),
		Version:   Version,
		BuildDate: BuildDate,
		Services:  services,
		System: map[string]interface{}{
			"goroutines":    runtime.NumGoroutine(),
			"memory_mb":     m.Alloc / 1024 / 1024,
			"memory_sys_mb": m.Sys / 1024 / 1024,
			"gc_cycles":     m.NumGC,
			"os":            runtime.GOOS,
			"arch":          runtime.GOARCH,
			"go_version":    runtime.Version(),
		},
		License: licenseInfo,
	}

	// Set appropriate HTTP status
	httpStatus := fiber.StatusOK
	if overallStatus == "unhealthy" {
		httpStatus = fiber.StatusServiceUnavailable
	}

	return c.Status(httpStatus).JSON(response)
}

// checkMySQL pings the MySQL database and measures latency
func (h *HealthHandler) checkMySQL() ServiceStatus {
	if h.Repo == nil || h.Repo.GetDB() == nil {
		return ServiceStatus{
			Status:  "disconnected",
			Latency: "0ms",
			Message: "Database connection not initialized",
		}
	}

	start := time.Now()
	err := h.Repo.GetDB().Ping()
	latency := time.Since(start)

	if err != nil {
		return ServiceStatus{
			Status:  "error",
			Latency: latency.String(),
			Message: err.Error(),
		}
	}

	return ServiceStatus{
		Status:  "ok",
		Latency: latency.String(),
	}
}

// checkRedis pings the Redis server and measures latency
func (h *HealthHandler) checkRedis() ServiceStatus {
	redisHost := os.Getenv("REDIS_HOST")
	if redisHost == "" {
		redisHost = "redis:6379" // Default Docker network host
	}

	start := time.Now()

	// Simple TCP connection check (no Redis client dependency needed)
	conn, err := net.DialTimeout("tcp", redisHost, 2*time.Second)
	latency := time.Since(start)

	if err != nil {
		return ServiceStatus{
			Status:  "error",
			Latency: latency.String(),
			Message: "Connection failed: " + err.Error(),
		}
	}
	defer conn.Close()

	// Send PING command
	_, err = conn.Write([]byte("*1\r\n$4\r\nPING\r\n"))
	if err != nil {
		return ServiceStatus{
			Status:  "error",
			Latency: latency.String(),
			Message: "Write failed: " + err.Error(),
		}
	}

	// Read response (should be +PONG\r\n)
	buf := make([]byte, 32)
	conn.SetReadDeadline(time.Now().Add(2 * time.Second))
	_, err = conn.Read(buf)
	if err != nil {
		return ServiceStatus{
			Status:  "error",
			Latency: latency.String(),
			Message: "Read failed: " + err.Error(),
		}
	}

	return ServiceStatus{
		Status:  "ok",
		Latency: latency.String(),
	}
}

// LicenseHandshake returns the current license status including grace period info
func (h *HealthHandler) LicenseHandshake(c *fiber.Ctx) error {
	license := GetLicenseValidator()
	status := license.GetLicenseStatus()

	return c.JSON(fiber.Map{
		"valid":          license.IsProModeEnabled(),
		"status":         status.Status,
		"days_remaining": status.DaysRemaining,
		"grace_start":    status.GraceStart,
		"grace_end":      status.GraceEnd,
		"message":        status.Message,
	})
}
