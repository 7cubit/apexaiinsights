<?php

namespace ApexAI\Services;

class LicenseManager
{
    public function register(): void
    {
        add_action('admin_init', [$this, 'register_settings']);
        add_action('rest_api_init', [$this, 'register_rest_routes']);
    }

    public function register_settings(): void
    {
        register_setting('apex_ai_insights_options', 'apex_license_key', [$this, 'validate_license']);
        register_setting('apex_ai_insights_options', 'apex_license_jwt');
        register_setting('apex_ai_insights_options', 'apex_plan');

        add_settings_section(
            'apex_license_section',
            'License & Activation',
            null,
            'apex-ai-settings'
        );

        add_settings_field(
            'apex_license_key',
            'License Key',
            [$this, 'render_license_field'],
            'apex-ai-settings',
            'apex_license_section'
        );
    }

    public function register_rest_routes(): void
    {
        register_rest_route('apex/v1', '/license/activate', [
            'methods' => 'POST',
            'callback' => [$this, 'handle_activate'],
            'permission_callback' => function () {
                return current_user_can('manage_options');
            },
        ]);

        register_rest_route('apex/v1', '/license/status', [
            'methods' => 'GET',
            'callback' => [$this, 'handle_status'],
            'permission_callback' => function () {
                return current_user_can('manage_options');
            },
        ]);
    }

    public function handle_activate(\WP_REST_Request $request)
    {
        $key = sanitize_text_field($request->get_param('license_key'));

        if (empty($key)) {
            return new \WP_Error('missing_key', 'License key is required', ['status' => 400]);
        }

        // Simulate licensing server validation
        // Pattern: APEX_{PLAN}_sk_{ID}
        $plan = 'plus';
        if (strpos($key, 'APEX_PRO') !== false) {
            $plan = 'pro';
        } elseif (strpos($key, 'APEX_ELITE') !== false || strpos($key, 'APEX_LTD') !== false) {
            $plan = 'elite';
        }

        $jwt = base64_encode(json_encode([
            'key' => $key,
            'plan' => $plan,
            'exp' => time() + (30 * DAY_IN_SECONDS),
            'iat' => time()
        ]));

        update_option('apex_license_key', $key);
        update_option('apex_license_jwt', $jwt);
        update_option('apex_plan', $plan);

        return rest_ensure_response([
            'success' => true,
            'plan' => $plan,
            'jwt' => $jwt,
            'message' => 'License activated successfully'
        ]);
    }

    public function handle_status()
    {
        $plan = get_option('apex_plan', 'plus');
        $key = get_option('apex_license_key');
        $jwt = get_option('apex_license_jwt');

        return rest_ensure_response([
            'plan' => $plan,
            'active' => !empty($key),
            'status' => $this->get_license_status_text(),
        ]);
    }

    private function get_license_status_text(): string
    {
        $key = get_option('apex_license_key');
        if (empty($key))
            return 'inactive';

        // Simulation logic for grace periods
        $activation_date = get_option('apex_activation_date', time());
        $days_elapsed = floor((time() - $activation_date) / DAY_IN_SECONDS);

        if ($days_elapsed > 30)
            return 'expired';
        if ($days_elapsed > 25)
            return 'grace_period';

        return 'active';
    }

    public function render_license_field(): void
    {
        $key = get_option('apex_license_key');
        $val_attr = $key ? esc_attr($key) : '';

        echo "<div style='display:flex; gap:10px; align-items:center;'>";
        echo "<input type='text' name='apex_license_key' value='" . $val_attr . "' class='regular-text' placeholder='APEX_PRO_sk_12345' />";
        if ($key) {
            echo "<span style='color:green; font-weight:bold;'>✓ " . ucfirst($this->get_license_status_text()) . "</span>";
        }
        echo "</div>";
        echo "<p class='description'>Enter your license key to enable Pro features.</p>";
    }

    public function validate_license($input)
    {
        if ($input && strpos($input, 'APEX_') !== 0) {
            add_settings_error('apex_license_key', 'invalid_key', 'Invalid License Key format.');
            return get_option('apex_license_key');
        }
        return sanitize_text_field($input);
    }
}
