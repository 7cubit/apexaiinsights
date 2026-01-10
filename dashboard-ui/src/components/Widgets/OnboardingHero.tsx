import { useState } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Sparkles, Play, Database, CheckCircle, Loader2 } from 'lucide-react';

interface OnboardingHeroProps {
  onSeedComplete?: () => void;
}

export function OnboardingHero({ onSeedComplete }: OnboardingHeroProps) {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedComplete, setSeedComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = (window as any).apexConfig || {};

  const handleSeedDemoData = async () => {
    setIsSeeding(true);
    setError(null);

    try {
      const tunnelUrl = config.tunnel_url || '/wp-json/apex/v1/tunnel';
      const response = await fetch(`${tunnelUrl}?path=/v1/system/seed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': config.nonce || '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to seed demo data');
      }

      setSeedComplete(true);
      setTimeout(() => {
        onSeedComplete?.();
        window.location.reload();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSeeding(false);
    }
  };

  if (seedComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center p-20 glass-card border-neon-green/30"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10 }}
        >
          <CheckCircle className="w-20 h-20 text-neon-green mb-6" />
        </motion.div>
        <h2 className="text-2xl font-bold text-white mb-2 text-center">Demo Data Loaded!</h2>
        <p className="text-gray-400 text-center">Refreshing your dashboard...</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-12 md:p-20 glass-card border-neon-purple/20 relative overflow-hidden"
    >
      {/* Background Decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-neon-purple/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-neon-green/10 rounded-full blur-3xl" />
      </div>

      {/* Icon */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        className="relative mb-8"
      >
        <div className="absolute inset-0 bg-neon-purple/20 rounded-3xl blur-xl" />
        <div className="relative p-6 bg-gradient-to-br from-neon-purple/20 to-neon-green/10 rounded-3xl border border-white/10">
          <Rocket className="w-16 h-16 text-neon-purple" />
        </div>
        <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-neon-green animate-pulse" />
      </motion.div>

      {/* Content */}
      <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4 text-center">
        Welcome to Apex AI Insights
      </h2>
      <p className="text-gray-400 mb-8 text-center max-w-lg leading-relaxed">
        Your analytics journey starts here. We haven't detected any traffic yet.
        Get started by installing the tracking script or load demo data to explore the dashboard.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSeedDemoData}
          disabled={isSeeding}
          className="flex items-center gap-3 bg-gradient-to-r from-neon-purple to-neon-purple/80 text-white px-8 py-4 rounded-xl font-bold hover:shadow-lg hover:shadow-neon-purple/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSeeding ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Seeding Data...
            </>
          ) : (
            <>
              <Database className="w-5 h-5" />
              Load Demo Data
            </>
          )}
        </motion.button>

        <motion.a
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          href="#setup"
          onClick={(e) => {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('apex-show-setup'));
          }}
          className="flex items-center gap-3 bg-white/5 text-white px-8 py-4 rounded-xl font-bold border border-white/10 hover:bg-white/10 transition-all"
        >
          <Play className="w-5 h-5" />
          Setup Tracking
        </motion.a>
      </div>

      {/* Feature Preview */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
        {[
          { icon: '📊', label: 'Real-time Analytics' },
          { icon: '🤖', label: 'AI-Powered Insights' },
          { icon: '🎯', label: 'Conversion Tracking' },
        ].map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5"
          >
            <span className="text-2xl">{feature.icon}</span>
            <span className="text-sm text-gray-300">{feature.label}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default OnboardingHero;
