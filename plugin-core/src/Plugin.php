<?php

namespace ApexAI;

use ApexAI\Api\CollectController;
use ApexAI\Api\StatsController;
use ApexAI\Api\TelemetryController;
use ApexAI\Api\SearchController;
use ApexAI\Api\AutomationController;
use ApexAI\Services\DataPruner;
use ApexAI\Services\LicenseManager;
use WP_REST_Request;
use WP_Error;

class Plugin
{
    private static ?Plugin $instance = null;

    public static function getInstance(): Plugin
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct()
    {
        // Private constructor for singleton
    }

    public function register_admin_menu(): void
    {
        add_action('admin_menu', function () {
            $plugin_name = get_option('apex_white_label_name', 'Apex AI Insights');
            $hide_technical = get_option('apex_white_label_hide_technical', false);
            $main_slug = 'apex-ai-insights';

            add_menu_page(
                $plugin_name,
                $plugin_name,
                'manage_options',
                $main_slug,
                [$this, 'render_dashboard'],
                'dashicons-chart-area',
                2
            );

            // Override the first auto-generated submenu to say "Overview"
            add_submenu_page(
                $main_slug,
                $plugin_name,
                'Overview',
                'manage_options',
                $main_slug,
                [$this, 'render_dashboard']
            );

            // Synchronized Submenus (Remaining tabs)
            $tabs = [
                'content' => 'Content',
                'woocommerce' => 'WooCommerce',
                'replay' => 'Replays',
                'forms' => 'Forms',
                'search' => 'Search',
                'seo' => 'SEO',
                'automation' => 'Auto-Pilot',
                'segmentation' => 'Segmentation',
                'social' => 'Social',
                'performance' => 'Performance',
                'security' => 'Security',
                'godmode' => 'GOD MODE',
                'developer' => 'API & DEV',
            ];

            foreach ($tabs as $slug => $label) {
                // Agency Rule: Hide technical tabs for non-admins if White Label is active
                if ($hide_technical && ($slug === 'godmode' || $slug === 'developer')) {
                    if (!current_user_can('administrator')) {
                        continue;
                    }
                }

                add_submenu_page(
                    $main_slug,
                    $label,
                    $label,
                    'manage_options',
                    $main_slug . '-' . $slug,
                    [$this, 'render_dashboard']
                );
            }

            // Settings & Status
            add_submenu_page($main_slug, 'Settings', 'Settings', 'manage_options', 'apex-ai-settings', [$this, 'render_settings_page']);
            add_submenu_page($main_slug, 'System Status', 'Status', 'manage_options', 'apex-ai-status', [$this, 'render_status_page']);
        });
    }

    private function register_settings(): void
    {
        add_action('admin_init', function () {
            // White Label Settings
            register_setting('apex_ai_insights_options', 'apex_white_label_name');
            register_setting('apex_white_label_hide_technical', 'apex_white_label_hide_technical');

            // GDPR Settings
            register_setting('apex_ai_insights_options', 'apex_gdpr_mode');

            add_settings_section('apex_white_label_section', 'White Label (Agency Mode)', null, 'apex-ai-settings');

            add_settings_field('apex_white_label_name', 'Plugin Display Name', function () {
                $val = get_option('apex_white_label_name', 'Apex AI Insights');
                echo "<input type='text' name='apex_white_label_name' value='" . esc_attr($val) . "' class='regular-text' placeholder='e.g. Studio Analytics' />";
            }, 'apex-ai-settings', 'apex_white_label_section');

            add_settings_field('apex_white_label_hide_technical', 'Hide Technical Tabs', function () {
                $val = get_option('apex_white_label_hide_technical');
                echo "<label><input type='checkbox' name='apex_white_label_hide_technical' value='1' " . checked(1, $val, false) . " /> Hide 'GOD MODE' and 'API & DEV' for non-admins</label>";
            }, 'apex-ai-settings', 'apex_white_label_section');

            add_settings_section('apex_gdpr_section', 'Privacy & Compliance', null, 'apex-ai-settings');

            add_settings_field('apex_gdpr_mode', 'Enable GDPR "Ghost Mode"', function () {
                $val = get_option('apex_gdpr_mode');
                echo "<label><input type='checkbox' name='apex_gdpr_mode' value='1' " . checked(1, $val, false) . " /> Anonymize all incoming visitor data (IP Hashing)</label>";
            }, 'apex-ai-settings', 'apex_gdpr_section');
        });
    }

