<?php

namespace ApexAI\Api;

class SearchController
{
    private $api_root;

    public function __construct()
    {
        $this->api_root = 'http://apex-engine:8080/v1';
    }

    public function register_routes()
    {
        register_rest_route('apex/v1', '/search/stats', [
            'methods' => 'GET',
            'callback' => [$this, 'proxy_get_stats'],
            'permission_callback' => function () {
                return current_user_can('manage_options');
            }
        ]);

        register_rest_route('apex/v1', '/search/answer', [
            'methods' => 'POST',
            'callback' => [$this, 'proxy_get_answer'],
            'permission_callback' => '__return_true' // Public can ask for answers (rate limited ideally, but open for now)
        ]);

        // Public telemetry endpoints
        register_rest_route('apex/v1', '/search/track', [
            'methods' => 'POST',
            'callback' => [$this, 'proxy_track_search'],
            'permission_callback' => '__return_true'
        ]);

        register_rest_route('apex/v1', '/404/track', [
            'methods' => 'POST',
            'callback' => [$this, 'proxy_track_404'],
            'permission_callback' => '__return_true'
        ]);
    }

    public function proxy_get_stats($request)
    {
        $response = wp_remote_get($this->api_root . '/search/stats');
        if (is_wp_error($response)) {
            return new \WP_Error('api_error', $response->get_error_message(), ['status' => 500]);
        }
        return json_decode(wp_remote_retrieve_body($response));
    }

    public function proxy_get_answer($request)
    {
        $body = $request->get_json_params();
        $response = wp_remote_post($this->api_root . '/ai/answer', [
            'body' => json_encode($body),
            'headers' => ['Content-Type' => 'application/json']
        ]);

        if (is_wp_error($response)) {
            return new \WP_Error('api_error', $response->get_error_message(), ['status' => 500]);
        }
        return json_decode(wp_remote_retrieve_body($response));
    }

    public function proxy_track_search($request)
    {
        $body = $request->get_json_params();
        wp_remote_post($this->api_root . '/search/track', [
            'body' => json_encode($body),
            'blocking' => false, // Async
            'headers' => ['Content-Type' => 'application/json']
        ]);
        return ['status' => 'ok'];
    }

    public function proxy_track_404($request)
    {
        $body = $request->get_json_params();
        wp_remote_post($this->api_root . '/404/track', [
            'body' => json_encode($body),
            'blocking' => false, // Async
            'headers' => ['Content-Type' => 'application/json']
        ]);
        return ['status' => 'ok'];
    }
}
