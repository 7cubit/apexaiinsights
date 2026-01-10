package main

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"log"
	"os"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
)

// GA4Connection represents a stored Google Analytics connection
type GA4Connection struct {
	RefreshToken string    `json:"refresh_token"`
	AccessToken  string    `json:"access_token"`
	ExpiresAt    time.Time `json:"expires_at"`
	Scope        string    `json:"scope"`
	ConnectedAt  time.Time `json:"connected_at"`
	ConnectedBy  int       `json:"connected_by"`
}

// GA4TokenPayload is the encrypted payload from PHP
type GA4TokenPayload struct {
	EncryptedToken string `json:"encrypted_token"`
	AccessToken    string `json:"access_token"`
	ExpiresIn      int    `json:"expires_in"`
	Scope          string `json:"scope"`
	ConnectedAt    int64  `json:"connected_at"`
	ConnectedBy    int    `json:"connected_by"`
}

// GA4Integration manages Google Analytics OAuth tokens
type GA4Integration struct {
	connection    *GA4Connection
	encryptionKey string
	mu            sync.RWMutex
	vaultPath     string
}

var ga4Integration *GA4Integration
var ga4Once sync.Once

// InitGA4Integration initializes the GA4 integration manager
func InitGA4Integration() {
	ga4Once.Do(func() {
		key := os.Getenv("APEX_OAUTH_SECRET")
		if key == "" {
			key = "apex-default-key-change-me!!" // Must match PHP
			log.Println("Warning: APEX_OAUTH_SECRET not set, using default")
		}

		ga4Integration = &GA4Integration{
			encryptionKey: key,
			vaultPath:     "data/.ga4_vault.json",
		}

		// Load existing connection if any
		ga4Integration.loadFromVault()
	})
}

// GetGA4Integration returns the singleton instance
func GetGA4Integration() *GA4Integration {
	return ga4Integration
}

// SetupGA4Endpoints registers the GA4 integration endpoints
func SetupGA4Endpoints(app *fiber.App, repo *Repository) {
	InitGA4Integration()

	// Initialize and start GA4 Background Worker
	worker := NewGA4Worker(repo)
	worker.StartSync()

	integrations := app.Group("/v1/integrations")

	// Receive token from PHP
	integrations.Post("/ga4", handleGA4TokenReceive)

	// Check status
	integrations.Get("/ga4/status", handleGA4Status)

	// Truth Gap Report (Phase 21.2)
	integrations.Get("/ga4/truth-gap", func(c *fiber.Ctx) error {
		date := c.Query("date", time.Now().Format("2006-01-02"))
		report, err := worker.CompareTraffic(date)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		return c.JSON(report)
	})

	// Delete connection
	integrations.Delete("/ga4", handleGA4Disconnect)
}

// handleGA4TokenReceive receives encrypted token from PHP
func handleGA4TokenReceive(c *fiber.Ctx) error {
	// Verify internal request
	if c.Get("X-Apex-Internal") != "true" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Internal requests only",
		})
	}

	var payload GA4TokenPayload
	if err := c.BodyParser(&payload); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid payload",
		})
	}

	if payload.EncryptedToken == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Missing encrypted token",
		})
	}

	ga4 := GetGA4Integration()
	if ga4 == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "GA4 integration not initialized",
		})
	}

	// Decrypt the refresh token
	refreshToken, err := ga4.decryptToken(payload.EncryptedToken)
	if err != nil {
		log.Printf("GA4: Failed to decrypt token: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Failed to decrypt token",
		})
	}

	// Store the connection
	connection := &GA4Connection{
		RefreshToken: refreshToken,
		AccessToken:  payload.AccessToken,
		ExpiresAt:    time.Now().Add(time.Duration(payload.ExpiresIn) * time.Second),
		Scope:        payload.Scope,
		ConnectedAt:  time.Unix(payload.ConnectedAt, 0),
		ConnectedBy:  payload.ConnectedBy,
	}

	if err := ga4.storeConnection(connection); err != nil {
		log.Printf("GA4: Failed to store connection: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to store connection",
		})
	}

	log.Printf("GA4: Successfully connected by user %d", payload.ConnectedBy)

	return c.JSON(fiber.Map{
		"status":    "connected",
		"connected": true,
	})
}

