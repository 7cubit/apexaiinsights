<?php

namespace ApexAI;

use Firebase\JWT\JWT;

class RemoteEngine
{
    private string $engine_url = 'http://apex-engine:8080';
    private string $jwt_secret = 'change_me_to_something_secure';
    private bool $fallback_mode = false;

    public function __construct()
    {
        // In a real scenario, we would check a setting or if the Go engine is actually reachable
        $this->fallback_mode = get_option('apex_fallback_mode', false);
    }

    public function check_connectivity(): array
    {
        $token = $this->generate_token();

        if ($this->fallback_mode) {
            return [
                'status' => 'connected',
                'engine' => 'PHP Fallback Engine (Native)',
                'message' => 'Go Engine is disabled or unreachable. Running in restricted mode.',
            ];
        }

        $response = wp_remote_post($this->engine_url . '/handshake', [
            'headers' => [
                'Authorization' => 'Bearer ' . $token,
                'Content-Type' => 'application/json',
            ],
            'body' => json_encode([
                'site_url' => get_site_url(),
                'version' => '0.1.0',
            ]),
        ]);

        if (is_wp_error($response)) {
            return [
                'status' => 'error',
                'message' => $response->get_error_message(),
            ];
        }

        $body = wp_remote_retrieve_body($response);
        return json_decode($body, true) ?: ['status' => 'error', 'message' => 'Invalid response'];
    }

    private function generate_token(): string
    {
        $payload = [
            'iss' => get_site_url(),
            'iat' => time(),
            'exp' => time() + 3600,
            'data' => [
                'user_id' => get_current_user_id(),
            ],
        ];

        return JWT::encode($payload, $this->jwt_secret, 'HS256');
    }
}
