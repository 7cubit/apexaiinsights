<?php

namespace ApexAI\Integrations;

class ContentStrategist
{
    public function register(): void
    {
        // Hook into the_title to swap headlines
        add_filter('the_title', [$this, 'maybe_swap_headline'], 10, 2);

        // Inject variant ID for tracking
        add_filter('body_class', [$this, 'add_variant_body_class']);
    }

    public function maybe_swap_headline($title, $id = null)
    {
        if (!is_admin() && in_the_loop() && is_main_query()) {
            // MVP: Mock A/B Test for a specific Post ID or random logic
            // In production, this would query the DB for active tests

            // Example: If Post ID is 1 (Hello World), swap title 50% of the time
            if ($id === 1) {
                $variant = $this->get_assigned_variant($id);
                if ($variant === 'B') {
                    return "Hello World! (Optimization Candidate B)";
                }
            }
        }
        return $title;
    }

    public function add_variant_body_class($classes)
    {
        if (is_single()) {
            global $post;
            $variant = $this->get_assigned_variant($post->ID);
            if ($variant) {
                $classes[] = 'apex-variant-' . $variant;
            }
        }
        return $classes;
    }

    private function get_assigned_variant($post_id)
    {
        // Simple session-based persistence to keep user on same variant
        if (!session_id()) {
            @session_start();
        }

        $key = 'apex_ab_' . $post_id;
        if (!isset($_SESSION[$key])) {
            $_SESSION[$key] = (rand(0, 1) === 1) ? 'B' : 'A';
        }

        return $_SESSION[$key];
    }
}
