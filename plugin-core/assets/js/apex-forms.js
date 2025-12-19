(function () {
    'use strict';

    const CONFIG = window.apexFormsConfig || { api_root: '/wp-json/apex/v1', nonce: '' };
    let sessionStartTime = Date.now();
    let events = [];
    let metrics = {};

    // Auto-detect Form Type
    function detectFormType(form) {
        const cls = form.className || '';
        const id = form.id || '';
        if (cls.includes('wpcf7')) return 'Contact Form 7';
        if (cls.includes('gform')) return 'Gravity Forms';
        if (cls.includes('woocommerce-checkout')) return 'WooCommerce Checkout';
        if (cls.includes('ninja-forms')) return 'Ninja Forms';
        if (cls.includes('wpforms')) return 'WPForms';
        if (id.includes('commentform')) return 'WordPress Comment';
        return 'Unknown Form';
    }

    function getFormId(form) {
        return form.id || form.getAttribute('name') || detectFormType(form);
    }

    function getSelector(el) {
        if (el.id) return '#' + el.id;
        if (el.name) return '[name="' + el.name + '"]';
        return el.tagName.toLowerCase();
    }

    function pushEvent(type, details) {
        // Helper to find the main form if not provided in details
        let formElement = details && details.form ? document.querySelector(details.form) : null;
        if (!formElement) {
            // Try to find the closest form if a target is available
            if (details && details.field) {
                const fieldElement = document.querySelector(details.field);
                if (fieldElement) {
                    formElement = fieldElement.form;
                }
            }
            // Fallback to the first form on the page if no specific form is identified
            if (!formElement) {
                formElement = document.querySelector('form');
            }
        }

        const formType = formElement ? detectFormType(formElement) : 'No Form';
        const formId = formElement ? getFormId(formElement) : 'global';

        eventQueue.push({
            type: type,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            form_id: formId, // New field
            form_type: formType, // New field
            ...details
        });
    }

    function flushEvents() {
        if (eventQueue.length === 0) return;

        const payload = [...eventQueue];
        eventQueue = [];

        if (navigator.sendBeacon) {
            const blob = new Blob([JSON.stringify({ events: payload })], { type: 'application/json' });
            // Use the standard telemetry endpoint, generic ingestion
            navigator.sendBeacon(`${CONFIG.api_root}/telemetry?_wpnonce=${CONFIG.nonce}`, blob);
        } else {
            // Fallback
            fetch(`${CONFIG.api_root}/telemetry`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': CONFIG.nonce
                },
                body: JSON.stringify({ events: payload })
            }).catch(console.error);
        }
    }

    // Input Tracking
    document.addEventListener('focus', function (e) {
        const target = e.target;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
            const selector = getSelector(target);
            fieldTimers[selector] = Date.now();
            pushEvent('form_field_focus', { field: selector, form: getSelector(target.form || document.body) });
        }
    }, true);

    document.addEventListener('blur', function (e) {
        const target = e.target;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
            const selector = getSelector(target);
            if (fieldTimers[selector]) {
                const dwellTime = Date.now() - fieldTimers[selector];
                pushEvent('form_field_blur', {
                    field: selector,
                    form: getSelector(target.form || document.body),
                    dwell_ms: dwellTime
                });
                delete fieldTimers[selector];
            }
        }
    }, true);

    document.addEventListener('change', function (e) {
        const target = e.target;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
            pushEvent('form_field_change', {
                field: getSelector(target),
                form: getSelector(target.form || document.body)
            });
        }
    }, true);

    // Rage Click Detection on Submit
    let submitClicks = [];
    document.addEventListener('click', function (e) {
        const target = e.target.closest('button[type="submit"], input[type="submit"]');
        if (target) {
            const now = Date.now();
            submitClicks.push(now);
            // Keep only clicks within last 2 seconds
            submitClicks = submitClicks.filter(t => now - t < 2000);

            if (submitClicks.length >= 3) {
                pushEvent('form_rage_click', {
                    target: getSelector(target),
                    clicks: submitClicks.length
                });
                submitClicks = []; // Reset after reporting
            }
        }
    }, true);

    // Initial Flush Loop
    setInterval(flushEvents, BATCH_INTERVAL);
    window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') flushEvents();
    });

})();
