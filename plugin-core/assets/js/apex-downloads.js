(function () {
    // Apex Download Tracker
    // Tracks clicks on downloadable assets (PDF, ZIP, CSV, etc.)

    const TRACKABLE_EXTENSIONS = ['.pdf', '.zip', '.csv', '.xlsx', '.docx', '.pptx', '.mp4', '.mp3'];
    const ENDPOINT = '/wp-json/apex/v1/telemetry/download'; // Proxied to Go

    function init() {
        document.addEventListener('click', handleDownloadClick, true);
    }

    function handleDownloadClick(e) {
        const link = e.target.closest('a');
        if (!link || !link.href) return;

        const url = new URL(link.href);
        const path = url.pathname.toLowerCase();

        const isDownloadable = TRACKABLE_EXTENSIONS.some(ext => path.endsWith(ext));

        if (isDownloadable) {
            sendDownloadEvent(link.href);
        }
    }

    function sendDownloadEvent(fileUrl) {
        // @ts-ignore
        const nonce = window.apexConfig?.nonce || '';
        // @ts-ignore
        const apiRoot = window.apexConfig?.api_root || '';

        const payload = {
            event: 'download',
            file_url: fileUrl,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            referrer: document.referrer
        };

        if (navigator.sendBeacon) {
            const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
            navigator.sendBeacon(`${apiRoot}/telemetry/download`, blob);
        } else {
            fetch(`${apiRoot}/telemetry/download`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': nonce
                },
                body: JSON.stringify(payload)
            }).catch(err => console.error('Apex Download Track Error:', err));
        }
    }

    // Initialize only if strictly necessary configuration is present
    if (window.apexConfig) {
        init();
    } else {
        // Retry logic if config is slow to load
        setTimeout(() => {
            if (window.apexConfig) init();
        }, 1000);
    }

})();
