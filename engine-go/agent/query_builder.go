package agent

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"
	"time"
)

type QueryBuilder struct {
	OpenAIKey string
	Model     string
}

type ChatRequest struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ChatResponse struct {
	Choices []struct {
		Message Message `json:"message"`
	} `json:"choices"`
}

func NewQueryBuilder(apiKey string) *QueryBuilder {
	return &QueryBuilder{
		OpenAIKey: apiKey,
		Model:     "gpt-4o",
	}
}

// GenerateSQL converts a natural language question into a MySQL query
func (qb *QueryBuilder) GenerateSQL(question string, contextSummary string) (string, error) {
	if qb.OpenAIKey == "" {
		return "", errors.New("OpenAI API key is missing")
	}

	systemPrompt := `You are a MySQL Expert and a Ruthless Business Analyst for a website analytics platform.
Your goal is to translate natural language questions into efficient SQL queries for the 'wp_apex_sessions' and 'wp_apex_visitors' tables.

Schema:
- wp_apex_sessions (id, session_id, fingerprint, started_at, last_activity, page_count, duration_seconds, landing_page, country, device_type, is_bounce)
- wp_apex_visitors (id, fingerprint, first_seen, last_seen, country, city)

Context (Last 24h Summary): ` + contextSummary + `

Rules:
1. Return ONLY the SQL query. No markdown, no explanations.
2. Use valid MySQL syntax.
3. Queries MUST be read-only (SELECT).
4. If the user asks about "visitors", COUNT(DISTINCT fingerprint) or COUNT(session_id) depending on context. Default to sessions.
5. If the user asks "Why is traffic down?", analyse the data but output a SQL query that would PROVE the insight (e.g. comparing today vs yesterday).
6. Limit results to 100 rows unless specified.
`

	reqBody := ChatRequest{
		Model: qb.Model,
		Messages: []Message{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: question},
		},
	}

	jsonBody, _ := json.Marshal(reqBody)

	req, err := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(jsonBody))
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+qb.OpenAIKey)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := ioutil.ReadAll(resp.Body)
		return "", fmt.Errorf("OpenAI API error: %s", string(body))
	}

	var chatResp ChatResponse
	if err := json.NewDecoder(resp.Body).Decode(&chatResp); err != nil {
		return "", err
	}

	if len(chatResp.Choices) == 0 {
		return "", errors.New("no response from AI")
	}

	sql := chatResp.Choices[0].Message.Content
	sql = CleanSQL(sql)

	if err := ValidateSQL(sql); err != nil {
		return "", err
	}

	return sql, nil
}

func CleanSQL(sql string) string {
	sql = strings.TrimSpace(sql)
	sql = strings.ReplaceAll(sql, "```sql", "")
	sql = strings.ReplaceAll(sql, "```", "")
	return strings.TrimSpace(sql)
}

func ValidateSQL(sql string) error {
	upperSQL := strings.ToUpper(sql)
	if !strings.HasPrefix(upperSQL, "SELECT") {
		return errors.New("only SELECT queries are allowed")
	}
	if strings.Contains(upperSQL, "DROP") || strings.Contains(upperSQL, "DELETE") || strings.Contains(upperSQL, "UPDATE") || strings.Contains(upperSQL, "INSERT") {
		return errors.New("destructive queries are prohibited")
	}
	return nil
}
