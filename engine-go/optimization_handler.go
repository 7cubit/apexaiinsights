package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"

	"github.com/gofiber/fiber/v2"
)

type OptimizationHandler struct {
	apiKey string
}

func NewOptimizationHandler() *OptimizationHandler {
	return &OptimizationHandler{
		apiKey: os.Getenv("OPENAI_API_KEY"),
	}
}

type OptimizationRequest struct {
	FormID  string `json:"form_id"`
	Metrics struct {
		Fields []struct {
			Name      string  `json:"name"`
			DwellTime float64 `json:"dwell_time"` // milliseconds
			DropOffs  int     `json:"drop_offs"`
		} `json:"fields"`
		CompletionRate float64 `json:"completion_rate"`
	} `json:"metrics"`
}

type OpenAIResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

func (h *OptimizationHandler) GetSuggestions(c *fiber.Ctx) error {
	var req OptimizationRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid payload"})
	}

	if h.apiKey == "" {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "AI service not configured"})
	}

	// Construct prompt for GPT-4o
	prompt := fmt.Sprintf(`
Analyze this form friction data and provide 3 specific, actionable UI/UX improvements to increase conversion.
Form ID: %s
Completion Rate: %.1f%%

Field Metrics (High friction items):
`, req.FormID, req.Metrics.CompletionRate)

	for _, field := range req.Metrics.Fields {
		prompt += fmt.Sprintf("- Field '%s': %.1fs dwell time, %d drop-offs\n", field.Name, field.DwellTime/1000, field.DropOffs)
	}

	prompt += "\nFormat response as a clean HTML list (<ul><li>...</li></ul>) without markdown code blocks."

	// Call OpenAI API
	response, err := h.callOpenAI(prompt)
	if err != nil {
		log.Printf("OpenAI error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "AI analysis failed"})
	}

	return c.JSON(fiber.Map{
		"suggestions": response,
	})
}

func (h *OptimizationHandler) callOpenAI(prompt string) (string, error) {
	requestBody, _ := json.Marshal(map[string]interface{}{
		"model": "gpt-4o",
		"messages": []map[string]string{
			{"role": "system", "content": "You are a UX optimization expert specializing in form conversion rate optimization."},
			{"role": "user", "content": prompt},
		},
		"max_tokens": 300,
	})

	req, err := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(requestBody))
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+h.apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return "", fmt.Errorf("OpenAI API returned status: %d", resp.StatusCode)
	}

	body, _ := ioutil.ReadAll(resp.Body)
	var openAIResp OpenAIResponse
	if err := json.Unmarshal(body, &openAIResp); err != nil {
		return "", err
	}

	if len(openAIResp.Choices) > 0 {
		return openAIResp.Choices[0].Message.Content, nil
	}

	return "No suggestions generated.", nil
}
