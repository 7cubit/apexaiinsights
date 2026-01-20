package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
)

type AutomationHandler struct {
	repo *Repository
}

func NewAutomationHandler(repo *Repository) *AutomationHandler {
	return &AutomationHandler{repo: repo}
}

type AutomationRule struct {
	ID            int             `json:"id"`
	Name          string          `json:"name"`
	TriggerType   string          `json:"trigger_type"`
	TriggerConfig json.RawMessage `json:"trigger_config"`
	ActionType    string          `json:"action_type"`
	ActionConfig  json.RawMessage `json:"action_config"`
	IsActive      bool            `json:"is_active"`
	CreatedAt     string          `json:"created_at"`
}

type EventPayload struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

// REST: Create Rule
func (h *AutomationHandler) CreateRule(c *fiber.Ctx) error {
	var rule AutomationRule
	if err := c.BodyParser(&rule); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid payload"})
	}

	_, err := h.repo.db.Exec(`
		INSERT INTO wp_apex_automation_rules (name, trigger_type, trigger_config, action_type, action_config, is_active, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`, rule.Name, rule.TriggerType, rule.TriggerConfig, rule.ActionType, rule.ActionConfig, true, time.Now())

	if err != nil {
		log.Printf("Create rule error: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "DB Error"})
	}

	return c.JSON(fiber.Map{"status": "created"})
}

// REST: Get Rules
func (h *AutomationHandler) GetRules(c *fiber.Ctx) error {
	rows, err := h.repo.db.Query("SELECT id, name, trigger_type, trigger_config, action_type, action_config, is_active, created_at FROM wp_apex_automation_rules ORDER BY created_at DESC")
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	var rules []AutomationRule
	for rows.Next() {
		var r AutomationRule
		var isActive bool // scan boolean
		if err := rows.Scan(&r.ID, &r.Name, &r.TriggerType, &r.TriggerConfig, &r.ActionType, &r.ActionConfig, &isActive, &r.CreatedAt); err == nil {
			r.IsActive = isActive
			rules = append(rules, r)
		}
	}
	return c.JSON(rules)
}

// REST: Delete Rule
func (h *AutomationHandler) DeleteRule(c *fiber.Ctx) error {
	id := c.Params("id")
	_, err := h.repo.db.Exec("DELETE FROM wp_apex_automation_rules WHERE id = ?", id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"status": "deleted"})
}

// Internal: Receive Event (from PHP or Ticker) -> Evaluate Rules
func (h *AutomationHandler) IngestEvent(c *fiber.Ctx) error {
	var event EventPayload
	if err := c.BodyParser(&event); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid payload"})
	}

	// Fetch active rules matching trigger
	rows, err := h.repo.db.Query("SELECT id, name, trigger_config, action_type, action_config FROM wp_apex_automation_rules WHERE is_active = 1 AND trigger_type = ?", event.Type)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	for rows.Next() {
		var rule AutomationRule
		rows.Scan(&rule.ID, &rule.Name, &rule.TriggerConfig, &rule.ActionType, &rule.ActionConfig)

		// Basic Logic: Assume if trigger type matches, we execute.
		// In a real engine, we'd check TriggerConfig thresholds (e.g. load > 80)
		log.Printf("Executing Rule: %s for Event: %s", rule.Name, event.Type)
		go h.executeAction(rule.ActionType, rule.ActionConfig, event.Payload)
	}

	return c.JSON(fiber.Map{"status": "processed"})
}

func (h *AutomationHandler) executeAction(actionType string, config json.RawMessage, payload json.RawMessage) {
	// Config struct
	var actionCfg struct {
		Email   string `json:"email"`
		Message string `json:"message"`
		Url     string `json:"url"`
		Notice  string `json:"notice"`
	}
	json.Unmarshal(config, &actionCfg)

	switch actionType {
	case "email":
		// Try EmailIt First
		apiKey := os.Getenv("EMAILIT_API_KEY")
		var err error
		if apiKey != "" {
			err = h.sendEmailIt(apiKey, "alerts@apexaiinsights.com", actionCfg.Email, "[Apex Auto-Pilot] Alert", actionCfg.Message)
			if err == nil {
				log.Printf("EmailIt Sent to %s", actionCfg.Email)
				return
			}
			log.Printf("EmailIt Failed: %v, falling back to WordPress", err)
		}

		// Fallback to WordPress Internal API
		h.sendViaWordPress(actionCfg.Email, "[Apex Auto-Pilot] Alert", actionCfg.Message)

	case "webhook":
		http.Post(actionCfg.Url, "application/json", bytes.NewBuffer(payload))

	case "notice":
		// For notices, we might store them in DB for PHP to fetch on next load
		// OR call notification API
		// IMPLEMENTATION: Maybe just log it for now
		log.Printf("[NOTICE] %s", actionCfg.Notice)
	}
}

// EmailIt Implementation
type EmailItPayload struct {
	From    string `json:"from"`
	To      string `json:"to"`
	Subject string `json:"subject"`
	HTML    string `json:"html"`
}

func (h *AutomationHandler) sendEmailIt(apiKey, from, to, subject, htmlBody string) error {
	url := "https://api.emailit.com/v1/emails"
	email := EmailItPayload{
		From:    from,
		To:      to,
		Subject: subject,
		HTML:    htmlBody,
	}

	emailData, err := json.Marshal(email)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(emailData))
	if err != nil {
		return err
	}

	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("API Error: %s", resp.Status)
	}

	return nil
}

func (h *AutomationHandler) sendViaWordPress(to, subject, message string) {
	wordpressURL := "http://wp-app/wp-json/apex/v1/internal/send_mail" // Internal Docker URL
	payload := map[string]string{
		"to":      to,
		"subject": subject,
		"message": message,
	}
	body, _ := json.Marshal(payload)

	resp, err := http.Post(wordpressURL, "application/json", bytes.NewBuffer(body))
	if err != nil {
		log.Printf("WordPress Mail Fallback Failed: %v", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		log.Printf("WordPress Mail Fallback HTTP Error: %s", resp.Status)
	} else {
		log.Printf("WordPress Mail Fallback Sent to %s", to)
	}
}

// REST: Test Rule
func (h *AutomationHandler) TestRule(c *fiber.Ctx) error {
	id := c.Params("id")
	var rule AutomationRule
	err := h.repo.db.QueryRow("SELECT id, name, action_type, action_config FROM wp_apex_automation_rules WHERE id = ?", id).
		Scan(&rule.ID, &rule.Name, &rule.ActionType, &rule.ActionConfig)

	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Rule not found"})
	}

	log.Printf("Testing Rule: %s", rule.Name)
	go h.executeAction(rule.ActionType, rule.ActionConfig, json.RawMessage(`{"test": true}`))

	return c.JSON(fiber.Map{"status": "test_initiated", "rule": rule.Name})
}
