<?php

namespace ApexAI\Services;

class EngineClient
{
    private static ?string $discovered_url = null;

    public static function get_engine_url(): string
    {
        if (self::$discovered_url !== null) {
            return self::$discovered_url;
        }

        // Try cached transient first
        $cached = get_transient('apex_engine_url');
        if ($cached) {
            self::$discovered_url = $cached;
            return $cached;
        }

        $endpoints = [
            'http://apex-engine:8080',
            'http://host.docker.internal:8080',
            'http://localhost:8080',
            'http://127.0.0.1:8080'
        ];

        foreach ($endpoints as $url) {
            $response = wp_remote_get("$url/health", ['timeout' => 1]);
            if (!is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200) {
                set_transient('apex_engine_url', $url, HOUR_IN_SECONDS);
                self::$discovered_url = $url;
                return $url;
            }
        }

        return 'http://apex-engine:8080'; // Final fallback
    }

    public static function proxy_get(string $path, array $args = [])
    {
        $url = self::get_engine_url() . $path;
        $args['headers'] = array_merge($args['headers'] ?? [], [
            'X-Apex-GDPR' => get_option('apex_gdpr_mode') ? 'true' : 'false'
        ]);
        return wp_remote_get($url, $args);
    }

    public static function proxy_post(string $path, array $args = [])
    {
        $url = self::get_engine_url() . $path;
        $args['headers'] = array_merge($args['headers'] ?? [], [
            'X-Apex-GDPR' => get_option('apex_gdpr_mode') ? 'true' : 'false'
        ]);
        return wp_remote_post($url, $args);
    }
}
