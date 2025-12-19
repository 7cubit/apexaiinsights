<?php
if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="wrap">
    <h1><?php _e('Apex AI System Status', 'apex-ai-insights'); ?></h1>

    <div class="card" style="max-width: 600px; padding: 20px;">
        <h2><?php _e('Hybrid Engine Connectivity', 'apex-ai-insights'); ?></h2>
        <p>
            <strong><?php _e('Go Engine URL:', 'apex-ai-insights'); ?></strong>
            <code>http://apex-engine:8080</code>
        </p>

        <div id="apex-status-indicator" style="padding: 10px; border-radius: 4px; background: #eee; margin-top: 10px;">
            <?php _e('Checking connectivity...', 'apex-ai-insights'); ?>
        </div>
    </div>
</div>

<script>
    document.addEventListener('DOMContentLoaded', function () {
        const indicator = document.getElementById('apex-status-indicator');

        function checkStatus() {
            indicator.innerHTML = '<?php _e("Checking connectivity...", "apex-ai-insights"); ?>';
            indicator.style.background = '#eee';

            const data = new FormData();
            data.append('action', 'apex_check_connectivity');
            data.append('nonce', '<?php echo wp_create_nonce("apex-ai-insights"); ?>');

            fetch(ajaxurl, {
                method: 'POST',
                body: data
            })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'connected') {
                        indicator.innerHTML = '<strong>' + data.status.toUpperCase() + '</strong>: ' + data.engine;
                        indicator.style.background = '#d4edda';
                        indicator.style.color = '#155724';
                    } else {
                        indicator.innerHTML = '<strong>ERROR</strong>: ' + (data.message || 'Unknown error');
                        indicator.style.background = '#f8d7da';
                        indicator.style.color = '#721c24';
                    }
                })
                .catch(error => {
                    indicator.innerHTML = '<strong>NETWORK ERROR</strong>: ' + error.message;
                    indicator.style.background = '#f8d7da';
                    indicator.style.color = '#721c24';
                });
        }

        checkStatus();
    });
</script>