    public function init(): void
    {
        $this->register_admin_menu();
        $this->register_settings();
        $this->register_ajax_handlers();
        $this->register_rest_api();
        $this->register_integrations();

        // Phase 21.1: Google Analytics OAuth
        (new \ApexAI\Api\OAuthController())->register();

        // Phase 18: Testing & Plugin Health
        (new \ApexAI\Services\ConflictDetector())->init();

        // Phase 9: Frontend Tracker
        add_action('wp_enqueue_scripts', [$this, 'enqueue_frontend_scripts']);

        // Phase 17: Developer API & Extensibility
        (new \ApexAI\Developer\Blocks())->init();
        (new \ApexAI\Developer\Shortcodes())->init();
        if (defined('WP_CLI') && WP_CLI) {
            (new \ApexAI\Developer\Cli())->init();
        }

        // Enqueue Assets
        add_action('admin_enqueue_scripts', [$this, 'enqueue_dashboard_assets']);

        // Phase 20: Fullscreen UI & CSS Adjustments
        add_action('admin_head', [$this, 'inject_admin_styles']);

        // Fix for Vite ESM modules
        add_filter('script_loader_tag', [$this, 'add_module_type'], 10, 3);
    }

    public function add_module_type($tag, $handle, $src)
    {
        if ('apex-dashboard' !== $handle) {
            return $tag;
        }
        return '<script type="module" src="' . esc_url($src) . '" id="' . esc_attr($handle) . '-js"></script>';
    }

    public function inject_admin_styles(): void
    {
        $screen = get_current_screen();
        if (!$screen || strpos($screen->id, 'apex-ai') === false) {
            return;
        }

        ?>
        <style>
            /* Instant dark background to prevent white flash - High Priority */
            html,
            body,
            #wpwrap,
            #wpcontent,
            #wpbody,
            #wpbody-content,
            .wrap {
                background: #0a0a0a !important;
                color: #fff !important;
            }

            #wpcontent {
                padding-left: 0 !important;
            }

