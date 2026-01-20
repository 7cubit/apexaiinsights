import React, { useState, useEffect } from "react";
import Shell from "./components/Layout/Shell";
import LivePulse from "./components/Widgets/LivePulse";
import CommandBar from "./components/Widgets/CommandBar";
import KPICards from "./components/Widgets/KPICards";
import TrafficChart from "./components/Widgets/TrafficChart";
import GlobalMap from "./components/Widgets/GlobalMap";
import DateRangePicker from "./components/Widgets/DateRangePicker";
import SetupWizard from "./components/Widgets/SetupWizard";
import ChatInterface from "./components/Widgets/ChatInterface";
import NetProfitWidget from "./components/Widgets/NetProfitWidget";
import WhaleWatchWidget from "./components/Widgets/WhaleWatchWidget";
import CheckoutFunnelWidget from "./components/Widgets/CheckoutFunnelWidget";
import LTVLeaderboardWidget from "./components/Widgets/LTVLeaderboardWidget";
import ProductVelocityWidget from "./components/Widgets/ProductVelocityWidget";
import { ContentDecayWidget } from "./components/Widgets/ContentDecayWidget";
import { ReplaySection } from "./components/Widgets/ReplaySection";
import { AuthorLeaderboardWidget } from "./components/Widgets/AuthorLeaderboardWidget";
import {
  ContentStats,
  ContentTable,
  ReadabilityWidget,
  ContentSuggestions,
} from "./components/Widgets/Content";
import { FormAnalytics } from "./components/Widgets/FormAnalytics";
import OnboardingHero from "./components/Widgets/OnboardingHero";
import SearchAnalytics from "./components/Widgets/SearchAnalytics";
import SEOManager from "./components/Widgets/SEOManager";
import { AutomationBuilder } from "./components/Widgets/AutomationBuilder";
import SegmentationAnalytics from "./components/Widgets/Segmentation/SegmentationAnalytics";
import SocialAnalytics from "./components/Widgets/Social/SocialAnalytics";
import { useLiveMetrics } from "./hooks/useMetrics";
import PerformanceAnalytics from "./components/Widgets/Performance/PerformanceAnalytics";
import SecurityCenter from "./components/Widgets/Security/SecurityAnalytics";
import GodModeAnalytics from "./components/Widgets/GodMode/GodModeAnalytics";
import DeveloperCenter from "./components/Widgets/Developer/DeveloperCenter";
import JarvisOrb from "./components/Widgets/Jarvis/JarvisOrb";
import { motion } from "framer-motion";
import { useVoice } from "./hooks/useVoice";
import UpgradeModal from "./components/Widgets/UpgradeModal";
import { LicenseActivation } from "./components/Widgets/Settings/LicenseActivation";
import { Lock, AlertTriangle, ShieldAlert, Sparkles, ShoppingCart } from "lucide-react";

import { EmailConfig } from "./components/Widgets/Settings/EmailConfig";
import { FeedbackForm } from "./components/Widgets/Settings/FeedbackForm";
import { GDPRSettings } from "./components/Widgets/Settings/GDPRSettings";
import GoogleAnalyticsConnect from "./components/Widgets/Settings/GoogleAnalyticsConnect";

// Basic Error Boundary for component crashes
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center glass-card border-red-500/30 w-full">
          <h2 className="text-xl font-bold text-red-500 mb-2">
            Component Error
          </h2>
          <p className="text-gray-400 text-sm">
            Something went wrong while rendering this tab. This might be due to
            a data fetching error or a missing API field.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors text-xs"
          >
            Reload Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Helper component for settings tab
const SettingsSection = () => (
  <>
    <div className="col-span-1 md:col-span-2">
      <h2 className="text-2xl font-bold text-white mb-4">System Settings</h2>
    </div>
    <GoogleAnalyticsConnect />
    <EmailConfig />
    <GDPRSettings />
    <FeedbackForm />
  </>
);

