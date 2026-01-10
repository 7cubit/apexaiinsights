package agent

import "errors"

// Exported error constants for typed error detection in handlers
var (
	ErrMissingAPIKey = errors.New("openai: API key is missing")
	ErrAPITimeout    = errors.New("openai: request timed out")
	ErrNoResponse    = errors.New("openai: no response from AI")
)