            #wpbody-content {
                padding-bottom: 0 !important;
            }

            .wrap {
                margin: 0 !important;
                background: #0a0a0a !important;
            }

            #wpfooter {
                display: none !important;
            }

            #wpadminbar {
                z-index: 99999 !important;
            }

            /* Hide WP notices on our dashboard */
            .notice,
            .updated,
            .error,
            .is-dismissible {
                display: none !important;
            }

            /* Full height adjustments */
            #wpbody-content>.wrap {
                height: calc(100vh - 32px);
            }

            @media screen and (max-width: 782px) {
                #wpbody-content>.wrap {
                    height: calc(100vh - 46px);
                }
            }

            /* Loader Styling */
            #apex-dashboard-root .apex-loader {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 80vh;
                gap: 20px;
                color: #fff;
            }

            #apex-dashboard-root .apex-loader-spinner {
                width: 54px;
                height: 54px;
                border: 4px solid rgba(255, 255, 255, 0.05);
                border-top-color: #10b981;
                /* Emerald-500 */
                border-radius: 50%;
                animation: apex-spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
            }

            @keyframes apex-spin {
                to {
                    transform: rotate(360deg);
                }
            }

            #apex-dashboard-root .apex-loader-text {
                color: #64748b;
                font-size: 15px;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                font-weight: 500;
                letter-spacing: -0.01em;
            }
        </style>
        <?php
    }

    private function register_ajax_handlers(): void
    {
        add_action('wp_ajax_apex_check_connectivity', [$this, 'handle_check_connectivity']);
        add_action('wp_ajax_apex_check_health', [$this, 'handle_check_health']);

        add_action('rest_api_init', function () {
            (new SearchController())->register_routes();
            (new AutomationController())->register_routes();
        });
    }

    public function handle_check_connectivity(): void
    {
        error_log('Apex AI: Checking connectivity AJAX called.');
        check_ajax_referer('apex-ai-insights', 'nonce');

        $endpoints = [
            'http://apex-engine:8080/debug/health',
            'http://host.docker.internal:8080/debug/health',
            'http://localhost:8080/debug/health',
            'http://127.0.0.1:8080/debug/health'
        ];

        $last_error = 'All endpoints failed';
        $success_data = null;

        foreach ($endpoints as $url) {
            $response = wp_remote_get($url, ['timeout' => 2]);

            if (is_wp_error($response)) {
                $last_error = "URL $url: " . $response->get_error_message();
                continue;
            }

            $code = wp_remote_retrieve_response_code($response);
            if ($code !== 200) {
                $last_error = "URL $url: HTTP $code";
                continue;
            }

            $body = wp_remote_retrieve_body($response);
            $data = json_decode($body, true);

            if (isset($data['status']) && $data['status'] === 'healthy') {
                $success_data = [
                    'status' => 'connected',
                    'engine' => 'Go/Fiber v' . ($data['version'] ?? '1.0.0') . ' via ' . parse_url($url, PHP_URL_HOST)
                ];
                break;
            } else {
                $last_error = "URL $url: Unexpected JSON structure";
            }
        }

        if ($success_data) {
            wp_send_json($success_data);
        } else {
            wp_send_json([
                'status' => 'error',
                'message' => $last_error
            ]);
        }
    }

    /**
     * Handle comprehensive health check AJAX request
     * Calls the Go engine's /debug/health endpoint for MySQL, Redis, and system status
     */
    public function handle_check_health(): void
    {
        check_ajax_referer('apex-ai-insights', 'nonce');

        $endpoints = [
            'http://apex-engine:8080/debug/health',
            'http://host.docker.internal:8080/debug/health',
            'http://localhost:8080/debug/health',
            'http://127.0.0.1:8080/debug/health'
        ];

        $last_error = 'All endpoints failed';
        $health_data = null;

        foreach ($endpoints as $url) {
            $response = wp_remote_get($url, ['timeout' => 5]);

            if (is_wp_error($response)) {
                $last_error = $response->get_error_message();
                continue;
            }

            $code = wp_remote_retrieve_response_code($response);
            if ($code !== 200 && $code !== 503) { // 503 = unhealthy but still responding
                $last_error = "HTTP $code";
                continue;
            }

            $body = wp_remote_retrieve_body($response);
            $data = json_decode($body, true);

            if (isset($data['status'])) {
                $health_data = $data;
                break;
            }
        }

        if ($health_data) {
            wp_send_json_success($health_data);
        } else {
            wp_send_json_error(['message' => 'Engine not reachable: ' . $last_error]);
        }
    }

    public function register_integrations()
    {
        // WooCommerce Integration - only register if WooCommerce is active
        if (class_exists('WooCommerce')) {
            // Trigger: Cart Abandonment / Activity
            // Send event to GO when item added to cart
            add_action('woocommerce_add_to_cart', function ($cart_item_key, $product_id, $quantity, $variation_id, $variation, $cart_item_data) {
                $payload = [
                    'type' => 'cart_activity',
                    'payload' => [
                        'product_id' => $product_id,
                        'quantity' => $quantity,
                        'user_id' => get_current_user_id()
                    ]
                ];

                // Async Post to Go
                $url = 'http://apex-engine:8080/v1/automation/event';
                wp_remote_post($url, [
                    'blocking' => false, // Async
                    'headers' => ['Content-Type' => 'application/json'],
                    'body' => json_encode($payload)
                ]);
            }, 10, 6);
        }
    }

    private function register_rest_api(): void
    {
        // Initialize API Routes
        $collect_controller = new Api\CollectController();
        $collect_controller->register();

        $stats_controller = new Api\StatsController();
        $stats_controller->register();

        $telemetry_controller = new TelemetryController();
        $telemetry_controller->register();

        $data_pruner = new Services\DataPruner();
        $data_pruner->register();

        $license_manager = new Services\LicenseManager();
        $license_manager->register();

        // Phase 8.5: Data Tunnel
        add_action('rest_api_init', function () {
            register_rest_route('apex/v1', '/tunnel', [
                'methods' => 'GET',
                'callback' => [$this, 'proxy_request'],
                'permission_callback' => function () {
                    return current_user_can('manage_options');
                },
            ]);

            // Phase 9: Telemetry Endpoint
            register_rest_route('apex/v1', '/telemetry', [
                'methods' => 'POST',
                'callback' => [$this, 'handle_telemetry'],
                'permission_callback' => '__return_true', // Public endpoint for frontend tracking
            ]);
        });
    }

    public function handle_telemetry(\WP_REST_Request $request)
    {
        $data = $request->get_json_params();

        // In a real scenario, push to Go Engine or Redis
        // For now, log to debug.log to verify reception
        error_log('Apex Telemetry: ' . print_r($data, true));

        // Optional: Return AI Optimization advice stub
        return rest_ensure_response([
            'status' => 'received',
            'ai_advice' => 'No optimizations yet.'
        ]);
    }

    public function proxy_request(\WP_REST_Request $request)
    {
        $path = $request->get_param('path');
        $response = Services\EngineClient::proxy_get($path, ['timeout' => 15]);

        if (is_wp_error($response)) {
            return new \WP_Error('apex_engine_error', 'Could not connect to Apex Engine: ' . $response->get_error_message(), ['status' => 500]);
        }

        $body = wp_remote_retrieve_body($response);
        return rest_ensure_response(json_decode($body));
    }

    // ... (rest of class)

    public function enqueue_dashboard_assets(): void
    {
        $screen = get_current_screen();
        if (strpos($screen->id, 'apex-ai-insights') === false) {
            return;
        }

        // Phase 8.5: Enqueue Built Assets from dist/
        wp_enqueue_script(
            'apex-dashboard',
            plugins_url('assets/dist/bundle.js', dirname(__DIR__) . '/apex-ai-insights.php'),
            [],
            APEX_AI_VERSION,
            ['in_footer' => true, 'strategy' => 'defer']
        );

        wp_enqueue_style(
            'apex-dashboard-css',
            plugins_url('assets/dist/style.css', dirname(__DIR__) . '/apex-ai-insights.php'),
            [],
            '1.0.0'
        );

        wp_localize_script('apex-dashboard', 'apexConfig', [
            'api_root' => rest_url(), // Standard WP REST Root
            'tunnel_url' => rest_url('apex/v1/tunnel'), // The Proxy
            'nonce' => wp_create_nonce('wp_rest'),
            'plan' => get_option('apex_plan', 'plus'), // Entry default to plus
            'wooActive' => class_exists('WooCommerce'), // WooCommerce availability flag
            'license' => [
                'status' => $this->get_license_status_for_config(),
                'key' => get_option('apex_license_key', ''),
            ],
            'white_label' => [
                'name' => get_option('apex_white_label_name', 'Apex AI Insights'),
                'hide_technical' => get_option('apex_white_label_hide_technical', false) && !current_user_can('administrator'),
            ],
            'gdpr' => [
                'mode' => get_option('apex_gdpr_mode', false),
            ],
            // Pre-fetched cached stats for instant UI rendering
            'initialKPI' => get_transient('apex_api_cache_' . md5('/v1/stats/kpi?range=7d')),
            'initialLive' => [
                'active_users' => (int) $this->get_live_session_count()
            ]
        ]);
    }

    /**
     * Helper to get active session count for pre-fetching
     */
    private function get_live_session_count(): int
    {
        global $wpdb;
        $table = $wpdb->prefix . 'apex_sessions';
        if ($wpdb->get_var("SHOW TABLES LIKE '$table'") !== $table)
            return 0;

        return (int) $wpdb->get_var("
            SELECT COUNT(*) 
            FROM $table 
            WHERE last_activity > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
        ");
    }

    public function render_dashboard(): void
    {
        // Phase 8.5: React Container with immediate dark background to prevent flash
        ?>
        <style>
            #apex-dashboard-root {
                background: #0a0a0a;
                min-height: 100vh;
                margin-left: -20px;
                margin-right: -20px;
                padding: 20px;
            }

            #apex-dashboard-root .apex-loader {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 60vh;
                gap: 16px;
            }

            #apex-dashboard-root .apex-loader-spinner {
                width: 48px;
                height: 48px;
                border: 3px solid rgba(255, 255, 255, 0.1);
                border-top-color: #a855f7;
                border-radius: 50%;
                animation: apex-spin 1s linear infinite;
            }

            @keyframes apex-spin {
                to {
                    transform: rotate(360deg);
                }
            }

            #apex-dashboard-root .apex-loader-text {
                color: #6b7280;
                font-size: 14px;
            }
        </style>
        <div id="apex-dashboard-root" class="wrap">
            <div class="apex-loader">
                <div class="apex-loader-spinner"></div>
                <span class="apex-loader-text">Loading Intelligence Engine...</span>
            </div>
        </div>
        <script>
            (function () {
                // Instant navigation: Intercept WP Submenu Clicks
                document.addEventListener('click', function (e) {
                    var link = e.target.closest('a[href*="page=apex-ai-insights"]');
                    if (!link) return;

                    var href = link.getAttribute('href');
                    // Extract tab from URL (e.g., apex-ai-insights-content -> content)
                    var match = href.match(/page=apex-ai-insights(?:-([a-z]+))?/);
                    if (match) {
                        e.preventDefault();
                        var tab = match[1] || 'overview';
                        window.location.hash = tab;
                        // Dispatch event for React to pick up
                        window.dispatchEvent(new HashChangeEvent('hashchange'));
                        // Update WP admin menu active state
                        document.querySelectorAll('#adminmenu .wp-submenu a').forEach(function (a) {
                            a.parentElement.classList.remove('current');
                        });
                        link.parentElement.classList.add('current');
                    }
                });
            })();
        </script>
        <?php
    }

    public function render_settings_page(): void
    {
        ?>
        <div class="wrap" style="padding: 20px 30px;">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            <form action="options.php" method="post">
                <?php
                settings_fields('apex_ai_insights_options');
                do_settings_sections('apex-ai-settings');
                // Also render Woo settings here if possible or ensure they target this page
                // We need to fix WooCommerce.php to target 'apex-ai-settings' instead of 'apex-ai-insights'
                // or we render both here if we can.
                // For now, let's assume we render everything attached to 'apex-ai-settings'
        
                submit_button();
                ?>
            </form>
        </div>
        <?php
    }

    public function render_status_page(): void
    {
        include __DIR__ . '/Admin/views/status-page.php';
    }
    private function get_license_status_for_config(): string
    {
        $key = get_option('apex_license_key');
        if (empty($key))
            return 'inactive';

        // Simulation logic for grace periods (Phase 28)
        $activation_date = get_option('apex_activation_date', time());
        $days_elapsed = floor((time() - $activation_date) / DAY_IN_SECONDS);

        if ($days_elapsed > 30)
            return 'expired';
        if ($days_elapsed > 25)
            return 'grace_period';

        return 'active';
    }

    public function enqueue_frontend_scripts(): void
    {
        // Phase 2: Apex Tracker (Ad-Block Proof)
        wp_enqueue_script(
            'apex-tracker',
            plugins_url('assets/js/apex.js', dirname(__DIR__) . '/apex-ai-insights.php'),
            [],
            '1.0.0',
            true
        );

        // Enqueue Forms Tracking
        wp_enqueue_script(
            'apex-forms-js',
            plugin_dir_url(dirname(__DIR__)) . 'assets/js/apex-forms.js',
            [],
            '1.0.0',
            true
        );

        wp_localize_script('apex-forms-js', 'apexFormsConfig', [
            'api_root' => get_rest_url(null, 'apex/v1'),
            'nonce' => wp_create_nonce('wp_rest')
        ]);

        // Phase 12: Download Tracker
        wp_enqueue_script(
            'apex-downloads',
            plugin_dir_url(dirname(__DIR__)) . 'assets/js/apex-downloads.js',
            [],
            '1.0.0',
            true
        );

        // Enqueue Search & SEO Scripts
        wp_enqueue_script(
            'apex-search-js',
            plugin_dir_url(dirname(__DIR__)) . 'assets/js/apex-search.js',
            [],
            '1.0.0',
            true
        );

        wp_localize_script('apex-search-js', 'apexSearchConfig', [
            'api_root' => get_rest_url(null, 'apex/v1'),
            'nonce' => wp_create_nonce('wp_rest')
        ]);
    }
}
