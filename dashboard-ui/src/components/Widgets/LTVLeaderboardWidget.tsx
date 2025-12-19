import { Crown } from 'lucide-react';

export default function LTVLeaderboardWidget() {
    const customers = [
        { id: 1, name: 'Alice V.', email: 'alice@example.com', ltv: 12500, orders: 45 },
        { id: 2, name: 'Bob M.', email: 'bob@tech.com', ltv: 8900, orders: 12 },
        { id: 3, name: 'Charlie', email: 'charlie@corp.net', ltv: 7200, orders: 8 },
    ];

    return (
        <div className="glass-card p-6 border border-white/5 h-full">
            <h3 className="text-gray-400 text-sm font-medium mb-4 flex items-center gap-2">
                <Crown size={16} className="text-purple-400" />
                Top LTV Customers
            </h3>

            <div className="space-y-4">
                {customers.map((c, i) => (
                    <div key={c.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold text-xs">
                                {i + 1}
                            </div>
                            <div>
                                <div className="text-white text-sm font-medium">{c.name}</div>
                                <div className="text-xs text-gray-500">{c.orders} orders</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-white font-mono font-bold">${c.ltv.toLocaleString()}</div>
                            <div className="text-[10px] text-gray-500">LTV</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
