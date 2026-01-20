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

        register_rest_route(self::NAMESPACE , '/stats/traffic', [
            'methods' => 'GET',
            'callback' => [$this, 'proxy_get_traffic_stats'],
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

        register_rest_route(self::NAMESPACE , '/stats/kpi', [
            'methods' => 'GET',
            'callback' => [$this, 'proxy_get_kpi_stats'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::NAMESPACE , '/stats/content', [
            'methods' => 'GET',
            'callback' => [$this, 'proxy_get_content_stats'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::NAMESPACE , '/analysis/decay', [
            'methods' => 'GET',
            'callback' => [$this, 'proxy_get_decay'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::NAMESPACE , '/analysis/authors', [
            'methods' => 'GET',
            'callback' => [$this, 'proxy_get_authors'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::NAMESPACE , '/woocommerce/stats', [
            'methods' => 'GET',
            'callback' => [$this, 'proxy_get_woo_stats'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::NAMESPACE , '/woocommerce/velocity', [
            'methods' => 'GET',
            'callback' => [$this, 'proxy_get_woo_velocity'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::NAMESPACE , '/overview/batch', [
            'methods' => 'GET',
            'callback' => [$this, 'get_overview_batch'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::NAMESPACE , '/replay/list', [
            'methods' => 'GET',
            'callback' => [$this, 'proxy_get_replay_list'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::NAMESPACE , '/analysis/readability', [
            'methods' => 'GET',
            'callback' => [$this, 'proxy_get_readability'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::NAMESPACE , '/analysis/cannibalization', [
            'methods' => 'GET',
            'callback' => [$this, 'proxy_get_cannibalization'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::NAMESPACE , '/analysis/gsc-overlay', [
            'methods' => 'GET',
            'callback' => [$this, 'proxy_get_gsc_overlay'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::NAMESPACE , '/replay/session/(?P<id>[a-zA-Z0-9-]+)', [
            'methods' => 'GET',
            'callback' => [$this, 'proxy_get_replay_session'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::NAMESPACE , '/stats/search', [
            'methods' => 'GET',
            'callback' => [$this, 'proxy_get_search_stats'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::NAMESPACE , '/ai/answer', [
            'methods' => 'POST',
            'callback' => [$this, 'proxy_ask_perplexity'],
            'permission_callback' => [$this, 'check_permission'],
        ]);
    }

    /**
     * Get a batch of overview stats in one request
     */
    public function get_overview_batch(\WP_REST_Request $request): \WP_REST_Response
    {
        $range = $request->get_param('range') ?? '7d';

        $kpi = $this->proxy_get('/v1/stats/kpi?range=' . $range, 120)->get_data();
        // Assuming a 'traffic' endpoint exists or will be added.
        // For now, let's mock it or return an empty array if not implemented.
        // If it's meant to be a proxy_get, it needs a corresponding endpoint in the Go engine.
        // For the purpose of this edit, I'll assume it's a proxy_get to a '/v1/stats/traffic' endpoint.
        $traffic = $this->proxy_get('/v1/stats/traffic?range=' . $range, 120)->get_data();
        $live = $this->get_live_stats()->get_data();

        return new \WP_REST_Response([
            'kpi' => $kpi,
            'traffic' => $traffic,
            'live' => $live,
        ], 200);
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
            $response = wp_remote_get($base . '/health', ['timeout' => 1]);
            if (!is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200) {
                set_transient($cache_key, $base, HOUR_IN_SECONDS);
                return $base . $path;
            }
        }

        return null;
    }

    /**
     * Helper to proxy GET requests with caching
     */
    private function proxy_get(string $endpoint, int $expiration = 60): \WP_REST_Response
    {
        $cache_key = 'apex_api_cache_' . md5($endpoint);
        $cached_data = get_transient($cache_key);

        if ($cached_data !== false) {
            return new \WP_REST_Response($cached_data, 200);
        }

        $engine_url = $this->get_engine_url($endpoint);
        if (!$engine_url) {
            return new \WP_REST_Response(['error' => 'Engine Connection Failure'], 503);
        }

        $response = wp_remote_get($engine_url, ['timeout' => 15]);
        if (is_wp_error($response)) {
            return new \WP_REST_Response(['error' => 'Engine Error: ' . $response->get_error_message()], 503);
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if ($data) {
            set_transient($cache_key, $data, $expiration);
        }

        return new \WP_REST_Response($data, 200);
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
        $range = $request->get_param('range') ?: '7d';
        return $this->proxy_get('/v1/stats/forms?range=' . urlencode($range), 300); // 5 min cache
    }

    /**
     * Proxy KPI stats request to Go Engine (Production Readiness)
     */
    public function proxy_get_kpi_stats(\WP_REST_Request $request): \WP_REST_Response
    {
        $range = $request->get_param('range') ?? '7d';
        return $this->proxy_get('/v1/stats/kpi?range=' . $range, 120); // 2 min cache
    }

    /**
     * Proxy content stats request to Go Engine
     */
    public function proxy_get_content_stats(\WP_REST_Request $request): \WP_REST_Response
    {
        $range = $request->get_param('range') ?? '7d';
        return $this->proxy_get('/v1/stats/content?range=' . $range, 300); // 5 min cache
    }

    /**
     * Proxy decay analysis request to Go Engine
     */
    public function proxy_get_decay(\WP_REST_Request $request): \WP_REST_Response
    {
        $range = $request->get_param('range') ?? '7d';
        return $this->proxy_get('/v1/analysis/decay?range=' . $range, 600); // 10 min cache
    }

    /**
     * Proxy author leaderboard request to Go Engine
     */
    public function proxy_get_authors(\WP_REST_Request $request): \WP_REST_Response
    {
        $go_engine_url = $this->get_engine_url('/v1/analysis/authors');

        if (!$go_engine_url) {
            return new \WP_REST_Response(['error' => 'Engine Unreachable'], 503);
        }

        $response = wp_remote_get($go_engine_url, ['timeout' => 5]);

        if (is_wp_error($response)) {
            return new \WP_REST_Response(['error' => 'Engine Unreachable'], 503);
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        return new \WP_REST_Response($data, 200);
    }

    /**
     * Proxy WooCommerce stats request to Go Engine
     */
    public function proxy_get_woo_stats(\WP_REST_Request $request): \WP_REST_Response
    {
        $range = $request->get_param('range') ?? '7d';
        $go_engine_url = $this->get_engine_url('/v1/woocommerce/stats?range=' . $range);

        if (!$go_engine_url) {
            return new \WP_REST_Response(['error' => 'Engine Unreachable'], 503);
        }

        $response = wp_remote_get($go_engine_url, ['timeout' => 5]);

        if (is_wp_error($response)) {
            return new \WP_REST_Response(['error' => 'Engine Unreachable'], 503);
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        return new \WP_REST_Response($data, 200);
    }

    /**
     * Proxy WooCommerce velocity request to Go Engine
     */
    public function proxy_get_woo_velocity(\WP_REST_Request $request): \WP_REST_Response
    {
        $range = $request->get_param('range') ?? '7d';
        return $this->proxy_get('/v1/woocommerce/velocity?range=' . $range, 120); // 2 min cache
    }

    /**
     * Proxy replay list request to Go Engine
     */
    public function proxy_get_replay_list(\WP_REST_Request $request): \WP_REST_Response
    {
        return $this->proxy_get('/v1/replays', 30); // 30s cache for replays
    }

    /**
     * Proxy replay session request to Go Engine
     */
    public function proxy_get_replay_session(\WP_REST_Request $request): \WP_REST_Response
    {
        $session_id = $request->get_param('id');
        return $this->proxy_get('/v1/replays/session/' . $session_id, 3600); // 1h cache for static session data
    }

    /**
     * Proxy search stats request to Go Engine
     */
    public function proxy_get_search_stats(\WP_REST_Request $request): \WP_REST_Response
    {
        $range = $request->get_param('range') ?? '7d';
        return $this->proxy_get('/v1/search/stats?range=' . $range, 300); // 5 min cache
    }

    public function proxy_get_readability(\WP_REST_Request $request)
    {
        return $this->proxy_get('/v1/analysis/readability', 10 * MINUTE_IN_SECONDS);
    }

    public function proxy_get_cannibalization(\WP_REST_Request $request)
    {
        return $this->proxy_get('/v1/analysis/cannibalization', 1 * HOUR_IN_SECONDS);
    }

    public function proxy_get_gsc_overlay(\WP_REST_Request $request)
    {
        $days = $request->get_param('days') ?: 30;
        return $this->proxy_get('/v1/analysis/gsc-overlay?days=' . $days, 4 * HOUR_IN_SECONDS);
    }

    /**
     * Proxy AI answer (Perplexity) request to Go Engine
     */
    public function proxy_ask_perplexity(\WP_REST_Request $request): \WP_REST_Response
    {
        $payload = $request->get_json_params();
        if (empty($payload['query'])) {
            return new \WP_REST_Response(['error' => 'Query is required'], 400);
        }

        $engine_url = $this->get_engine_url('/v1/ai/answer');
        if (!$engine_url) {
            return new \WP_REST_Response(['error' => 'Engine Connection Failure'], 503);
        }

        $response = wp_remote_post($engine_url, [
            'body' => json_encode(['query' => $payload['query']]),
            'headers' => ['Content-Type' => 'application/json'],
            'timeout' => 30,
        ]);

        if (is_wp_error($response)) {
            return new \WP_REST_Response(['error' => 'Engine Error: ' . $response->get_error_message()], 503);
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        return new \WP_REST_Response($data, 200);
    }
}
