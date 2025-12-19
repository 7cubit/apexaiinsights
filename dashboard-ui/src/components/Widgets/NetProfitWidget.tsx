import { DollarSign, TrendingUp, ShoppingBag, CreditCard } from 'lucide-react';

export default function NetProfitWidget() {
    const config = (window as any).apexConfig || {};
    const currentPlan = (config.plan || 'pro').toLowerCase();
    const isLocked = currentPlan === 'plus';

    const metrics = {
        revenue: 12500.00,
        cogs: 4500.00,
        fees: 1250.00, // Gateway + Shipping Est
        netProfit: 6750.00,
        margin: 54
    };

    return (
        <div className="glass-card p-6 border border-white/5 relative overflow-hidden group">
            {isLocked && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-midnight/40 backdrop-blur-[6px] p-6 text-center">
                    <DollarSign size={32} className="text-neon-green mb-3 opacity-50" />
                    <h4 className="text-white font-bold text-sm mb-1">Financial Intelligence Locked</h4>
                    <p className="text-[10px] text-gray-300 px-4">Upgrade to **Pro** to track COGS, Gateway Fees, and True Net Profit maps.</p>
                </div>
            )}

            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${isLocked ? 'blur-sm' : ''}`}>
                <DollarSign size={80} className="text-neon-green" />
            </div>

            <div className={`${isLocked ? 'blur-md opacity-30 select-none' : ''}`}>
                <h3 className="text-gray-400 text-sm font-medium mb-4 flex items-center gap-2">
                    <TrendingUp size={16} className="text-neon-green" />
                    True Net Profit
                </h3>

                <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-4xl font-display font-bold text-white">${metrics.netProfit.toLocaleString()}</span>
                    <span className="text-neon-green text-sm font-medium">+{metrics.margin}% margin</span>
                </div>

                <div className="space-y-3">
                    {/* Progress Bar Stack */}
                    <div className="h-2 w-full bg-surface-100 rounded-full overflow-hidden flex">
                        <div style={{ width: '36%' }} className="h-full bg-red-500/50" title="COGS (36%)" />
                        <div style={{ width: '10%' }} className="h-full bg-yellow-500/50" title="Fees (10%)" />
                        <div style={{ width: '54%' }} className="h-full bg-neon-green" title="Profit (54%)" />
                    </div>

                    {/* Legend */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="p-2 rounded bg-surface-100 border border-white/5">
                            <div className="text-gray-500 mb-1 flex items-center gap-1"><ShoppingBag size={10} /> COGS</div>
                            <div className="text-white font-mono">-${metrics.cogs.toLocaleString()}</div>
                        </div>
                        <div className="p-2 rounded bg-surface-100 border border-white/5">
                            <div className="text-gray-500 mb-1 flex items-center gap-1"><CreditCard size={10} /> Fees</div>
                            <div className="text-white font-mono">-${metrics.fees.toLocaleString()}</div>
                        </div>
                        <div className="p-2 rounded bg-neon-green/10 border border-neon-green/20">
                            <div className="text-neon-green mb-1 flex items-center gap-1"><DollarSign size={10} /> Net</div>
                            <div className="text-white font-mono">${metrics.netProfit.toLocaleString()}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
