<?php

namespace ApexAI\Api;

/**
 * OAuthController - Thin-Client Google Analytics OAuth Bridge
 * 
 * Handles Google OAuth 2.0 flow using native wp_remote_post (no heavy SDK).
 * Tokens are encrypted and handed off to the Go Engine for secure storage.
 */
class OAuthController
{
    private const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
    private const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
    private const SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';
    private const ENGINE_URL = 'http://apex-engine:8080/v1/integrations/ga4';

    private string $clientId;
    private string $clientSecret;
    private string $encryptionKey;

    public function __construct()
    {
        $this->clientId = $this->getSecret('GOOGLE_CLIENT_ID', 'apex_google_client_id');
        $this->clientSecret = $this->getSecret('GOOGLE_CLIENT_SECRET', 'apex_google_client_secret');
        $this->encryptionKey = $this->getSecret('APEX_OAUTH_SECRET', 'apex_oauth_secret', 'apex-default-key-change-me!!');
    }

    /**
     * Helper to get secret from Constant, Env, or Option
     */
    private function getSecret(string $key, string $option, string $default = ''): string
    {
        if (defined($key))
            return constant($key);
        if (getenv($key))
            return getenv($key);
        return get_option($option, $default);
    }

    /**
     * Register REST API routes
     */
    public function register(): void
    {
        add_action('rest_api_init', function () {
            // Initiate OAuth flow
            register_rest_route('apex/v1', '/auth/google', [
                'methods' => 'GET',
                'callback' => [$this, 'initiateOAuth'],
                'permission_callback' => function () {
                    return current_user_can('manage_options');
                },
            ]);

            // OAuth callback from Google
            register_rest_route('apex/v1', '/auth/google/callback', [
                'methods' => 'GET',
                'callback' => [$this, 'handleCallback'],
                'permission_callback' => '__return_true', // Google redirects here
            ]);

            // Check connection status
            register_rest_route('apex/v1', '/auth/google/status', [
                'methods' => 'GET',
                'callback' => [$this, 'getStatus'],
                'permission_callback' => function () {
                    return current_user_can('manage_options');
                },
            ]);

            // Disconnect
            register_rest_route('apex/v1', '/auth/google/disconnect', [
                'methods' => 'POST',
                'callback' => [$this, 'disconnect'],
                'permission_callback' => function () {
                    return current_user_can('manage_options');
                },
            ]);
        });
    }

    /**
     * Initiate OAuth - Redirect to Google consent screen
     */
    public function initiateOAuth(\WP_REST_Request $request): \WP_REST_Response
    {
        if (empty($this->clientId)) {
            return new \WP_REST_Response([
                'error' => 'Google Client ID not configured',
                'setup_required' => true
            ], 400);
        }

        // Generate state token for CSRF protection
        $state = wp_generate_password(32, false);
        set_transient('apex_oauth_state_' . $state, true, 600); // 10 min expiry

        $redirectUri = rest_url('apex/v1/auth/google/callback');

        $authUrl = self::GOOGLE_AUTH_URL . '?' . http_build_query([
            'client_id' => $this->clientId,
            'redirect_uri' => $redirectUri,
            'response_type' => 'code',
            'scope' => self::SCOPE,
            'access_type' => 'offline', // Request refresh_token
            'prompt' => 'consent', // Force consent to get refresh_token
            'state' => $state,
        ]);

        // Return redirect URL for frontend to handle
        return new \WP_REST_Response([
            'redirect_url' => $authUrl
        ], 200);
    }

    /**
     * Handle OAuth callback from Google
     */
    public function handleCallback(\WP_REST_Request $request): void
    {
        $code = $request->get_param('code');
        $state = $request->get_param('state');
        $error = $request->get_param('error');

        // Handle errors from Google
        if ($error) {
            $this->redirectWithError('Google denied access: ' . $error);
            return;
        }

        // Validate state (CSRF protection)
        if (!$state || !get_transient('apex_oauth_state_' . $state)) {
            $this->redirectWithError('Invalid state token. Please try again.');
            return;
        }
        delete_transient('apex_oauth_state_' . $state);

        // Validate authorization code
        if (!$code) {
            $this->redirectWithError('No authorization code received.');
            return;
        }

        // Exchange code for tokens
        $tokens = $this->exchangeCodeForTokens($code);

        if (is_wp_error($tokens)) {
            $this->redirectWithError($tokens->get_error_message());
            return;
        }

        // Encrypt and hand off to Go Engine
        $handoffResult = $this->handoffToEngine($tokens);

        if (is_wp_error($handoffResult)) {
            $this->redirectWithError('Failed to store token: ' . $handoffResult->get_error_message());
            return;
        }

        // Success - redirect to settings page
        $this->redirectWithSuccess();
    }

