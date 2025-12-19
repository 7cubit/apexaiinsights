package main

import (
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
)

func TestSaveEvent(t *testing.T) {
	// Create mock DB
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
	}
	defer db.Close()

	repo := &Repository{db: db}

	// Define event
	event := Event{
		Type:        "page_view",
		SessionID:   "sess_123",
		Timestamp:   time.Now().Unix(),
		URL:         "https://example.com",
		Referrer:    "google.com",
		IP:          "127.0.0.1",
		UserAgent:   "Mozilla/5.0",
		Fingerprint: map[string]string{"id": "fp_123"},
		Data:        map[string]interface{}{"foo": "bar"},
	}

	// Expectation: Insert Visitor
	mock.ExpectExec("INSERT INTO wp_apex_visitors").
		WithArgs(
			sqlmock.AnyArg(), // fingerprint
			sqlmock.AnyArg(), // ip
			sqlmock.AnyArg(), // user_agent
			sqlmock.AnyArg(), // screen
			sqlmock.AnyArg(), // country
			sqlmock.AnyArg(), // city
			sqlmock.AnyArg(), // company_name
			sqlmock.AnyArg(), // company_domain
			sqlmock.AnyArg(), // is_isp
		).
		WillReturnResult(sqlmock.NewResult(1, 1))

	// Expectation: Insert Session
	mock.ExpectExec("INSERT INTO wp_apex_sessions").
		WithArgs(
			event.SessionID,
			sqlmock.AnyArg(), // fingerprint
		).
		WillReturnResult(sqlmock.NewResult(1, 1))

	// Expectation: Insert Event
	mock.ExpectExec("INSERT INTO wp_apex_events").
		WithArgs(
			event.SessionID,
			event.Type,
			event.URL,
			event.Referrer,
			sqlmock.AnyArg(), // payload
		).
		WillReturnResult(sqlmock.NewResult(1, 1))

	// Execute
	err = repo.SaveEvent(event)

	// Assert
	assert.NoError(t, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestGetDailyStats(t *testing.T) {
	db, _, err := sqlmock.New()
	if err != nil {
		t.Fatalf("stub db error: %s", err)
	}
	defer db.Close()

	repo := &Repository{db: db}

	stats, err := repo.GetDailyStats()
	assert.NoError(t, err)
	assert.Equal(t, 1200, stats["visitors"])
}
