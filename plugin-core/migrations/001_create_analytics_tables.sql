-- Apex AI Insights - Database Schema
-- Optimized for high-write workloads

-- Visitors table (unique users identified by fingerprint)
CREATE TABLE IF NOT EXISTS `wp_apex_visitors` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `fingerprint` VARCHAR(64) NOT NULL UNIQUE,
    `ip_hash` VARCHAR(64) NOT NULL,
    `user_agent` VARCHAR(512) DEFAULT '',
    `screen_resolution` VARCHAR(20) DEFAULT '',
    `country` VARCHAR(2) DEFAULT '',
    `city` VARCHAR(100) DEFAULT '',
    `first_seen` DATETIME NOT NULL,
    `last_seen` DATETIME DEFAULT NULL,
    INDEX `idx_fingerprint` (`fingerprint`),
    INDEX `idx_first_seen` (`first_seen`),
    INDEX `idx_country` (`country`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sessions table (user sessions)
CREATE TABLE IF NOT EXISTS `wp_apex_sessions` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `session_id` VARCHAR(36) NOT NULL UNIQUE,
    `fingerprint` VARCHAR(64) NOT NULL,
    `started_at` DATETIME NOT NULL,
    `last_activity` DATETIME NOT NULL,
    `page_count` INT UNSIGNED DEFAULT 1,
    `duration_seconds` INT UNSIGNED DEFAULT 0,
    `landing_page` VARCHAR(2048) DEFAULT '',
    `exit_page` VARCHAR(2048) DEFAULT '',
    `referrer` VARCHAR(2048) DEFAULT '',
    `is_bounce` TINYINT(1) DEFAULT 1,
    INDEX `idx_session_id` (`session_id`),
    INDEX `idx_fingerprint` (`fingerprint`),
    INDEX `idx_started_at` (`started_at`),
    FOREIGN KEY (`fingerprint`) REFERENCES `wp_apex_visitors`(`fingerprint`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Events table (raw event logs)
CREATE TABLE IF NOT EXISTS `wp_apex_events` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `session_id` VARCHAR(36) NOT NULL,
    `event_type` VARCHAR(20) NOT NULL,
    `url` VARCHAR(2048) NOT NULL,
    `referrer` VARCHAR(2048) DEFAULT '',
    `payload` JSON,
    `created_at` DATETIME NOT NULL,
    INDEX `idx_session_id` (`session_id`),
    INDEX `idx_event_type` (`event_type`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Hourly aggregates (for fast reporting)
CREATE TABLE IF NOT EXISTS `wp_apex_hourly_stats` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `hour` DATETIME NOT NULL,
    `visitors` INT UNSIGNED DEFAULT 0,
    `sessions` INT UNSIGNED DEFAULT 0,
    `pageviews` INT UNSIGNED DEFAULT 0,
    `bounces` INT UNSIGNED DEFAULT 0,
    `total_duration` INT UNSIGNED DEFAULT 0,
    UNIQUE KEY `idx_hour` (`hour`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
