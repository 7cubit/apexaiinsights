package main

import (
	"time"
)

// AITimeout is the maximum time to wait for OpenAI API responses
const AITimeout = 15 * time.Second

// FallbackResponse represents a graceful degradation response when AI is unavailable
type FallbackResponse struct {
	Insight    string `json:"insight"`
	IsFallback bool   `json:"is_fallback"`
	Reason     string `json:"reason,omitempty"`
}

// Static fallback messages for different contexts
const (
	FallbackOptimization = `<ul>
<li><strong>Simplify Your Forms:</strong> Reduce the number of fields to only essential information to improve completion rates.</li>
<li><strong>Add Progress Indicators:</strong> Show users how far they are in the form to reduce abandonment.</li>
<li><strong>Optimize for Mobile:</strong> Ensure touch targets are large enough and inputs are easy to use on mobile devices.</li>
</ul>`

	FallbackChat = "AI insights are currently unavailable. Configure your OpenAI API key in the plugin settings to unlock intelligent analytics."

	FallbackGeneric = "AI Insight: Traffic is stable. Add an API Key to see deep analysis."

	FallbackLicenseExpired = "AI features require a Pro license. Your 7-day trial has ended. Visit apexaiinsights.com to upgrade."
)

// GetOptimizationFallback returns a fallback response for form optimization requests
func GetOptimizationFallback(reason string) FallbackResponse {
	return FallbackResponse{
		Insight:    FallbackOptimization,
		IsFallback: true,
		Reason:     reason,
	}
}

// GetChatFallback returns a fallback response for chat/ask requests
func GetChatFallback(reason string) FallbackResponse {
	return FallbackResponse{
		Insight:    FallbackChat,
		IsFallback: true,
		Reason:     reason,
	}
}

// GetGenericFallback returns a generic fallback response
func GetGenericFallback(reason string) FallbackResponse {
	return FallbackResponse{
		Insight:    FallbackGeneric,
		IsFallback: true,
		Reason:     reason,
	}
}
