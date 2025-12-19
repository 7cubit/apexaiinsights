import { motion } from 'framer-motion';

export default function GlobalMap() {
    // Mock hotspots
    const hotspots = [
        { x: 200, y: 150, delay: 0 },   // NY
        { x: 380, y: 140, delay: 1.2 }, // London
        { x: 600, y: 200, delay: 0.8 }, // Dubai
        { x: 700, y: 180, delay: 2.1 }, // Mumbai
        { x: 850, y: 250, delay: 1.5 }, // Singapore
        { x: 180, y: 350, delay: 1.8 }, // Sao Paulo
    ];

    return (
        <div className="glass-card h-[400px] relative overflow-hidden group">
            <div className="absolute top-6 left-6 z-10">
                <h3 className="text-white font-display font-semibold text-lg flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                    Live Global Activity
                </h3>
                <p className="text-gray-400 text-sm">Real-time visitor distribution</p>
            </div>

            <div className="absolute inset-0 flex items-center justify-center opacity-40 group-hover:opacity-60 transition-opacity duration-500">
                <svg viewBox="0 0 1000 500" className="w-full h-full text-neon-purple/20 fill-current">
                    <path d="M 50 200 Q 150 50 300 200 T 500 200 T 700 200 T 950 200" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="5 5" className="opacity-20" />
                    {/* Abstract World Map Silhouette (Simplified for effect) */}
                    <path d="M149,165c0,0-19-15-5,0s53,53,68,14s22-49,76-43s54,8,83,7s88,14,103-34s64-24,39,15s-24,83-88,58s-64-5-83,10s-5,54-68,44s-78-44-125-97" fill="currentColor" />
                    {/* Adding more "tech" lines */}
                    <line x1="0" y1="100" x2="1000" y2="100" stroke="currentColor" strokeWidth="0.5" className="opacity-10" />
                    <line x1="0" y1="250" x2="1000" y2="250" stroke="currentColor" strokeWidth="0.5" className="opacity-10" />
                    <line x1="0" y1="400" x2="1000" y2="400" stroke="currentColor" strokeWidth="0.5" className="opacity-10" />
                    <line x1="500" y1="0" x2="500" y2="500" stroke="currentColor" strokeWidth="0.5" className="opacity-10" />
                </svg>
            </div>

            {/* Hotspots */}
            {hotspots.map((spot, i) => (
                <motion.div
                    key={i}
                    className="absolute w-3 h-3 bg-neon-green rounded-full shadow-[0_0_15px_rgba(39,245,183,0.8)]"
                    style={{ left: spot.x, top: spot.y }}
                    animate={{
                        scale: [1, 2, 1],
                        opacity: [0.5, 0, 0.5]
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: spot.delay,
                        ease: "easeInOut"
                    }}
                />
            ))}

            {/* Scanning Line Effect */}
            <motion.div
                className="absolute top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-neon-green/50 to-transparent shadow-[0_0_20px_rgba(39,245,183,0.5)]"
                animate={{ left: ['0%', '100%'] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            />
        </div>
    );
}
