<?php

namespace ApexAI\Api;

/**
 * REST API Controller for Analytics Stats
 */
class StatsController
{

    private const NAMESPACE = 'apex/v1';

    public function register(): void
    {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes(): void
    {
        register_rest_route(self::NAMESPACE , '/stats/live', [
            'methods' => 'GET',
            'callback' => [$this, 'get_live_stats'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::NAMESPACE , '/stats/ask', [
            'methods' => 'POST',
            'callback' => [$this, 'proxy_ask_agent'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::NAMESPACE , '/stats/optimize', [
            'methods' => 'POST',
            'callback' => [$this, 'proxy_optimize_form'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::NAMESPACE , '/stats/forms', [
            'methods' => 'GET',
            'callback' => [$this, 'proxy_get_form_stats'],
            'permission_callback' => [$this, 'check_permission'],
        ]);
    }

    public function check_permission(): bool
    {
        return current_user_can('manage_options');
    }

    /**
     * Get live active users (last 5 minutes)
     */
    public function get_live_stats(): \WP_REST_Response
    {
        global $wpdb;
        $table = $wpdb->prefix . 'apex_sessions';

        // Count sessions active in the last 5 minutes
        $count = $wpdb->get_var("
            SELECT COUNT(*) 
            FROM $table 
            WHERE last_activity > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
        ");

        return new \WP_REST_Response([
            'active_users' => (int) $count
        ], 200);
    }

    /**
     * Proxy natural language questions to the Go Engine
     */
    public function proxy_ask_agent(\WP_REST_Request $request): \WP_REST_Response
    {
        $payload = $request->get_json_params();
        if (empty($payload['question'])) {
            return new \WP_REST_Response(['error' => 'Question is required'], 400);
        }

        $go_engine_url = $this->get_engine_url('/v1/ask');
        if (!$go_engine_url) {
            return new \WP_REST_Response(['error' => 'Intelligence Engine Unreachable. Please check system status.'], 503);
        }

        $response = wp_remote_post($go_engine_url, [
            'body' => json_encode(['question' => $payload['question']]),
            'headers' => ['Content-Type' => 'application/json'],
            'timeout' => 45, // AI might take time
        ]);

        if (is_wp_error($response)) {
            return new \WP_REST_Response(['error' => 'Engine Error: ' . $response->get_error_message()], 503);
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        return new \WP_REST_Response($data, 200);
    }

    /**
     * Helper to find the working engine URL
     */
    private function get_engine_url(string $path = ''): ?string
    {
        $cache_key = 'apex_engine_url_detected';
        $cached_url = get_transient($cache_key);
        if ($cached_url) {
            return $cached_url . $path;
        }

        $endpoints = [
            'http://apex-engine:8080',
            'http://host.docker.internal:8080',
            'http://localhost:8080',
            'http://127.0.0.1:8080'
        ];

        foreach ($endpoints as $base) {
            $response = wp_remote_get($base . '/debug/health', ['timeout' => 1]);
            if (!is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200) {
                set_transient($cache_key, $base, HOUR_IN_SECONDS);
                return $base . $path;
            }
        }

        return null;
    }

    /**
     * Proxy form optimization request to Go Engine
     */
    public function proxy_optimize_form(\WP_REST_Request $request): \WP_REST_Response
    {
        $payload = $request->get_json_params();
        $go_engine_url = $this->get_engine_url('/v1/optimize/form');

        if (!$go_engine_url) {
            return new \WP_REST_Response(['error' => 'Engine Unreachable'], 503);
        }

        $response = wp_remote_post($go_engine_url, [
            'body' => json_encode($payload),
            'headers' => ['Content-Type' => 'application/json'],
            'timeout' => 60, // AI takes time
        ]);

        if (is_wp_error($response)) {
            return new \WP_REST_Response(['error' => 'Engine Unreachable: ' . $response->get_error_message()], 503);
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        return new \WP_REST_Response($data, 200);
    }

    /**
     * Proxy form stats request to Go Engine (Phase 9)
     */
    public function proxy_get_form_stats(\WP_REST_Request $request): \WP_REST_Response
    {
        $go_engine_url = $this->get_engine_url('/v1/stats/forms');

        if (!$go_engine_url) {
            return new \WP_REST_Response(['error' => 'Engine Unreachable'], 503);
        }

        $response = wp_remote_get($go_engine_url, [
            'timeout' => 5,
        ]);

        if (is_wp_error($response)) {
            return new \WP_REST_Response(['error' => 'Engine Unreachable'], 503);
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        return new \WP_REST_Response($data, 200);
    }
}
