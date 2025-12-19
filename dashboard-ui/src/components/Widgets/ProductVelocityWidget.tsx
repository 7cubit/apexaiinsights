import { Zap } from 'lucide-react';

export default function ProductVelocityWidget() {
    const products = [
        { name: 'Neon Cyber Deck', velocity: 12.5, trend: 'up' }, // sold per hour
        { name: 'Holo-Visor V2', velocity: 8.2, trend: 'stable' },
        { name: 'Quantum Chip', velocity: 4.1, trend: 'down' },
    ];

    return (
        <div className="glass-card p-6 border border-white/5 h-full">
            <h3 className="text-gray-400 text-sm font-medium mb-4 flex items-center gap-2">
                <Zap size={16} className="text-blue-400" />
                Product Velocity (Units/Hr)
            </h3>

            <div className="space-y-4">
                {products.map((p) => (
                    <div key={p.name} className="bg-surface-200/50 p-3 rounded-lg border border-white/5 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-sm text-white font-medium">{p.name}</span>
                            <div className="h-1 w-24 bg-surface-100 rounded-full mt-2 overflow-hidden">
                                <div style={{ width: `${(p.velocity / 15) * 100}%` }} className="h-full bg-blue-500 relative">
                                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-bold text-white font-mono">{p.velocity}</div>
                            <div className="text-[10px] text-gray-500">/hr</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
