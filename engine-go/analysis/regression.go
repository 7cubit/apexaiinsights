package analysis

import (
	"time"
)

// DataPoint represents a sales snapshot (Time vs Inventory Level)
type DataPoint struct {
	Timestamp int64   // Unix timestamp
	Inventory float64 // Current stock count
}

// PredictionResult holds the linear regression output
type PredictionResult struct {
	Slope           float64   // Rate of depletion (items per second)
	Intercept       float64   // Theoretical starting stock
	PredictedZeroAt time.Time // When stock will hit 0
	DaysRemaining   float64   // Human readable days left
	Confidence      float64   // R-squared value
}

// PredictStockOut performs a simple linear regression
func PredictStockOut(history []DataPoint) PredictionResult {
	if len(history) < 2 {
		return PredictionResult{}
	}

	var sumX, sumY, sumXY, sumXX float64
	n := float64(len(history))

	// Normalize time to starts from 0 (seconds since first data point)
	startTime := history[0].Timestamp

	for _, p := range history {
		x := float64(p.Timestamp - startTime)
		y := p.Inventory
		sumX += x
		sumY += y
		sumXY += x * y
		sumXX += x * x
	}

	// Calculate Slope (m) and Intercept (b)
	slope := (n*sumXY - sumX*sumY) / (n*sumXX - sumX*sumX)
	intercept := (sumY - slope*sumX) / n

	// Calculate R-squared (Confidence)
	var ssRes, ssTot float64
	meanY := sumY / n
	for _, p := range history {
		x := float64(p.Timestamp - startTime)
		y := p.Inventory
		predictedY := slope*x + intercept
		ssRes += (y - predictedY) * (y - predictedY)
		ssTot += (y - meanY) * (y - meanY)
	}
	rSquared := 1.0 - (ssRes / ssTot)

	// If slope is >= 0, inventory is not depleting (or is increasing)
	if slope >= 0 {
		return PredictionResult{
			Slope:      slope,
			Intercept:  intercept,
			Confidence: rSquared,
			// DaysRemaining is infinity/undefined effectively
			DaysRemaining: 9999,
		}
	}

	// Solve for y = 0 => 0 = mx + b => x = -b / m
	secondsUntilZero := -intercept / slope
	zeroTime := time.Unix(startTime+int64(secondsUntilZero), 0)

	daysRemaining := secondsUntilZero / (24 * 3600)

	return PredictionResult{
		Slope:           slope,
		Intercept:       intercept,
		PredictedZeroAt: zeroTime,
		DaysRemaining:   daysRemaining,
		Confidence:      rSquared,
	}
}
