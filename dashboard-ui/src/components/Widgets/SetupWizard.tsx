import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Check, ArrowRight, Zap } from 'lucide-react';

export default function SetupWizard() {
    const [isOpen, setIsOpen] = useState(false);

    // Mock checking if user is new
    useEffect(() => {
        const hasSeenWizard = localStorage.getItem('apex_wizard_seen');
        if (!hasSeenWizard) {
            setTimeout(() => setIsOpen(true), 1000);
        }
    }, []);

    const handleComplete = () => {
        localStorage.setItem('apex_wizard_seen', 'true');
        setIsOpen(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="w-full max-w-lg glass-card p-8 border border-neon-green/30 shadow-[0_0_50px_rgba(39,245,183,0.1)]"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-neon-green/10 rounded-xl border border-neon-green/20 text-neon-green">
                                <Zap size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-display font-bold text-white">Welcome to Nexus</h2>
                                <p className="text-gray-400">Let's personalize your dashboard.</p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-100 border border-white/5">
                                <div className="w-6 h-6 rounded-full bg-neon-green/20 flex items-center justify-center text-neon-green text-xs">1</div>
                                <span className="text-gray-300">Connecting to Live Analytics Engine...</span>
                                <Check size={16} className="text-neon-green ml-auto" />
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-100 border border-white/5">
                                <div className="w-6 h-6 rounded-full bg-neon-green/20 flex items-center justify-center text-neon-green text-xs">2</div>
                                <span className="text-gray-300">Analyzing Historic Traffic Patterns...</span>
                                <Check size={16} className="text-neon-green ml-auto" />
                            </div>
                        </div>

                        <button
                            onClick={handleComplete}
                            className="w-full bg-gradient-to-r from-neon-green to-emerald-500 text-black font-bold py-3 rounded-xl hover:shadow-[0_0_20px_rgba(39,245,183,0.4)] transition-all flex items-center justify-center gap-2"
                        >
                            Launch Dashboard <ArrowRight size={18} />
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
