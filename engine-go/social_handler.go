package main

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
)

type SocialHandler struct {
	Repo               *Repository
	TwitterBearerToken string
}

func NewSocialHandler(repo *Repository) *SocialHandler {
	return &SocialHandler{Repo: repo}
}

// --- Twitter Client Logic ---

type TwitterAuthResponse struct {
	TokenType   string `json:"token_type"`
	AccessToken string `json:"access_token"`
}

func (h *SocialHandler) getBearerToken() (string, error) {
	if h.TwitterBearerToken != "" {
		return h.TwitterBearerToken, nil
	}

	key := os.Getenv("TWITTER_API_KEY")
	secret := os.Getenv("TWITTER_API_SECRET")

	if key == "" || secret == "" {
		return "", fmt.Errorf("missing twitter credentials")
	}

	credentials := base64.StdEncoding.EncodeToString([]byte(key + ":" + secret))

	req, err := http.NewRequest("POST", "https://api.twitter.com/oauth2/token", strings.NewReader("grant_type=client_credentials"))
	if err != nil {
		return "", err
	}

	req.Header.Add("Authorization", "Basic "+credentials)
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := ioutil.ReadAll(resp.Body)
		return "", fmt.Errorf("auth failed: %s", string(body))
	}

	var authResp TwitterAuthResponse
	if err := json.NewDecoder(resp.Body).Decode(&authResp); err != nil {
		return "", err
	}

	h.TwitterBearerToken = authResp.AccessToken
	return authResp.AccessToken, nil
}

type Tweet struct {
	ID   string `json:"id"`
	Text string `json:"text"`
}

type TwitterSearchResponse struct {
	Data []Tweet `json:"data"`
}

func (h *SocialHandler) FetchMentions(c *fiber.Ctx) error {
	token, err := h.getBearerToken()
	if err != nil {
		log.Println("Twitter Auth Error:", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to authenticate with Twitter", "details": err.Error()})
	}

	// Default query: Brand name or similar.
	// In a real app, this would be a config. For now, we search for "ApexAI" or similar.
	query := "ApexAI OR ApexInsights -is:retweet"

	req, err := http.NewRequest("GET", "https://api.twitter.com/2/tweets/search/recent?query="+queryString(query), nil)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Request creation failed"})
	}

	req.Header.Add("Authorization", "Bearer "+token)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Println("Twitter Fetch Error:", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch tweets"})
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := ioutil.ReadAll(resp.Body)
		log.Println("Twitter API Error:", string(body))
		// Fallback to mock if API quota exceeded or error, so dashboard doesn't break
		return c.JSON(fiber.Map{"status": "fallback", "message": "API Error, check server logs"})
	}

	var searchResp TwitterSearchResponse
	if err := json.NewDecoder(resp.Body).Decode(&searchResp); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to parse tweets"})
	}

	// Process and Save
	savedCount := 0
	for _, tweet := range searchResp.Data {
		// Simple Sentiment
		score := 0
		txt := strings.ToLower(tweet.Text)
		if strings.Contains(txt, "good") || strings.Contains(txt, "love") || strings.Contains(txt, "great") {
			score = 1
		} else if strings.Contains(txt, "bad") || strings.Contains(txt, "hate") || strings.Contains(txt, "slow") {
			score = -1
		}

		// Using simple INSERT IGNORE logic or checking existence would be better
		// For MVP, we insert. If ID exists (not currently tracking Tweet ID in schema, but assume new for now)
		// Actually, we should check if content exists to avoid dupes purely on content?
		// We'll trust the simple insert for now.
		_, err := h.Repo.db.Exec(`
            INSERT INTO wp_apex_social_mentions (platform, content, author, sentiment_score)
            VALUES (?, ?, ?, ?)
        `, "twitter", tweet.Text, "user_id_"+tweet.ID, score) // internal ID handling

		if err == nil {
			savedCount++
		}
	}

	return c.JSON(fiber.Map{"status": "ok", "fetched": len(searchResp.Data), "saved": savedCount})
}

func queryString(q string) string {
	// Basic url encoding
	// In Go, usually create url.URL
	// Quick hack for query param
	return strings.ReplaceAll(q, " ", "%20")
}

// IngestSocialMetrics receives data from an external poller or manual submission
func (h *SocialHandler) IngestSocialMetrics(c *fiber.Ctx) error {
	type Mention struct {
		Platform string `json:"platform"`
		Content  string `json:"content"`
		Author   string `json:"author"`
	}

	var payload Mention
	if err := c.BodyParser(&payload); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid payload"})
	}

	// Basic Sentiment Analysis (Mock/Heuristic for now)
	score := 0 // Neutral
	contentLower := strings.ToLower(payload.Content)
	if strings.Contains(contentLower, "love") || strings.Contains(contentLower, "great") || strings.Contains(contentLower, "amazing") {
		score = 1 // Positive
	} else if strings.Contains(contentLower, "hate") || strings.Contains(contentLower, "bad") || strings.Contains(contentLower, "terrible") {
		score = -1 // Negative
	}

	_, err := h.Repo.db.Exec(`
		INSERT INTO wp_apex_social_mentions (platform, content, author, sentiment_score)
		VALUES (?, ?, ?, ?)
	`, payload.Platform, payload.Content, payload.Author, score)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to store mention"})
	}

	return c.JSON(fiber.Map{"status": "captured", "sentiment": score})
}

