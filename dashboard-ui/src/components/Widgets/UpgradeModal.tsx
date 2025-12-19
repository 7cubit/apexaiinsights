import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Zap, Shield, BarChart3, Rocket } from 'lucide-react';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentPlan: string;
}

const tiers = [
    {
        name: 'Plus',
        price: '99',
        period: '/year',
        description: 'Perfect for bloggers & solopreneurs.',
        features: [
            { text: '1 Site License', included: true },
            { text: 'Unlimited Pageviews', included: true },
            { text: 'Content Decay Radar', included: true },
            { text: 'Basic AI Chat', included: true },
            { text: 'B2B Company Data', included: false },
            { text: 'WooCommerce Profit Suite', included: false },
            { text: 'White Labeling', included: false },
        ],
        buttonText: 'Current Plan',
        isCurrent: true,
        highlight: false
    },
    {
        name: 'Pro',
        price: '199',
        period: '/year',
        description: 'The ultimate business grow kit.',
        features: [
            { text: '5 Site Licenses', included: true },
            { text: 'Native B2B Engine', included: true },
            { text: 'WooCommerce Profit Suite', included: true },
            { text: 'Form Friction Analysis', included: true },
            { text: 'Full AI Analyst', included: true },
            { text: 'White Labeling', included: false },
            { text: 'Priority Support', included: false },
        ],
        buttonText: 'Upgrade to Pro',
        isCurrent: false,
        highlight: true,
        tag: 'Most Popular'
    },
    {
        name: 'Elite',
        price: '299',
        period: '/year',
        description: 'For agencies & power users.',
        features: [
            { text: '25 Site Licenses', included: true },
            { text: 'White Labeling', included: true },
            { text: 'Client Management Portal', included: true },
            { text: 'Exportable PDF Reports', included: true },
            { text: 'Priority Chat Support', included: true },
            { text: 'Unlimited Sites (Early Bird)', included: true },
            { text: 'Custom AI Training', included: true },
        ],
        buttonText: 'Go Elite',
        isCurrent: false,
        highlight: false
    }
];

export default function UpgradeModal({ isOpen, onClose, currentPlan }: UpgradeModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-md"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-6xl bg-midnight-light border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                >
                    {/* Founder's LTD Banner */}
                    <div className="bg-gradient-to-r from-neon-purple/20 via-neon-blue/20 to-neon-green/20 border-b border-white/10 py-3 px-6 flex items-center justify-between overflow-hidden relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        <div className="flex items-center gap-3 relative">
                            <Rocket className="text-neon-green w-5 h-5 animate-pulse" />
                            <span className="text-sm font-bold tracking-wide text-white">
                                LAUNCH SPECIAL: FOUNDER'S LIFETIME DEAL
                            </span>
                        </div>
                        <div className="flex items-center gap-4 relative">
                            <span className="text-xs text-gray-400 line-through">$1,495 Value</span>
                            <span className="text-neon-green font-bold text-sm">$399 ONE-TIME</span>
                            <button className="bg-neon-green text-midnight px-4 py-1.5 rounded-full text-xs font-bold hover:shadow-neon-green/40 transition-shadow">
                                Claim Lifetime Access
                            </button>
                        </div>
                    </div>

                    <div className="p-8 overflow-y-auto">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-display font-bold text-white mb-2">Upgrade Your Insights</h2>
                            <p className="text-gray-400">Join thousands of businesses who use Apex AI to disrupt their industries.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {tiers.map((tier) => (
                                <div
                                    key={tier.name}
                                    className={`relative p-8 rounded-2xl border transition-all duration-300 flex flex-col ${tier.highlight
                                            ? 'bg-white/5 border-neon-green/30 shadow-neon-green/5 scale-105 z-10'
                                            : 'bg-black/20 border-white/5 hover:border-white/20'
                                        } ${currentPlan.toLowerCase() === tier.name.toLowerCase() ? 'ring-2 ring-emerald-500/50' : ''}`}
                                >
                                    {tier.tag && (
                                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-neon-green text-midnight px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                            {tier.tag}
                                        </span>
                                    )}

                                    <div className="mb-6">
                                        <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-bold text-white">${tier.price}</span>
                                            <span className="text-gray-500 text-sm font-medium">{tier.period}</span>
                                        </div>
                                        <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                                            {tier.description}
                                        </p>
                                    </div>

                                    <div className="space-y-4 mb-8 flex-1">
                                        {tier.features.map((feature, idx) => (
                                            <div key={idx} className="flex items-start gap-3">
                                                {feature.included ? (
                                                    <Check className="w-5 h-5 text-neon-green mt-0.5 shrink-0" />
                                                ) : (
                                                    <X className="w-5 h-5 text-gray-700 mt-0.5 shrink-0" />
                                                )}
                                                <span className={`text-sm ${feature.included ? 'text-gray-300' : 'text-gray-600'}`}>
                                                    {feature.text}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        disabled={currentPlan.toLowerCase() === tier.name.toLowerCase()}
                                        className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${currentPlan.toLowerCase() === tier.name.toLowerCase()
                                                ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                                                : tier.highlight
                                                    ? 'bg-neon-green text-midnight hover:shadow-neon-green/30'
                                                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                                            }`}
                                    >
                                        {currentPlan.toLowerCase() === tier.name.toLowerCase() ? 'Current Plan' : tier.buttonText}
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="mt-12 pt-8 border-t border-white/5 text-center">
                            <p className="text-gray-500 text-sm flex items-center justify-center gap-6">
                                <span className="flex items-center gap-2">
                                    <Shield className="w-4 h-4" /> 14-Day Money Back Guarantee
                                </span>
                                <span className="flex items-center gap-2">
                                    <Zap className="w-4 h-4" /> Instant Activation
                                </span>
                                <span className="flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4" /> Cancel Anytime
                                </span>
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
