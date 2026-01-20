<?php

namespace ApexAI;

/**
 * Database Schema Manager
 * Handles table creation and migrations
 */
class Schema
{

    public static function install(): void
    {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();

        // Visitors table
        $sql_visitors = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}apex_visitors (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            fingerprint VARCHAR(64) NOT NULL UNIQUE,
            ip_hash VARCHAR(64) NOT NULL,
            user_agent VARCHAR(512) DEFAULT '',
            screen_resolution VARCHAR(20) DEFAULT '',
            country VARCHAR(2) DEFAULT '',
            city VARCHAR(100) DEFAULT '',
            first_seen DATETIME NOT NULL,
            last_seen DATETIME DEFAULT NULL,
            INDEX idx_fingerprint (fingerprint),
            INDEX idx_first_seen (first_seen),
            INDEX idx_country (country)
        ) $charset_collate;";

        // Sessions table
        $sql_sessions = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}apex_sessions (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            session_id VARCHAR(36) NOT NULL UNIQUE,
            fingerprint VARCHAR(64) NOT NULL,
            started_at DATETIME NOT NULL,
            last_activity DATETIME NOT NULL,
            page_count INT UNSIGNED DEFAULT 1,
            duration_seconds INT UNSIGNED DEFAULT 0,
            landing_page VARCHAR(2048) DEFAULT '',
            exit_page VARCHAR(2048) DEFAULT '',
            referrer VARCHAR(2048) DEFAULT '',
            is_bounce TINYINT(1) DEFAULT 1,
            INDEX idx_session_id (session_id),
            INDEX idx_fingerprint (fingerprint),
            INDEX idx_started_at (started_at),
            INDEX idx_referrer (referrer(191))
        ) $charset_collate;";

        // Events table
        $sql_events = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}apex_events (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            session_id VARCHAR(36) NOT NULL,
            event_type VARCHAR(20) NOT NULL,
            url VARCHAR(2048) NOT NULL,
            referrer VARCHAR(2048) DEFAULT '',
            payload JSON,
            created_at DATETIME NOT NULL,
            INDEX idx_session_id (session_id),
            INDEX idx_event_type (event_type),
            INDEX idx_created_at (created_at)
        ) $charset_collate;";

        // Hourly stats
        $sql_hourly = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}apex_hourly_stats (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            hour DATETIME NOT NULL,
            visitors INT UNSIGNED DEFAULT 0,
            sessions INT UNSIGNED DEFAULT 0,
            pageviews INT UNSIGNED DEFAULT 0,
            bounces INT UNSIGNED DEFAULT 0,
            total_duration INT UNSIGNED DEFAULT 0,
            UNIQUE KEY idx_hour (hour)
        ) $charset_collate;";

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        dbDelta($sql_visitors);
        dbDelta($sql_sessions);
        dbDelta($sql_events);
        dbDelta($sql_hourly);
    }
}
