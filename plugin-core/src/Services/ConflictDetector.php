<?php

namespace ApexAI\Services;

class ConflictDetector
{
    private array $conflicts = [
        'w3-total-cache/w3-total-cache.php' => 'Known caching conflict with Apex AI Real-time stats.',
        'autoptimize/autoptimize.php' => 'Minification may break Apex Tracker JS.',
        'wordfence/wordfence.php' => 'Firewall rules might block API requests. Allowlist IP required.',
    ];

    public function check(): array
    {
        if (!function_exists('is_plugin_active')) {
            include_once(ABSPATH . 'wp-admin/includes/plugin.php');
        }

        $found_conflicts = [];

        foreach ($this->conflicts as $plugin => $reason) {
            if (is_plugin_active($plugin)) {
                $found_conflicts[] = [
                    'plugin' => $plugin,
                    'reason' => $reason
                ];
            }
        }

        return $found_conflicts;
    }

    public function render_admin_notice(): void
    {
        $conflicts = $this->check();
        if (empty($conflicts)) {
            return;
        }

        echo '<div class="notice notice-warning is-dismissible">';
        echo '<p><strong>Apex AI Insights Warning:</strong> Potential plugin conflicts detected.</p>';
        echo '<ul>';
        foreach ($conflicts as $conflict) {
            echo '<li><strong>' . esc_html($conflict['plugin']) . '</strong>: ' . esc_html($conflict['reason']) . '</li>';
        }
        echo '</ul>';
        echo '</div>';
    }

    public function init(): void
    {
        add_action('admin_notices', [$this, 'render_admin_notice']);
    }
}