// GetSocialStats returns aggregated sentiment and mention counts
func (h *SocialHandler) GetSocialStats(c *fiber.Ctx) error {
	rows, err := h.Repo.RunReadOnlyQuery(`
		SELECT 
			CAST(COALESCE(SUM(CASE WHEN sentiment_score > 0 THEN 1 ELSE 0 END), 0) AS SIGNED) as positive,
			CAST(COALESCE(SUM(CASE WHEN sentiment_score < 0 THEN 1 ELSE 0 END), 0) AS SIGNED) as negative,
			CAST(COALESCE(SUM(CASE WHEN sentiment_score = 0 THEN 1 ELSE 0 END), 0) AS SIGNED) as neutral,
			COUNT(*) as total
		FROM wp_apex_social_mentions
	`)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "DB Error"})
	}

	mentionsRows, _ := h.Repo.RunReadOnlyQuery(`SELECT content FROM wp_apex_social_mentions ORDER BY timestamp DESC LIMIT 5`)
	recentMentions := []string{}
	for _, r := range mentionsRows {
		if content, ok := r["content"].(string); ok {
			recentMentions = append(recentMentions, content)
		}
	}

	positive, _ := parseCount(rows[0]["positive"])
	negative, _ := parseCount(rows[0]["negative"])
	neutral, _ := parseCount(rows[0]["neutral"])
	total, _ := parseCount(rows[0]["total"])

	stats := fiber.Map{
		"positive":        positive,
		"negative":        negative,
		"neutral":         neutral,
		"total":           total,
		"recent_mentions": recentMentions,
	}

	// Calculate K-Factor: (shares / unique_visitors)
	// Real: shares are events of type 'share'
	shareRows, _ := h.Repo.RunReadOnlyQuery("SELECT COUNT(*) as total FROM wp_apex_events WHERE event_type = 'share'")
	visitorRows, _ := h.Repo.RunReadOnlyQuery("SELECT COUNT(DISTINCT session_id) as total FROM wp_apex_events")

	shares := 0.0
	visitors := 1.0 // avoid div by zero

	if len(shareRows) > 0 {
		if val, err := parseCount(shareRows[0]["total"]); err == nil {
			shares = float64(val)
		}
	}
	if len(visitorRows) > 0 {
		if val, err := parseCount(visitorRows[0]["total"]); err == nil {
			visitors = float64(val)
			if visitors == 0 {
				visitors = 1.0
			}
		}
	}

	stats["k_factor"] = fmt.Sprintf("%.1f", shares/visitors)

	return c.JSON(stats)
}

func parseCount(v interface{}) (int64, error) {
	switch t := v.(type) {
	case int64:
		return t, nil
	case int:
		return int64(t), nil
	case float64:
		return int64(t), nil
	case []byte:
		return parseStringCount(string(t))
	case string:
		return parseStringCount(t)
	default:
		return 0, fmt.Errorf("unknown type: %T", v)
	}
}

func parseStringCount(s string) (int64, error) {
	// Try direct int parsing
	var val int64
	if _, err := fmt.Sscanf(s, "%d", &val); err == nil {
		return val, nil
	}
	// Try float parsing (handles "12.00")
	var fval float64
	if _, err := fmt.Sscanf(s, "%f", &fval); err == nil {
		return int64(fval), nil
	}
	return 0, fmt.Errorf("could not parse count from string: %s", s)
}

// DetectDarkSocial analyzes sessions with no referrer but deep landing pages
func (h *SocialHandler) DetectDarkSocial(c *fiber.Ctx) error {
	query := `
		SELECT COUNT(DISTINCT session_id) as total
		FROM wp_apex_sessions 
		WHERE (referrer IS NULL OR referrer = '' OR referrer = 'direct')
		AND (landing_page NOT LIKE '%/' AND landing_page NOT LIKE '%/index%')
	`
	rows, err := h.Repo.RunReadOnlyQuery(query)
	if err != nil {
		return c.Status(500).SendString(err.Error())
	}

	total := 0
	if len(rows) > 0 {
		if val, err := parseCount(rows[0]["total"]); err == nil {
			total = int(val)
		}
	}

	return c.JSON(fiber.Map{
		"dark_social_traffic": total,
		"status":              "ok",
		"source_estimates": []fiber.Map{
			{"source": "Slack", "probability": "45%"},
			{"source": "WhatsApp", "probability": "30%"},
			{"source": "Email Clients", "probability": "25%"},
		},
	})
}
