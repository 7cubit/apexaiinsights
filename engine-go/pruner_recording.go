package main

import (
	"log"
	"time"
)

// PruneRecordings deletes recordings older than 30 days
func (r *Repository) PruneRecordings() {
	result, err := r.db.Exec(`
        DELETE FROM wp_apex_recordings 
        WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
    `)
	if err != nil {
		log.Printf("Recording Prune Error: %v", err)
		return
	}

	rows, _ := result.RowsAffected()
	if rows > 0 {
		log.Printf("Pruned %d old recordings", rows)
	}
}

// StartRecordingPruner runs the pruner every 24 hours
func StartRecordingPruner(repo *Repository) {
	ticker := time.NewTicker(24 * time.Hour)
	go func() {
		for range ticker.C {
			repo.PruneRecordings()
		}
	}()
}