function App() {
  const { onlineCount, isLoading } = useLiveMetrics();
  // Mock User Role Logic: 'admin', 'shop_manager', 'editor'
  // In a real app, this would come from a Context or API
  const [userRole] = useState<"admin" | "shop_manager" | "editor">("admin");
  const [activeTab, setActiveTab] = useState(() => {
    // Priority: 1. WP page param (for submenu navigation), 2. Hash, 3. Default
    const params = new URLSearchParams(window.location.search);
    const page = params.get("page") || "";

    let tab = "overview";

    // First, check the WP page parameter (this is set by WordPress submenu clicks)
    if (page === "apex-ai-insights") {
      tab = "overview";
    } else if (page.startsWith("apex-ai-insights-")) {
      tab = page.replace("apex-ai-insights-", "");
    } else {
      // Fall back to hash if no WP page param
      const hash = window.location.hash.replace(/^#\/?/, "");
      if (hash) tab = hash;
    }

    // Sync hash to enable instant navigation within the SPA
    window.history.replaceState(null, "", window.location.pathname + window.location.search + "#" + tab);

    return tab;
  });
  const [dateRange, setDateRange] = useState("7d");

  // White Label Support (Phase 25)
  const config = (window as any).apexConfig || {};
  const currentPlan = (config.plan || "pro").toLowerCase();
  const isElite = currentPlan === "elite" || currentPlan === "lifetime";
  const hideTechnical =
    isElite && (config.white_label?.hide_technical || false);

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const licenseStatus = config.license?.status || "inactive";
  const isReadOnly = licenseStatus === "expired";
  const [showOnboardingWelcome, setShowOnboardingWelcome] = useState(false);
  // BUG-001: Track if no data exists for onboarding hero
  const [isEmptyState, setIsEmptyState] = useState(!config.nonce);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("token") === "secure_onboarding_test") {
      setShowOnboardingWelcome(true);
      setActiveTab("settings");
    }
  }, []);

  // Intercept WordPress submenu clicks for instant SPA navigation
  useEffect(() => {
    const handleSubmenuClick = (e: MouseEvent) => {
      const target = e.target as HTMLAnchorElement;
      const link = target.closest('a[href*="page=apex-ai-insights"]');

      if (link && link instanceof HTMLAnchorElement) {
        const href = link.getAttribute('href') || '';
        const pageMatch = href.match(/page=apex-ai-insights(-([a-z]+))?/);

        if (pageMatch) {
          e.preventDefault();
          e.stopPropagation();

          const tab = pageMatch[2] || 'overview';
          setActiveTab(tab);

          // Update URL without reload
          window.history.pushState(null, '', href + '#' + tab);

          // Update active menu styling
          document.querySelectorAll('#adminmenu .wp-submenu li').forEach(li => {
            li.classList.remove('current');
          });
          link.closest('li')?.classList.add('current');
        }
      }
    };

    // Attach to WordPress admin menu
    const adminMenu = document.getElementById('adminmenu');
    if (adminMenu) {
      adminMenu.addEventListener('click', handleSubmenuClick);
    }

    return () => {
      if (adminMenu) {
        adminMenu.removeEventListener('click', handleSubmenuClick);
      }
    };
  }, []);


  const processVoiceCommand = (text: string) => {
    const lower = text.toLowerCase();

    // Command Mapper
    if (lower.includes("show me sales") || lower.includes("open sales")) {
      setActiveTab("sales");
      speak("Opening Sales Dashboard.");
    } else if (
      lower.includes("show me performance") ||
      lower.includes("open performance")
    ) {
      setActiveTab("performance");
      speak("Here is the performance report.");
    } else if (
      lower.includes("show me security") ||
      lower.includes("open security")
    ) {
      setActiveTab("security");
      speak("Security Center accessed.");
    } else if (
      lower.includes("god mode") ||
      lower.includes("mission control")
    ) {
      setActiveTab("godmode");
      speak("Accessing God Mode. Be careful.");
    } else if (lower.includes("go home") || lower.includes("overview")) {
      setActiveTab("overview");
      speak("Back to overview.");
    }
  };

  // Phase 17: Voice Command Processing
  const { speak, isListening, transcript, startListening, stopListening } =
    useVoice((text) => {
      processVoiceCommand(text);
    });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, "");
      if (hash) {
        setActiveTab(hash);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    const handleOpenUpgrade = () => setIsUpgradeModalOpen(true);
    window.addEventListener("apex-open-upgrade", handleOpenUpgrade);
    return () =>
      window.removeEventListener("apex-open-upgrade", handleOpenUpgrade);
  }, []);

  return (
    <>
      <Shell activeTab={activeTab} setActiveTab={setActiveTab}>
        {showOnboardingWelcome && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-neon-purple/20 border border-neon-purple/30 rounded-2xl flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="text-neon-purple" />
              <div>
                <h4 className="text-white font-bold">
                  Welcome to your Apex Management Portal!
                </h4>
                <p className="text-xs text-gray-400">
                  Your Pro tier purchase was successful. Please activate your
                  license below.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowOnboardingWelcome(false)}
              className="text-gray-500 hover:text-white"
            >
              ✕
            </button>
          </motion.div>
        )}

        {licenseStatus === "grace_period" && (
          <div className="mb-6 p-4 bg-orange-500/20 border border-orange-500/30 rounded-2xl flex items-center gap-3 animate-pulse">
            <AlertTriangle className="text-orange-400" />
            <span className="text-sm text-orange-200">
              <strong>Action Required:</strong> Your subscription has been
              cancelled. You are currently in a 5-day grace period. Renew now to
              avoid losing access to Intelligence features.
            </span>
          </div>
        )}

        {isReadOnly && (
          <div className="fixed inset-0 z-[100] bg-midnight/80 backdrop-blur-xl flex items-center justify-center p-6">
            <div className="glass-card p-12 max-w-lg text-center border-red-500/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-red-500/5 pointer-events-none" />
              <ShieldAlert
                size={64}
                className="text-red-500 mx-auto mb-6 opacity-80"
              />
              <h2 className="text-3xl font-display font-bold text-white mb-4">
                Intelligence Engine Offline
              </h2>
              <p className="text-gray-400 mb-8 leading-relaxed">
                Your license has expired. The dashboard is now in **Read-Only
                Mode**. Historical data is preserved, but AI insights, B2B data,
                and real-time tracking have been disabled.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="bg-red-500 text-white px-8 py-3 rounded-xl font-bold hover:shadow-red-500/30 transition-all"
                >
                  Renew Subscription
                </button>
                <button
                  onClick={() => setActiveTab("settings")}
                  className="bg-white/5 text-white px-8 py-3 rounded-xl font-bold border border-white/10 hover:bg-white/10 transition-all"
                >
                  Enter License Key
                </button>
              </div>
            </div>
          </div>
        )}

        <SetupWizard />
        <ChatInterface />

        {/* Phase 20: Remove redundant internal tabs if in WP, keep for standalone dev */}
        {!(window as any).apexConfig && (
          <div className="mb-8">
            <div className="flex space-x-4 border-b border-white/10 pb-2 overflow-x-auto">
              {[
                "overview",
                "content",
                "woocommerce",
                "replay",
                "forms",
                "search",
                "seo",
                "automation",
                "segmentation",
                "social",
                "performance",
                "security",
                "godmode",
                "developer",
                "settings",
              ].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-2 px-1 capitalize ${activeTab === tab
                    ? "text-neon-green border-b-2 border-neon-green"
                    : "text-gray-400 hover:text-white"
                    }`}
                >
                  {tab === "godmode"
                    ? "GOD MODE"
                    : tab === "developer"
                      ? "API & DEV"
                      : tab}
                </button>
              ))}
            </div>
          </div>
        )}

        <ErrorBoundary>
          {activeTab === "settings" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              <SettingsSection />
            </div>
          )}

          {activeTab === "overview" && (
            isEmptyState ? (
              // BUG-001: Show OnboardingHero when no data exists
              <OnboardingHero onSeedComplete={() => setIsEmptyState(false)} />
            ) : (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <CommandBar />
                  <DateRangePicker range={dateRange} setRange={setDateRange} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  <KPICards range={dateRange} />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 relative">
                  <div className="lg:col-span-2">
                    <TrafficChart range={dateRange} />
                  </div>
                  <div className="lg:col-span-1">
                    {/* User Role Logic: Editor sees Content (Map), Shop Manager sees Sales (maybe hidden here?), Admin sees all */}
                    {userRole !== "shop_manager" ? (
                      <GlobalMap />
                    ) : (
                      <div className="glass-card h-[400px] flex items-center justify-center">
                        <p className="text-gray-400">
                          Sales Region Map (Shop Manager View)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  <div className="lg:col-span-1">
                    <LivePulse onlineCount={onlineCount} isLoading={isLoading} />
                  </div>
                </div>
              </div>
            )
          )}

          {activeTab === "content" && (
            <div className="space-y-6 animate-fade-in">
              {/* Content Stats Header */}
              <ContentStats range={dateRange} />

              {/* Two-column grid: Decay + Authors */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ContentDecayWidget range={dateRange} />
                <AuthorLeaderboardWidget range={dateRange} />
              </div>

              {/* Full-width Content Table */}
              <ContentTable range={dateRange} />

              {/* Two-column grid: Readability + AI Suggestions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ReadabilityWidget />
                <ContentSuggestions />
              </div>
            </div>
          )}

          {activeTab === "woocommerce" &&
            (!config.wooActive ? (
              // WooCommerce not installed - Graceful Degradation Banner
              <div className="flex flex-col items-center justify-center p-20 glass-card border-orange-500/20">
                <ShoppingCart className="w-16 h-16 text-orange-400 mb-6 opacity-50" />
                <h2 className="text-2xl font-bold text-white mb-2 text-center">
                  Connect WooCommerce
                </h2>
                <p className="text-gray-400 mb-8 text-center max-w-md">
                  WooCommerce is not installed or activated. Install WooCommerce
                  to unlock powerful e-commerce analytics including Net Profit
                  tracking, COGS management, and checkout funnel forensics.
                </p>
                <div className="flex gap-4">
                  <a
                    href="/wp-admin/plugin-install.php?s=woocommerce&tab=search&type=term"
                    className="bg-orange-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors"
                  >
                    Install WooCommerce
                  </a>
                  <a
                    href="https://woocommerce.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/5 text-white px-8 py-3 rounded-xl font-bold border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    Learn More
                  </a>
                </div>
              </div>
            ) : currentPlan === "plus" ? (
              <div className="flex flex-col items-center justify-center p-20 glass-card border-neon-purple/20">
                <Lock className="w-16 h-16 text-neon-purple mb-6 opacity-50" />
                <h2 className="text-2xl font-bold text-white mb-2 text-center">
                  WooCommerce Insights Locked
                </h2>
                <p className="text-gray-400 mb-8 text-center max-w-md">
                  Upgrade to the **Pro Plan** to unlock Net Profit, COGS, and
                  deep funnel forensics for your store.
                </p>
                <button
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="bg-neon-purple text-white px-8 py-3 rounded-xl font-bold hover:shadow-neon-purple/30 transition-shadow"
                >
                  Upgrade to Pro
                </button>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <NetProfitWidget />
                  <WhaleWatchWidget />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <CheckoutFunnelWidget />
                  <LTVLeaderboardWidget />
                </div>
                <ProductVelocityWidget />
              </div>
            ))}

          {activeTab === "replay" && <ReplaySection />}

          {activeTab === "forms" && <FormAnalytics range={dateRange} />}

          {activeTab === "search" && <SearchAnalytics range={dateRange} />}

          {activeTab === "seo" && <SEOManager range={dateRange} />}

          {activeTab === "automation" && <AutomationBuilder />}

          {activeTab === "segmentation" && <SegmentationAnalytics />}

          {activeTab === "social" && <SocialAnalytics />}

          {activeTab === "performance" && <PerformanceAnalytics />}

          {activeTab === "security" && <SecurityCenter />}

          {activeTab === "settings" && (
            <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
              <LicenseActivation />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <EmailConfig />
                <FeedbackForm />
              </div>
            </div>
          )}

          {activeTab === "godmode" &&
            (hideTechnical ? (
              <div className="p-8 text-center text-gray-500">
                Access Restricted
              </div>
            ) : (
              <GodModeAnalytics />
            ))}
          {activeTab === "developer" &&
            (hideTechnical ? (
              <div className="p-8 text-center text-gray-500">
                Access Restricted
              </div>
            ) : (
              <DeveloperCenter />
            ))}
        </ErrorBoundary>
      </Shell>
      <JarvisOrb
        isListening={isListening}
        transcript={transcript}
        onClick={isListening ? stopListening : startListening}
      />
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        currentPlan={currentPlan}
      />
    </>
  );
}

export default App;
