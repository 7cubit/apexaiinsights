=== Apex AI Insights ===
Contributors: apexstream
Donate link: https://apexaiinsights.com/
Tags: analytics, ai, seo, woocommerce, gdpr, privacy, form optimization, session recording
Requires at least: 6.0
Tested up to: 6.7
Stable tag: 1.0.0-beta
Requires PHP: 8.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

AI-powered analytics for WordPress. Real-time insights, form optimization, session recording, and GDPR-compliant visitor tracking.

== Description ==

**Apex AI Insights** is an all-in-one analytics and intelligence platform for WordPress sites. Unlike traditional analytics, Apex AI uses artificial intelligence to provide actionable recommendations—not just data.

= Key Features =

* **Real-Time Dashboard** – See live visitor activity, traffic sources, and conversion metrics
* **AI-Powered Insights** – Get automatic recommendations to improve your site
* **Form Analytics** – Track form completion rates, field drop-offs, and friction points
* **Session Recording** – Watch visitor sessions to understand behavior (GDPR-compliant)
* **B2B Lead Identification** – Identify companies visiting your site
* **WooCommerce Integration** – Track product views, cart abandonment, and revenue
* **GDPR Ghost Mode** – Hash all visitor IPs for privacy compliance

= Pro Features (License Required) =

* Advanced AI recommendations via GPT-4o
* Natural language analytics queries ("How many visitors from Germany this week?")
* Automated SEO suggestions
* Custom webhook integrations

== Beta Disclaimer ==

**⚠️ IMPORTANT: This is a BETA release.**

This plugin requires the **Apex Intelligence Engine**, a Go-powered backend service that runs alongside your WordPress installation.

= System Requirements =

* **Docker** and **Docker Compose** must be installed on your server
* Minimum 2GB RAM recommended
* The Apex Engine container must be running for AI features to work

= Quick Start (Docker) =

1. Upload the plugin to `/wp-content/plugins/apex-ai-insights/`
2. Navigate to the plugin directory and run:

`docker compose -f docker-compose.prod.yml up -d`

3. Activate the plugin through the WordPress Admin
4. Visit **Apex AI Insights** in your dashboard

= Known Beta Limitations =

* Some features require an OpenAI API key for full functionality
* Session recording is limited to 1000 sessions without a Pro license
* AI features use graceful fallbacks when API keys are not configured

We appreciate your feedback! Report issues at: https://github.com/apexaiinsights/plugin/issues

== Installation ==

= Standard Installation =

1. Download the plugin ZIP from WordPress.org
2. Go to **Plugins → Add New → Upload Plugin**
3. Upload the ZIP file and click **Install Now**
4. Activate the plugin

= Docker Installation (Required for AI Features) =

1. Ensure Docker is installed on your server
2. Clone or extract the full plugin package (including `docker-compose.prod.yml`)
3. Run: `docker compose -f docker-compose.prod.yml up -d`
4. The Apex Engine will be available on your internal network

= Configuration =

1. Go to **Apex AI Insights → Settings**
2. (Optional) Enter your OpenAI API key for AI-powered features
3. (Optional) Enter your Pro license key for advanced features
4. Configure GDPR settings based on your compliance requirements

== Frequently Asked Questions ==

= Do I need Docker to use this plugin? =

For the dashboard and basic tracking, the plugin works without Docker. However, AI-powered features (recommendations, natural language queries, session recording) require the Apex Intelligence Engine running in Docker.

= Is this plugin GDPR compliant? =

Yes. Enable "Ghost Mode" in settings to automatically hash all visitor IP addresses with a daily-rotating salt. No raw IPs are stored in your database.

= What happens if I don't have an API key? =

The plugin works in "Fallback Mode" with static, helpful suggestions instead of AI-generated content. You can add an OpenAI API key anytime to unlock AI features.

= How does the 7-day Pro trial work? =

When you first install the plugin, Pro features are enabled for 7 days without a license key. After the trial, enter a license key or continue with basic features.

= Can I use this with WooCommerce? =

Absolutely! Apex AI Insights integrates with WooCommerce to track product views, add-to-cart events, checkout funnels, and revenue attribution.

== Screenshots ==

1. Real-time analytics dashboard with AI insights
2. Form analytics showing field-level metrics
3. Session recording playback
4. B2B lead vault with company identification
5. GDPR settings panel

== Changelog ==

= 1.0.0-beta =
* Initial beta release
* Real-time visitor tracking and analytics
* AI-powered form optimization suggestions
* Session recording with GDPR compliance
* B2B lead identification via IP lookup
* WooCommerce integration
* Graceful AI fallback when API keys are missing
* 7-day Pro trial with license grace period
* GDPR Ghost Mode with daily-rotating IP hash salt
* Production Docker configuration

== Upgrade Notice ==

= 1.0.0-beta =
This is the first public beta. Please backup your database before installing. Report any issues to our GitHub repository.

== Privacy Policy ==

Apex AI Insights is designed with privacy in mind:

* **No external tracking by default** – All data stays on your server
* **GDPR Ghost Mode** – IP addresses can be hashed before storage
* **Session Recording** – Can be disabled or limited per user consent
* **Data Deletion** – Supports "Right to be Forgotten" requests

For OpenAI-powered features, queries are sent to OpenAI's API. Review OpenAI's privacy policy at https://openai.com/privacy
