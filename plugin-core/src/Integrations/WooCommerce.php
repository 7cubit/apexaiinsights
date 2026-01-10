<?php

namespace ApexAI\Integrations;

class WooCommerce
{
    private const API_URL = 'http://localhost:8080/collect'; // Internal Go Engine URL

    /**
     * Check if WooCommerce is active and available
     */
    public static function is_active(): bool
    {
        return class_exists('WooCommerce') && function_exists('WC');
    }

    public function register(): void
    {
        // Strict WooCommerce availability check - prevents fatal errors if WooCommerce is not installed/active
        if (!self::is_active()) {
            return;
        }

        // Add COGS field to General tab
        add_action('woocommerce_product_options_pricing', [$this, 'add_cogs_field']);
        add_action('woocommerce_process_product_meta', [$this, 'save_cogs_field']);

        // Order Complete Hook
        add_action('woocommerce_order_status_completed', [$this, 'send_order_to_engine'], 10, 1);

        // Whale Alert Hook (Added to Cart)
        add_action('woocommerce_add_to_cart', [$this, 'check_whale_cart'], 10, 6);

        // Register Settings (always register so settings page doesn't error)
        add_action('admin_init', [$this, 'register_settings']);
    }

    public function register_settings(): void
    {
        register_setting('apex_ai_insights_options', 'apex_whale_threshold');
        register_setting('apex_ai_insights_options', 'apex_stripe_key');
        register_setting('apex_ai_insights_options', 'apex_paypal_client_id');

        // Target 'apex-ai-settings' page
        add_settings_section('apex_woo_settings', 'Profit & Prediction Settings', null, 'apex-ai-settings');

        add_settings_field('apex_whale_threshold', 'Whale Alert Threshold ($)', function () {
            $val = get_option('apex_whale_threshold', 500);
            echo "<input type='number' name='apex_whale_threshold' value='" . esc_attr($val) . "' class='regular-text' />";
        }, 'apex-ai-settings', 'apex_woo_settings');

        add_settings_field('apex_stripe_key', 'Stripe Secret Key (Optional)', function () {
            $val = get_option('apex_stripe_key');
            echo "<input type='password' name='apex_stripe_key' value='" . esc_attr($val) . "' class='regular-text' />";
        }, 'apex-ai-settings', 'apex_woo_settings');
    }

    /**
     * Add "Cost of Goods" field to Product Data > General
     */
    public function add_cogs_field(): void
    {
        woocommerce_wp_text_input([
            'id' => '_apex_cogs',
            'label' => __('Cost of Goods ($)', 'apex-ai-insights'),
            'description' => __('Used to calculate True Net Profit (Revenue - COGS - Fees).', 'apex-ai-insights'),
            'desc_tip' => true,
            'type' => 'number',
            'custom_attributes' => ['step' => '0.01', 'min' => '0']
        ]);
    }

    /**
     * Save COGS field
     */
    public function save_cogs_field($post_id): void
    {
        $cogs = isset($_POST['_apex_cogs']) ? sanitize_text_field($_POST['_apex_cogs']) : '';
        update_post_meta($post_id, '_apex_cogs', $cogs);
    }

    /**
     * Send completed order data to Go Engine
     */
    public function send_order_to_engine($order_id): void
    {
        $order = wc_get_order($order_id);
        if (!$order)
            return;

        $items = [];
        $total_cogs = 0.0;

        foreach ($order->get_items() as $item) {
            $product = $item->get_product();
            $cogs = (float) $product->get_meta('_apex_cogs');
            if ($cogs <= 0) {
                // Estimate COGS as 60% of price if not set (fallback)
                $cogs = (float) $product->get_price() * 0.6;
            }

            $quantity = $item->get_quantity();
            $line_cogs = $cogs * $quantity;
            $total_cogs += $line_cogs;

            $items[] = [
                'name' => $item->get_name(),
                'sku' => $product->get_sku(),
                'qty' => $quantity,
                'price' => $product->get_price(),
                'cogs' => $cogs,
                'category' => strip_tags(wc_get_product_category_list($product->get_id()))
            ];
        }

        // Calculate Fees (Estimation: 2.9% + $0.30)
        $revenue = (float) $order->get_total();
        $fees = ($revenue * 0.029) + 0.30;
        $net_profit = $revenue - $total_cogs - $fees;

        $payload = [
            't' => 'order_completed',
            'sid' => 'system_woo_webhook', // Internal system session
            'ip' => $order->get_customer_ip_address(),
            'ua' => $order->get_customer_user_agent(),
            'url' => 'woocommerce://order/' . $order_id,
            'd' => [
                'order_id' => $order_id,
                'currency' => $order->get_currency(),
                'revenue' => $revenue,
                'cogs' => $total_cogs,
                'fees_est' => $fees,
                'net_profit' => $net_profit,
                'items' => $items,
                'customer_email' => $order->get_billing_email(), // For LTV tracking
                'city' => $order->get_billing_city(),
                'country' => $order->get_billing_country()
            ]
        ];

        // Use EngineClient for dynamic discovery (Phase 24)
        \ApexAI\Services\EngineClient::proxy_post('/collect', [
            'body' => json_encode($payload),
            'headers' => ['Content-Type' => 'application/json'],
            'blocking' => false, // Async
            'timeout' => 5
        ]);
    }

    /**
     * Whale Alert: Check if cart > Threshold
     */
    public function check_whale_cart($cart_item_key, $product_id, $quantity, $variation_id, $variation, $cart_item_data): void
    {
        // Calculate Cartesian total (approximate since taxes/shipping calculated later)
        if (!WC()->cart)
            return;

        $subtotal = WC()->cart->subtotal;

        // Threshold: Configurable
        $threshold = (float) get_option('apex_whale_threshold', 500);

        if ($subtotal > $threshold) {
            // In a real scenario, this would trigger an email or Slack alert
            // For now, we log it to a special "whale_watch" transient for the dashboard
            $whale_data = [
                'time' => current_time('mysql'),
                'value' => $subtotal,
                'items' => WC()->cart->get_cart_contents_count()
            ];
            set_transient('apex_whale_alert', $whale_data, HOUR_IN_SECONDS);
        }
    }
}
