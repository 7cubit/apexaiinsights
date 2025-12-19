import { AlertTriangle, ShoppingCart, User } from 'lucide-react';

export default function WhaleWatchWidget() {
    // Mock Real-time Data
    const whales = [
        { id: 1, time: '2m ago', value: 1250.00, items: 12, customer: 'guest_8b2...' },
        { id: 2, time: '14m ago', value: 890.50, items: 5, customer: 'vip_alex' },
    ];

    return (
        <div className="glass-card p-6 border border-white/5 h-full">
            <h3 className="text-gray-400 text-sm font-medium mb-4 flex items-center gap-2">
                <AlertTriangle size={16} className="text-yellow-400" />
                Whale Watch (Active Carts &gt;$500)
            </h3>

            <div className="space-y-3">
                {whales.map((whale) => (
                    <div key={whale.id} className="bg-surface-200/50 p-3 rounded-lg border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-yellow-400/10 flex items-center justify-center text-yellow-400">
                                <ShoppingCart size={14} />
                            </div>
                            <div>
                                <div className="text-white font-medium">${whale.value.toLocaleString()}</div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <User size={10} /> {whale.customer} • {whale.items} items
                                </div>
                            </div>
                        </div>
                        <div className="text-xs text-gray-500 font-mono">{whale.time}</div>
                    </div>
                ))}

                {whales.length === 0 && (
                    <div className="text-center text-gray-500 py-8 text-sm">
                        No whales detected yet...
                    </div>
                )}
            </div>
        </div>
    );
}