    /**
     * Exchange authorization code for tokens using wp_remote_post
     */
    private function exchangeCodeForTokens(string $code): array|\WP_Error
    {
        $redirectUri = rest_url('apex/v1/auth/google/callback');

        $response = wp_remote_post(self::GOOGLE_TOKEN_URL, [
            'timeout' => 30,
            'headers' => [
                'Content-Type' => 'application/x-www-form-urlencoded',
            ],
            'body' => [
                'client_id' => $this->clientId,
                'client_secret' => $this->clientSecret,
                'code' => $code,
                'grant_type' => 'authorization_code',
                'redirect_uri' => $redirectUri,
            ],
        ]);

        if (is_wp_error($response)) {
            error_log('Apex OAuth: Token exchange failed - ' . $response->get_error_message());
            return new \WP_Error('token_exchange_failed', $response->get_error_message());
        }

        $statusCode = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if ($statusCode !== 200) {
            $errorMsg = $data['error_description'] ?? $data['error'] ?? 'Unknown error';
            error_log('Apex OAuth: Google returned error - ' . $errorMsg);
            return new \WP_Error('google_error', $errorMsg);
        }

        if (empty($data['refresh_token'])) {
            error_log('Apex OAuth: No refresh_token received');
            return new \WP_Error('no_refresh_token', 'No refresh token received. Try revoking access at myaccount.google.com and retry.');
        }

        return [
            'access_token' => $data['access_token'],
            'refresh_token' => $data['refresh_token'],
            'expires_in' => $data['expires_in'] ?? 3600,
            'scope' => $data['scope'] ?? self::SCOPE,
        ];
    }

    /**
     * Encrypt refresh_token and hand off to Go Engine
     */
    private function handoffToEngine(array $tokens): true|\WP_Error
    {
        // Encrypt the refresh token
        $encryptedToken = $this->encryptToken($tokens['refresh_token']);

        if ($encryptedToken === false) {
            return new \WP_Error('encryption_failed', 'Failed to encrypt token');
        }

        // Send to Go Engine via internal Docker network
        $payload = [
            'encrypted_token' => $encryptedToken,
            'access_token' => $tokens['access_token'],
            'expires_in' => $tokens['expires_in'],
            'scope' => $tokens['scope'],
            'connected_at' => time(),
            'connected_by' => get_current_user_id(),
        ];

        $response = wp_remote_post(self::ENGINE_URL, [
            'timeout' => 10,
            'headers' => [
                'Content-Type' => 'application/json',
                'X-Apex-Internal' => 'true',
            ],
            'body' => wp_json_encode($payload),
        ]);

        if (is_wp_error($response)) {
            error_log('Apex OAuth: Engine handoff failed - ' . $response->get_error_message());
            return new \WP_Error('engine_handoff_failed', $response->get_error_message());
        }

        $statusCode = wp_remote_retrieve_response_code($response);
        if ($statusCode !== 200) {
            $body = wp_remote_retrieve_body($response);
            error_log('Apex OAuth: Engine rejected token - ' . $body);
            return new \WP_Error('engine_rejected', 'Go Engine rejected the token');
        }

        // Mark as connected in WP (just status, no tokens!)
        update_option('apex_ga4_connected', true);
        update_option('apex_ga4_connected_at', time());

        return true;
    }

    /**
     * Encrypt token using AES-256-GCM
     */
    private function encryptToken(string $token): string|false
    {
        $key = hash('sha256', $this->encryptionKey, true);
        $iv = random_bytes(16);
        $tag = '';

        $encrypted = openssl_encrypt(
            $token,
            'aes-256-gcm',
            $key,
            OPENSSL_RAW_DATA,
            $iv,
            $tag,
            '',
            16
        );

        if ($encrypted === false) {
            return false;
        }

        // Combine IV + tag + ciphertext, base64 encode
        return base64_encode($iv . $tag . $encrypted);
    }

    /**
     * Get connection status from Go Engine
     */
    public function getStatus(\WP_REST_Request $request): \WP_REST_Response
    {
        $response = wp_remote_get(self::ENGINE_URL . '/status', [
            'timeout' => 5,
            'headers' => ['X-Apex-Internal' => 'true'],
        ]);

        if (is_wp_error($response)) {
            return new \WP_REST_Response([
                'connected' => false,
                'error' => $response->get_error_message()
            ], 200);
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        return new \WP_REST_Response($data, 200);
    }

    /**
     * Disconnect Google Analytics
     */
    public function disconnect(\WP_REST_Request $request): \WP_REST_Response
    {
        // Tell Go Engine to delete the token
        $response = wp_remote_request(self::ENGINE_URL, [
            'method' => 'DELETE',
            'timeout' => 5,
            'headers' => ['X-Apex-Internal' => 'true'],
        ]);

        // Clear WP status
        delete_option('apex_ga4_connected');
        delete_option('apex_ga4_connected_at');

        return new \WP_REST_Response([
            'disconnected' => true
        ], 200);
    }

    /**
     * Redirect to settings with error message
     */
    private function redirectWithError(string $message): void
    {
        $url = admin_url('admin.php?page=apex-ai-settings&ga_error=' . urlencode($message));
        wp_redirect($url);
        exit;
    }

    /**
     * Redirect to settings with success
     */
    private function redirectWithSuccess(): void
    {
        $url = admin_url('admin.php?page=apex-ai-settings&ga_connected=1');
        wp_redirect($url);
        exit;
    }
}
