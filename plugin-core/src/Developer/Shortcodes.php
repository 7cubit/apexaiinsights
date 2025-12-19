<?php

namespace ApexAI\Developer;

if (!defined('ABSPATH')) {
    exit;
}

class Shortcodes
{
    public function init(): void
    {
        if (function_exists('add_shortcode')) {
            add_shortcode('apex_trending', [$this, 'render_trending_shortcode']);
        }
    }

    public function render_trending_shortcode($atts): string
    {
        if (!function_exists('shortcode_atts')) {
            return '';
        }

        $a = shortcode_atts([
            'limit' => 5,
            'title' => 'Trending Now'
        ], $atts);

        // Reuse logic or keep simple
        // In a real app, this would call the same service as the Block

        $output = '<div class="apex-shortcode-trending">';
        $output .= '<h4>' . esc_html($a['title']) . '</h4>';
        $output .= '<ul>';

        // Mock Data simulation
        $args = [
            'posts_per_page' => intval($a['limit']),
            'post_status' => 'publish',
            'orderby' => 'comment_count', // Simple proxy for "trending" for now
        ];

        if (class_exists('\\WP_Query')) {
            $query = new \WP_Query($args);

            if ($query->have_posts()) {
                while ($query->have_posts()) {
                    $query->the_post();
                    $output .= '<li><a href="' . esc_url(get_permalink()) . '">' . esc_html(get_the_title()) . '</a> <span style="color:#888;font-size:0.8em;">(Hot)</span></li>';
                }
                wp_reset_postdata();
            }
        }

        $output .= '</ul></div>';
        return $output;
    }
}
