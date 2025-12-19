<?php
/**
 * Plugin Name: Apex AI Insights
 * Description: Revolutionary Analytics with AI Sidecar.
 * Version: 0.1.0
 * Author: Apex AI Team
 * Text Domain: apex-ai-insights
 * Requires PHP: 8.2
 */

if (!defined('ABSPATH')) {
    exit;
}

define('APEX_AI_VERSION', '0.1.0');
define('APEX_AI_PLUGIN_FILE', __FILE__);
define('APEX_AI_PLUGIN_DIR', plugin_dir_path(__FILE__));

// Load Composer autoloader
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require_once __DIR__ . '/vendor/autoload.php';
}

/**
 * Run on plugin activation
 */
register_activation_hook(__FILE__, function () {
    \ApexAI\Schema::install();
});

/**
 * Initialize the plugin
 */
add_action('plugins_loaded', function () {
    \ApexAI\Plugin::getInstance()->init();
});
