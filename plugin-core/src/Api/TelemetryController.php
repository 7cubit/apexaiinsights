<?php

namespace ApexAI\Api;

/**
 * REST API Controller for Form Telemetry
 */
class TelemetryController
{

    private const NAMESPACE = 'apex/v1';

    public function register(): void
    {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes(): void
    {
        register_rest_route(self::NAMESPACE , '/telemetry', [
            'methods' => 'POST',
            'callback' => [$this, 'ingest_telemetry'],
            'permission_callback' => '__return_true', // Public endpoint for frontend tracker
        ]);
    }

    /**
     * Proxy telemetry data to the Go Engine
     */
    public function ingest_telemetry(\WP_REST_Request $request): \WP_REST_Response
    {
        $payload = $request->get_json_params();

        // Validate basic payload
        if (empty($payload)) {
            return new \WP_REST_Response(['error' => 'Empty payload'], 400);
        }

        // Assuming Go Engine runs on localhost:8080 (internal network alias 'apex-engine' inside docker, but 'localhost' from host context?)
        // Wait, PHP runs in 'wordpress' container. Go runs in 'apex-engine' container.
        // They are on the same network 'apex-net'.
        // So PHP should talk to 'http://apex-engine:8080'.
        // However, existing code in StatsController.php used 'http://localhost:8080'.
        // If StatsController works, then they might be sharing network namespace or something?
        // Let's check docker-compose again.
        // They are different services. 'apex-engine' exposes 8080.
        // If StatsController uses 'localhost', it might be broken unless it was tested.
        // But for safety, I should use 'apex-engine' hostname if I am inside docker network.
        // I will use 'http://apex-engine:8080' as it is the correct docker service name.
        // Wait, `StatsController.php` line 69: `$go_engine_url = 'http://localhost:8080/v1/ask';`
        // If PHP is in docker, it cannot reach 'localhost:8080' of another container unless using host networking or they are same container.
        // They are separate services. So `StatsController` might be using `localhost` incorrectly or relying on some specific setup.
        // The user said "Secure Engine ... public port mapping ... removed".
        // So it's definitely internal.
        // I will use 'apex-engine' but I will add a fallback or check env var.

        $engine_host = getenv('APEX_ENGINE_HOST') ?: 'apex-engine';
        // fallback to apex-engine as default service name

        $go_engine_url = 'http://' . $engine_host . ':8080/v1/telemetry';

        $response = wp_remote_post($go_engine_url, [
            'body' => json_encode($payload),
            'headers' => ['Content-Type' => 'application/json'],
            'timeout' => 5, // Fast timeout for telemetry
            'blocking' => false, // Non-blocking if possible (wp_remote_post is blocking by default, 'blocking' => false makes it fire and forget)
        ]);

        if (is_wp_error($response)) {
            // Log error but don't fail the request to the user?
            // Actually, maybe we should return success to frontend anyway.
            return new \WP_REST_Response(['status' => 'queued'], 202);
        }

        return new \WP_REST_Response(['status' => 'ok'], 200);
    }
}
