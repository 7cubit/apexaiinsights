<?php

namespace ApexAI\Developer;

if (!defined('ABSPATH')) {
    exit;
}

class Blocks
{
    public function init(): void
    {
        if (function_exists('add_action')) {
            add_action('init', [$this, 'register_blocks']);
        }
    }

    public function register_blocks(): void
    {
        if (!function_exists('register_block_type')) {
            return;
        }

        // Register the dynamic block
        // In a real scenario, this would likely wrap a JS-built block
        // For Phase 17, we focus on the PHP-side registration for ServerSideRender
        register_block_type('apex-ai/trending-posts', [
            'editor_script' => 'apex-ai-blocks', // Assumes JS build exists or is stubbed
            'render_callback' => [$this, 'render_trending_posts'],
            'attributes' => [
                'limit' => [
                    'type' => 'number',
                    'default' => 5,
                ],
            ],
        ]);
    }

    public function render_trending_posts($attributes): string
    {
        // Fetch data from Go Engine (mocked for now, or direct DB query)
        // Ideally: $data = RemoteEngine::get('/v1/public/trending');

        $limit = isset($attributes['limit']) ? intval($attributes['limit']) : 5;

        // Mock output
        $output = '<div class="apex-trending-posts">';
        $output .= '<h3>' . esc_html__('Trending Posts (Apex AI)', 'apex-ai-insights') . '</h3>';
        $output .= '<ul>';

        // Use WP Query to get real posts but pretend they are sorted by AI metrics
        $args = [
            'posts_per_page' => $limit,
            'post_status' => 'publish',
        ];

        if (class_exists('\\WP_Query')) {
            $query = new \WP_Query($args);

            if ($query->have_posts()) {
                while ($query->have_posts()) {
                    $query->the_post();
                    $output .= '<li><a href="' . esc_url(get_permalink()) . '">' . esc_html(get_the_title()) . '</a></li>';
                }
                wp_reset_postdata();
            } else {
                $output .= '<li>' . esc_html__('No trending data available.', 'apex-ai-insights') . '</li>';
            }
        }

        $output .= '</ul>';
        $output .= '</div>';

        return $output;
    }
}
