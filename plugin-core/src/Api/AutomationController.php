<?php
namespace ApexAI\Api;

class AutomationController
{
    private $api_root;

    public function __construct()
    {
        // Go Engine URL (Internal Docker Network)
        $this->api_root = 'http://apex-engine:8080/v1';
    }

    public function register_routes()
    {
        // PROXY: Manage Rules (GET, POST, DELETE)
        register_rest_route('apex/v1', '/automation/rules', [
            'methods' => ['GET', 'POST'],
            'callback' => [$this, 'proxy_rules'],
            'permission_callback' => function () {
                return current_user_can('manage_options');
            }
        ]);

        register_rest_route('apex/v1', '/automation/rules/(?P<id>\d+)', [
            'methods' => 'DELETE',
            'callback' => [$this, 'proxy_delete_rule'],
            'permission_callback' => function () {
                return current_user_can('manage_options');
            }
        ]);

        register_rest_route('apex/v1', '/automation/rules/(?P<id>\d+)/test', [
            'methods' => 'POST',
            'callback' => [$this, 'proxy_test_rule'],
            'permission_callback' => function () {
                return current_user_can('manage_options');
            }
        ]);

        // INTERNAL: Send Mail (Called by Go Engine)
        // NOTE: In production, secure this with a secret header/token
        register_rest_route('apex/v1', '/internal/send_mail', [
            'methods' => 'POST',
            'callback' => [$this, 'handle_internal_mail'],
            'permission_callback' => '__return_true', // Publicly accessible but only via internal network ideally
        ]);
    }

    // Proxy CRUD for Rules
    public function proxy_rules($request)
    {
        $method = $request->get_method();
        $url = $this->api_root . '/automation/rules';

        $args = [
            'method' => $method,
            'headers' => ['Content-Type' => 'application/json'],
            'timeout' => 5
        ];

        if ($method === 'POST') {
            $args['body'] = json_encode($request->get_json_params());
        }

        $response = wp_remote_request($url, $args);

        if (is_wp_error($response)) {
            return new \WP_Error('engine_error', $response->get_error_message(), ['status' => 500]);
        }

        return rest_ensure_response(json_decode(wp_remote_retrieve_body($response), true));
    }

    public function proxy_delete_rule($request)
    {
        $id = $request->get_param('id');
        $url = $this->api_root . '/automation/rules/' . $id;

        $response = wp_remote_request($url, [
            'method' => 'DELETE',
            'timeout' => 10
        ]);

        if (is_wp_error($response)) {
            return new \WP_Error('engine_error', $response->get_error_message(), ['status' => 500]);
        }

        return rest_ensure_response(json_decode(wp_remote_retrieve_body($response), true));
    }

    public function proxy_test_rule($request)
    {
        $id = $request->get_param('id');
        $url = $this->api_root . '/automation/rules/' . $id . '/test';

        $response = wp_remote_post($url, [
            'timeout' => 10
        ]);

        if (is_wp_error($response)) {
            return new \WP_Error('engine_error', $response->get_error_message(), ['status' => 500]);
        }

        return rest_ensure_response(json_decode(wp_remote_retrieve_body($response), true));
    }

    // Handle Internal "Send Mail" request from Go Engine
    public function handle_internal_mail($request)
    {
        $params = $request->get_json_params();
        $to = sanitize_email($params['to']);
        $subject = sanitize_text_field($params['subject']);
        $message = wp_kses_post($params['message']);

        if (empty($to) || empty($message)) {
            return new \WP_Error('invalid_payload', 'Missing To or Message', ['status' => 400]);
        }

        $sent = wp_mail($to, $subject, $message, ['Content-Type: text/html; charset=UTF-8']);

        if ($sent) {
            return rest_ensure_response(['status' => 'sent', 'to' => $to]);
        } else {
            return new \WP_Error('mail_failed', 'WP Mail failed to send', ['status' => 500]);
        }
    }
}
