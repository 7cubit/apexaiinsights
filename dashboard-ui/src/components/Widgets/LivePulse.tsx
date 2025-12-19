import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

interface LivePulseProps {
    onlineCount?: number;
    isLoading?: boolean;
}

export default function LivePulse({ onlineCount = 0, isLoading = false }: LivePulseProps) {

    return (
        <div className="glass-card relative overflow-hidden h-[400px] flex flex-col">
            <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                    <h3 className="text-white font-display font-medium text-lg flex items-center gap-2">
                        <Activity className="text-neon-green" size={20} />
                        Live Activity
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">Real-time active sessions</p>
                </div>
                <div className="px-2 py-1 rounded-md bg-neon-green/10 border border-neon-green/20">
                    <span className="text-xs font-bold text-neon-green uppercase tracking-wider">Live</span>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                <div className="relative">
                    {/* Outer Ripple */}
                    <motion.div
                        animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                        className="absolute inset-0 bg-neon-green/20 rounded-full blur-xl"
                    />

                    {/* Inner Glow */}
                    <div className="w-40 h-40 rounded-full bg-midnight-light border border-white/10 flex items-center justify-center shadow-neon-green relative z-10">
                        <div className="text-center">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                key={onlineCount}
                                className="text-5xl font-display font-bold text-white tracking-tighter"
                            >
                                {isLoading ? (
                                    <span className="animate-pulse text-gray-600">--</span>
                                ) : (
                                    onlineCount
                                )}
                            </motion.div>
                            <span className="text-gray-400 text-sm font-medium mt-1 block">Active Users</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Decorative Background Graph */}
            <div className="absolute bottom-0 left-0 w-full h-32 opacity-20 pointer-events-none">
                <svg className="w-full h-full" preserveAspectRatio="none">
                    <path d="M0,32L48,37.3C96,43,192,53,288,58.7C384,64,480,64,576,58.7C672,53,768,43,864,42.7C960,43,1056,53,1152,53.3C1248,53,1344,43,1392,37.3L1440,32L1440,128L1392,128C1344,128,1248,128,1152,128C1056,128,960,128,864,128C768,128,672,128,576,128C480,128,384,128,288,128C192,128,96,128,48,128L0,128Z" fill="url(#grad)" />
                    <defs>
                        <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#00f2ea', stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: '#00f2ea', stopOpacity: 0 }} />
                        </linearGradient>
                    </defs>
                </svg>
            </div>
        </div>
    );
}
