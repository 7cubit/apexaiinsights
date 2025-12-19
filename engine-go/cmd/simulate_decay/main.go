package main

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/go-sql-driver/mysql"
)

func main() {
	// Connect to local MySQL
	dsn := "apex:apex_password@tcp(localhost:3306)/wordpress"
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatalf("Failed to connect: %v", err)
	}
	defer db.Close()

	// 1. Create a Fake Clean Post
	_, err = db.Exec(`
		INSERT INTO wp_posts (post_author, post_date, post_content, post_title, post_status, post_name, post_type)
		VALUES (1, NOW(), 'Content...', 'Simulation: Content Decay Test', 'publish', 'sim-decay-test', 'post')
	`)
	if err != nil {
		log.Printf("Might already exist, continuing: %v", err)
	}

	// 2. Insert "Previous 30 Days" Traffic (HIGH)
	// 60 days ago to 30 days ago
	log.Println("Injecting HIGH traffic for previous period...")
	for i := 0; i < 50; i++ {
		// -45 days average
		db.Exec(`INSERT INTO wp_apex_events (session_id, event_type, url, created_at) VALUES (?, 'pageview', 'http://localhost:8000/sim-decay-test', DATE_SUB(NOW(), INTERVAL 45 DAY))`, fmt.Sprintf("sim-old-%d", i))
	}

	// 3. Insert "Current 30 Days" Traffic (LOW)
	// 30 days ago to now
	log.Println("Injecting LOW traffic for current period (Simulating Decay)...")
	for i := 0; i < 10; i++ {
		// -10 days average
		db.Exec(`INSERT INTO wp_apex_events (session_id, event_type, url, created_at) VALUES (?, 'pageview', 'http://localhost:8000/sim-decay-test', DATE_SUB(NOW(), INTERVAL 10 DAY))`, fmt.Sprintf("sim-new-%d", i))
	}

	// 4. Verify Logic
	// We expect Previous: 50, Current: 10 => Decay ~ -80%
	rows, _ := db.Query(`
        SELECT COUNT(*) FROM wp_apex_events WHERE url LIKE '%sim-decay-test%' AND created_at BETWEEN DATE_SUB(NOW(), INTERVAL 60 DAY) AND DATE_SUB(NOW(), INTERVAL 30 DAY)
    `)
	var prev int
	rows.Next()
	rows.Scan(&prev)
	rows.Close()

	rows, _ = db.Query(`
        SELECT COUNT(*) FROM wp_apex_events WHERE url LIKE '%sim-decay-test%' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `)
	var curr int
	rows.Next()
	rows.Scan(&curr)
	rows.Close()

	fmt.Printf("Simulation Result: Previous Period: %d, Current Period: %d\n", prev, curr)
	if prev > 0 {
		drop := float64(curr-prev) / float64(prev) * 100
		fmt.Printf("Calculated Drop: %.2f%%\n", drop)
		if drop < -15.0 {
			fmt.Println("SUCCESS: Decay Alert would be triggered (>15% drop).")
		} else {
			fmt.Println("FAILURE: Drop not significant enough.")
		}
	}
}
