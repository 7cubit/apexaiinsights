(function () {
    'use strict';

    const CONFIG = window.apexSearchConfig || { api_root: '/wp-json/apex/v1', nonce: '' };

    // 1. 404 Tracking
    if (document.body.classList.contains('error404')) {
        const payload = {
            url: window.location.href,
            referrer: document.referrer,
            session_id: 'anon-' + Date.now(), // Simple session ID
            ua: navigator.userAgent
        };

        if (navigator.sendBeacon) {
            const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
            navigator.sendBeacon(`${CONFIG.api_root}/404/track`, blob);
        } else {
            fetch(`${CONFIG.api_root}/404/track`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(console.error);
        }
    }

    // 2. Search Tracking & AI Answer
    if (document.body.classList.contains('search-results') || document.body.classList.contains('search')) {
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('s');

        if (query) {
            // Count results (heuristic: count .post or .type-post elements)
            // Adjust selector based on common themes
            const results = document.querySelectorAll('article.post, .search-result, .entry');
            const resultCount = results.length;

            // Track Search
            const payload = {
                query: query,
                result_count: resultCount,
                session_id: 'anon-' + Date.now(),
                ua: navigator.userAgent
            };

            fetch(`${CONFIG.api_root}/search/track`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(console.error);

            // Fetch AI Answer
            const container = document.querySelector('main') || document.querySelector('#content');
            if (container) {
                const aiBox = document.createElement('div');
                aiBox.id = 'apex-ai-answer';
                aiBox.style.background = '#f0f9ff';
                aiBox.style.border = '1px solid #bae6fd';
                aiBox.style.padding = '20px';
                aiBox.style.marginBottom = '30px';
                aiBox.style.borderRadius = '8px';
                aiBox.style.fontFamily = 'system-ui, sans-serif';
                aiBox.innerHTML = `
                    <h3 style="margin-top:0; color:#0c4a6e; display:flex; align-items:center; gap:8px;">
                        <span style="font-size:1.2em">✨</span> AI Summary
                    </h3>
                    <p style="color:#0369a1; font-style:italic;">Generating an answer for "${query}"...</p>
                `;

                // Prepend to main content
                container.insertBefore(aiBox, container.firstChild);

                fetch(`${CONFIG.api_root}/search/answer`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: query })
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.answer) {
                            aiBox.innerHTML = `
                             <h3 style="margin-top:0; color:#0c4a6e; display:flex; align-items:center; gap:8px;">
                                <span style="font-size:1.2em">✨</span> AI Summary
                            </h3>
                            <div style="color:#334155; line-height:1.6;">${data.answer}</div>
                            <small style="display:block; margin-top:10px; color:#94a3b8;">Powered by Perplexity AI</small>
                        `;
                        } else {
                            aiBox.remove();
                        }
                    })
                    .catch(err => {
                        console.error(err);
                        aiBox.remove();
                    });
            }
        }
    }

})();
