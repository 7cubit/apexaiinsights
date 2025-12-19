<?php

namespace ApexAI\Services;

class DataPruner
{

    public function register(): void
    {
        add_action('apex_hourly_cleanup', [$this, 'run_aggregation']);

        if (!wp_next_scheduled('apex_hourly_cleanup')) {
            wp_schedule_event(time(), 'hourly', 'apex_hourly_cleanup');
        }
    }

    public function run_aggregation(): void
    {
        global $wpdb;

        $sessions_table = $wpdb->prefix . 'apex_sessions';
        $stats_table = $wpdb->prefix . 'apex_hourly_stats';

        // Aggregate data from sessions table into hourly stats
        // We look at sessions updated in the last hour to ensure we capture late activity
        // ON DUPLICATE KEY UPDATE ensures we update existing hourly rows as sessions grow
        $query = "
            INSERT INTO $stats_table (hour, visitors, sessions, pageviews, bounces, total_duration)
            SELECT 
                DATE_FORMAT(started_at, '%Y-%m-%d %H:00:00') as hour,
                COUNT(DISTINCT fingerprint) as visitors,
                COUNT(session_id) as sessions,
                SUM(page_count) as pageviews,
                SUM(is_bounce) as bounces,
                SUM(duration_seconds) as total_duration
            FROM $sessions_table
            WHERE started_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            GROUP BY hour
            ON DUPLICATE KEY UPDATE
                visitors = VALUES(visitors),
                sessions = VALUES(sessions),
                pageviews = VALUES(pageviews),
                bounces = VALUES(bounces),
                total_duration = VALUES(total_duration)
        ";

        $wpdb->query($query);
    }
}
