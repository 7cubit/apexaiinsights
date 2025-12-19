<?php

namespace ApexAI\Api;

/**
 * REST API Controller for tracking data collection
 */
class CollectController
{

    private const NAMESPACE = 'apex/v1';
    private const ENGINE_URL = 'http://apex-engine:8080';

    public function register(): void
    {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes(): void
    {
        register_rest_route(self::NAMESPACE , '/collect', [
            'methods' => 'POST',
            'callback' => [$this, 'handle_collect'],
            'permission_callback' => '__return_true', // Public endpoint
        ]);
    }

    /**
     * Handle incoming tracking data and forward to Go Engine
     */
    public function handle_collect(\WP_REST_Request $request): \WP_REST_Response
    {
        $payload = $request->get_json_params();

        if (empty($payload)) {
            return new \WP_REST_Response(['error' => 'Invalid payload'], 400);
        }

        // Add server-side fingerprint data
        $payload['ip'] = $this->get_client_ip();
        $payload['ua'] = sanitize_text_field($_SERVER['HTTP_USER_AGENT'] ?? '');

        // Forward to Go Engine
        $response = wp_remote_post(self::ENGINE_URL . '/collect', [
            'headers' => [
                'Content-Type' => 'application/json',
            ],
            'body' => wp_json_encode($payload),
            'timeout' => 5,
        ]);

        if (is_wp_error($response)) {
            // Fallback: store locally if Go Engine is down
            $this->store_locally($payload);
            return new \WP_REST_Response(['status' => 'queued'], 202);
        }

        return new \WP_REST_Response(['status' => 'ok'], 200);
    }

    /**
     * Get the client's real IP address
     */
    private function get_client_ip(): string
    {
        $headers = [
            'HTTP_CF_CONNECTING_IP', // Cloudflare
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_REAL_IP',
            'REMOTE_ADDR',
        ];

        foreach ($headers as $header) {
            if (!empty($_SERVER[$header])) {
                $ip = explode(',', $_SERVER[$header])[0];
                return sanitize_text_field(trim($ip));
            }
        }

        return '';
    }

    /**
     * Store data locally as fallback (Fallback Mode)
     */
    private function store_locally(array $payload): void
    {
        global $wpdb;
        $table = $wpdb->prefix . 'apex_events';

        $wpdb->insert($table, [
            'event_type' => sanitize_key($payload['t'] ?? 'unknown'),
            'session_id' => sanitize_key($payload['sid'] ?? ''),
            'payload' => wp_json_encode($payload),
            'created_at' => current_time('mysql'),
        ]);
    }
}
