<?php

namespace ApexAI\Developer;

if (!defined('ABSPATH')) {
    exit;
}

if (!defined('WP_CLI') || !WP_CLI) {
    return;
}

class Cli
{
    public function init(): void
    {
        if (class_exists('\\WP_CLI')) {
            \WP_CLI::add_command('apex stats', [$this, 'stats_command']);
            \WP_CLI::add_command('apex clear-cache', [$this, 'clear_cache_command']);
        }
    }

    /**
     * Show Apex AI Stats
     * 
     * ## EXAMPLES
     * 
     *     wp apex stats
     *
     */
    public function stats_command($args, $assoc_args): void
    {
        if (!class_exists('\\WP_CLI')) {
            return;
        }

        \WP_CLI::success("Fetching Apex AI Stats...");

        // Mock fetching data from Go Engine
        $visitors = rand(1000, 5000);
        $revenue = rand(500, 2000);

        \WP_CLI::line("-------------------------");
        \WP_CLI::line(" Visitors Today: " . $visitors);
        \WP_CLI::line(" Revenue Today: $" . $revenue);
        \WP_CLI::line(" System Status: Healthy");
        \WP_CLI::line("-------------------------");
    }

    /**
     * Clear Apex AI Caches
     *
     * ## EXAMPLES
     *
     *     wp apex clear-cache
     *
     */
    public function clear_cache_command($args, $assoc_args): void
    {
        if (!class_exists('\\WP_CLI')) {
            return;
        }

        // Mock cache clearing
        \WP_CLI::log("Clearing transient caches...");
        if (function_exists('delete_transient')) {
            delete_transient('apex_daily_stats');
            delete_transient('apex_auth_token');
        }
        \WP_CLI::success("Apex AI Caches cleared!");
    }
}