// handleGA4Status returns the current connection status
func handleGA4Status(c *fiber.Ctx) error {
	ga4 := GetGA4Integration()
	if ga4 == nil || ga4.connection == nil {
		return c.JSON(fiber.Map{
			"connected":    false,
			"status":       "not_connected",
			"connected_at": nil,
		})
	}

	ga4.mu.RLock()
	conn := ga4.connection
	ga4.mu.RUnlock()

	return c.JSON(fiber.Map{
		"connected":     true,
		"status":        "connected",
		"connected_at":  conn.ConnectedAt.Format(time.RFC3339),
		"connected_by":  conn.ConnectedBy,
		"scope":         conn.Scope,
		"token_expires": conn.ExpiresAt.Format(time.RFC3339),
		"token_valid":   time.Now().Before(conn.ExpiresAt),
	})
}

// handleGA4Disconnect removes the stored connection
func handleGA4Disconnect(c *fiber.Ctx) error {
	if c.Get("X-Apex-Internal") != "true" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Internal requests only",
		})
	}

	ga4 := GetGA4Integration()
	if ga4 != nil {
		ga4.mu.Lock()
		ga4.connection = nil
		ga4.mu.Unlock()

		// Remove vault file
		os.Remove(ga4.vaultPath)
	}

	log.Println("GA4: Disconnected")

	return c.JSON(fiber.Map{
		"disconnected": true,
	})
}

// decryptToken decrypts the AES-256-GCM encrypted token from PHP
func (g *GA4Integration) decryptToken(encryptedBase64 string) (string, error) {
	// Decode base64
	data, err := base64.StdEncoding.DecodeString(encryptedBase64)
	if err != nil {
		return "", err
	}

	// Extract IV (16 bytes) + Tag (16 bytes) + Ciphertext
	if len(data) < 32 {
		return "", fiber.NewError(fiber.StatusBadRequest, "Invalid encrypted data")
	}

	iv := data[:16]
	tag := data[16:32]
	ciphertext := data[32:]

	// Create key from secret (SHA256)
	key := sha256.Sum256([]byte(g.encryptionKey))

	// Create cipher
	block, err := aes.NewCipher(key[:])
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCMWithNonceSize(block, 16)
	if err != nil {
		return "", err
	}

	// Combine ciphertext + tag for Go's GCM implementation
	ciphertextWithTag := append(ciphertext, tag...)

	// Decrypt
	plaintext, err := gcm.Open(nil, iv, ciphertextWithTag, nil)
	if err != nil {
		return "", err
	}

	return string(plaintext), nil
}

// storeConnection saves the connection to the vault file
func (g *GA4Integration) storeConnection(conn *GA4Connection) error {
	g.mu.Lock()
	defer g.mu.Unlock()

	g.connection = conn

	// Persist to file
	data, err := json.Marshal(conn)
	if err != nil {
		return err
	}

	// Ensure data directory exists
	os.MkdirAll("data", 0750)

	return os.WriteFile(g.vaultPath, data, 0600)
}

// loadFromVault loads existing connection from the vault file
func (g *GA4Integration) loadFromVault() {
	data, err := os.ReadFile(g.vaultPath)
	if err != nil {
		return // No vault file, that's OK
	}

	var conn GA4Connection
	if err := json.Unmarshal(data, &conn); err != nil {
		log.Printf("GA4: Failed to load vault: %v", err)
		return
	}

	g.mu.Lock()
	g.connection = &conn
	g.mu.Unlock()

	log.Printf("GA4: Loaded existing connection from vault")
}

// GetRefreshToken returns the stored refresh token (for data fetching)
func (g *GA4Integration) GetRefreshToken() string {
	g.mu.RLock()
	defer g.mu.RUnlock()

	if g.connection == nil {
		return ""
	}
	return g.connection.RefreshToken
}

// IsConnected returns whether GA4 is connected
func (g *GA4Integration) IsConnected() bool {
	g.mu.RLock()
	defer g.mu.RUnlock()
	return g.connection != nil && g.connection.RefreshToken != ""
}
