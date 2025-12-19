package main

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
)

type PerplexityHandler struct {
	ApiKey string
}

func NewPerplexityHandler() *PerplexityHandler {
	return &PerplexityHandler{
		ApiKey: os.Getenv("PERPLEXITY_API_KEY"),
	}
}

type AnswerRequest struct {
	Query string `json:"query"`
}

// PPLX API Request Structure
type PPLXRequest struct {
	Model    string    `json:"model"`
	Messages []PPLXMsg `json:"messages"`
}

type PPLXMsg struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// PPLX API Response Structure
type PPLXResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

func (h *PerplexityHandler) GetAnswer(c *fiber.Ctx) error {
	var req AnswerRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid payload"})
	}

	if h.ApiKey == "" {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "Perplexity API Key not configured"})
	}

	answer, err := h.callPerplexity(req.Query)
	if err != nil {
		log.Printf("Perplexity API error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to generate answer"})
	}

	return c.JSON(fiber.Map{
		"query":  req.Query,
		"answer": answer,
	})
}

func (h *PerplexityHandler) callPerplexity(query string) (string, error) {
	apiURL := "https://api.perplexity.ai/chat/completions"

	pplxReq := PPLXRequest{
		Model: "sonar-small-online", // Accurate, fast, online-enabled model
		Messages: []PPLXMsg{
			{Role: "system", Content: "You are a helpful search assistant for a WordPress site. Provide a concise, direct answer to the user's query based on general knowledge, as if you are enhancing their search experience. Keep it under 100 words."},
			{Role: "user", Content: query},
		},
	}

	jsonData, err := json.Marshal(pplxReq)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+h.ApiKey)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 200 {
		log.Printf("Perplexity Error: %s", string(body))
		return "", fiber.NewError(resp.StatusCode, "Upstream API Error")
	}

	var pplxResp PPLXResponse
	if err := json.Unmarshal(body, &pplxResp); err != nil {
		return "", err
	}

	if len(pplxResp.Choices) > 0 {
		return pplxResp.Choices[0].Message.Content, nil
	}

	return "No answer found.", nil
}
