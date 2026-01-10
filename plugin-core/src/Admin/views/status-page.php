<?php
if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="wrap apex-status-wrap" style="padding: 20px 30px;">
    <h1><?php _e('Apex AI System Status', 'apex-ai-insights'); ?></h1>

    <style>
        .apex-status-wrap .status-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }

        .apex-status-wrap .status-card {
            background: #fff;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .apex-status-wrap .status-card h3 {
            margin: 0 0 15px 0;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .apex-status-wrap .status-indicator {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .apex-status-wrap .status-indicator.ok {
            background: #d4edda;
            color: #155724;
        }

        .apex-status-wrap .status-indicator.error,
        .apex-status-wrap .status-indicator.disconnected {
            background: #f8d7da;
            color: #721c24;
        }

        .apex-status-wrap .status-indicator.degraded {
            background: #fff3cd;
            color: #856404;
        }

        .apex-status-wrap .status-indicator.loading {
            background: #e9ecef;
            color: #495057;
        }

        .apex-status-wrap .status-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            display: inline-block;
        }

        .apex-status-wrap .status-dot.green {
            background: #28a745;
        }

        .apex-status-wrap .status-dot.red {
            background: #dc3545;
        }

        .apex-status-wrap .status-dot.yellow {
            background: #ffc107;
        }

        .apex-status-wrap .status-dot.gray {
            background: #6c757d;
        }

        .apex-status-wrap .status-detail {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #f0f0f0;
            font-size: 13px;
        }

        .apex-status-wrap .status-detail:last-child {
            border-bottom: none;
        }

        .apex-status-wrap .latency {
            color: #666;
            font-family: monospace;
        }

        .apex-status-wrap .overall-status {
            padding: 15px 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .apex-status-wrap .overall-status.healthy {
            background: linear-gradient(135deg, #d4edda, #c3e6cb);
            border: 1px solid #28a745;
        }

        .apex-status-wrap .overall-status.degraded {
            background: linear-gradient(135deg, #fff3cd, #ffeaa7);
            border: 1px solid #ffc107;
        }

        .apex-status-wrap .overall-status.unhealthy {
            background: linear-gradient(135deg, #f8d7da, #f5c6cb);
            border: 1px solid #dc3545;
        }

        .apex-status-wrap .refresh-btn {
            margin-left: auto;
            cursor: pointer;
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            background: rgba(0, 0, 0, 0.1);
            font-size: 13px;
        }

        .apex-status-wrap .refresh-btn:hover {
            background: rgba(0, 0, 0, 0.15);
        }
    </style>

    <div id="apex-overall-status" class="overall-status loading">
        <span class="status-dot gray"></span>
        <strong><?php _e('Checking system status...', 'apex-ai-insights'); ?></strong>
        <button class="refresh-btn" onclick="checkApexHealth()"><?php _e('Refresh', 'apex-ai-insights'); ?></button>
    </div>

    <div class="status-cards">
        <!-- Engine Status -->
        <div class="status-card">
            <h3>
                <span class="dashicons dashicons-admin-tools"></span>
                <?php _e('Apex Intelligence Engine', 'apex-ai-insights'); ?>
            </h3>
            <div id="engine-status">
                <div class="status-detail">
                    <span><?php _e('Connection', 'apex-ai-insights'); ?></span>
                    <span class="status-indicator loading" id="engine-connection">...</span>
                </div>
                <div class="status-detail">
                    <span><?php _e('Version', 'apex-ai-insights'); ?></span>
                    <span id="engine-version">-</span>
                </div>
                <div class="status-detail">
                    <span><?php _e('Build Date', 'apex-ai-insights'); ?></span>
                    <span id="engine-build">-</span>
                </div>
            </div>
        </div>

        <!-- MySQL Status -->
        <div class="status-card">
            <h3>
                <span class="dashicons dashicons-database"></span>
                <?php _e('MySQL Database', 'apex-ai-insights'); ?>
            </h3>
            <div id="mysql-status">
                <div class="status-detail">
                    <span><?php _e('Status', 'apex-ai-insights'); ?></span>
                    <span class="status-indicator loading" id="mysql-connection">...</span>
                </div>
                <div class="status-detail">
                    <span><?php _e('Latency', 'apex-ai-insights'); ?></span>
                    <span class="latency" id="mysql-latency">-</span>
                </div>
            </div>
        </div>

        <!-- Redis Status -->
        <div class="status-card">
            <h3>
                <span class="dashicons dashicons-performance"></span>
                <?php _e('Redis Cache', 'apex-ai-insights'); ?>
            </h3>
            <div id="redis-status">
                <div class="status-detail">
                    <span><?php _e('Status', 'apex-ai-insights'); ?></span>
                    <span class="status-indicator loading" id="redis-connection">...</span>
                </div>
                <div class="status-detail">
                    <span><?php _e('Latency', 'apex-ai-insights'); ?></span>
                    <span class="latency" id="redis-latency">-</span>
                </div>
            </div>
        </div>

        <!-- License Status -->
        <div class="status-card">
            <h3>
                <span class="dashicons dashicons-awards"></span>
                <?php _e('License', 'apex-ai-insights'); ?>
            </h3>
            <div id="license-status">
                <div class="status-detail">
                    <span><?php _e('Status', 'apex-ai-insights'); ?></span>
                    <span class="status-indicator loading" id="license-state">...</span>
                </div>
                <div class="status-detail">
                    <span><?php _e('Days Remaining', 'apex-ai-insights'); ?></span>
                    <span id="license-days">-</span>
                </div>
            </div>
        </div>

        <!-- System Resources -->
        <div class="status-card">
            <h3>
                <span class="dashicons dashicons-dashboard"></span>
                <?php _e('System Resources', 'apex-ai-insights'); ?>
            </h3>
            <div id="system-status">
                <div class="status-detail">
                    <span><?php _e('Memory', 'apex-ai-insights'); ?></span>
                    <span id="system-memory">-</span>
                </div>
                <div class="status-detail">
                    <span><?php _e('Goroutines', 'apex-ai-insights'); ?></span>
                    <span id="system-goroutines">-</span>
                </div>
                <div class="status-detail">
                    <span><?php _e('Go Version', 'apex-ai-insights'); ?></span>
                    <span id="system-go">-</span>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
    function checkApexHealth() {
        const overall = document.getElementById('apex-overall-status');
        overall.className = 'overall-status loading';
        overall.innerHTML = '<span class="status-dot gray"></span><strong><?php _e("Checking system status...", "apex-ai-insights"); ?></strong><button class="refresh-btn" onclick="checkApexHealth()"><?php _e("Refresh", "apex-ai-insights"); ?></button>';

        const data = new FormData();
        data.append('action', 'apex_check_health');
        data.append('nonce', '<?php echo wp_create_nonce("apex-ai-insights"); ?>');

        fetch(ajaxurl, {
            method: 'POST',
            body: data
        })
            .then(response => response.json())
            .then(data => {
                if (data.success && data.data) {
                    updateStatusDisplay(data.data);
                } else {
                    showError(data.data?.message || 'Failed to fetch status');
                }
            })
            .catch(error => {
                showError('Network error: ' + error.message);
            });
    }

    function updateStatusDisplay(health) {
        // Overall status
        const overall = document.getElementById('apex-overall-status');
        const statusClass = health.status || 'unhealthy';
        const statusDot = statusClass === 'healthy' ? 'green' : (statusClass === 'degraded' ? 'yellow' : 'red');
        overall.className = 'overall-status ' + statusClass;
        overall.innerHTML = `
        <span class="status-dot ${statusDot}"></span>
        <strong>${statusClass.toUpperCase()}</strong>
        <span style="color: #666; font-size: 13px;">v${health.version || '-'}</span>
        <button class="refresh-btn" onclick="checkApexHealth()">Refresh</button>
    `;

        // Engine
        updateIndicator('engine-connection', 'ok', 'Connected');
        document.getElementById('engine-version').textContent = health.version || '-';
        document.getElementById('engine-build').textContent = health.build_date || '-';

        // Services
        if (health.services) {
            // MySQL
            const mysql = health.services.mysql || {};
            updateIndicator('mysql-connection', mysql.status, mysql.status === 'ok' ? 'Connected' : mysql.message || 'Error');
            document.getElementById('mysql-latency').textContent = mysql.latency || '-';

            // Redis
            const redis = health.services.redis || {};
            updateIndicator('redis-connection', redis.status, redis.status === 'ok' ? 'Connected' : redis.message || 'Error');
            document.getElementById('redis-latency').textContent = redis.latency || '-';
        }

        // License
        if (health.license) {
            const licStatus = health.license.status || 'unknown';
            const licValid = health.license.valid;
            updateIndicator('license-state', licValid ? 'ok' : 'error', licStatus.replace('_', ' '));
            document.getElementById('license-days').textContent = health.license.days_remaining ?? '-';
        }

        // System
        if (health.system) {
            document.getElementById('system-memory').textContent = (health.system.memory_mb || 0) + ' MB';
            document.getElementById('system-goroutines').textContent = health.system.goroutines || '-';
            document.getElementById('system-go').textContent = health.system.go_version || '-';
        }
    }

    function updateIndicator(id, status, text) {
        const el = document.getElementById(id);
        if (!el) return;
        el.className = 'status-indicator ' + (status || 'error');
        el.innerHTML = '<span class="status-dot ' + (status === 'ok' ? 'green' : 'red') + '"></span>' + text;
    }

    function showError(message) {
        const overall = document.getElementById('apex-overall-status');
        overall.className = 'overall-status unhealthy';
        overall.innerHTML = `
        <span class="status-dot red"></span>
        <strong>CONNECTION FAILED</strong>
        <span style="color: #666; font-size: 13px;">${message}</span>
        <button class="refresh-btn" onclick="checkApexHealth()">Retry</button>
    `;

        updateIndicator('engine-connection', 'error', 'Disconnected');
        updateIndicator('mysql-connection', 'error', 'Unknown');
        updateIndicator('redis-connection', 'error', 'Unknown');
        updateIndicator('license-state', 'error', 'Unknown');
    }

    document.addEventListener('DOMContentLoaded', checkApexHealth);
</script>