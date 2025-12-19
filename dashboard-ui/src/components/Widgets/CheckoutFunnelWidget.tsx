import { XCircle } from 'lucide-react';

export default function CheckoutFunnelWidget() {
    // Mock Drop-off Data
    const steps = [
        { name: 'Cart View', count: 1240, dropoff: 0 },
        { name: 'Checkout Start', count: 850, dropoff: 31 },
        { name: 'Shipping Info', count: 620, dropoff: 27 },
        { name: 'Payment Method', count: 410, dropoff: 34 }, // High drop-off
        { name: 'Purchase', count: 380, dropoff: 7 },
    ];

    const maxCount = Math.max(...steps.map(s => s.count));

    return (
        <div className="glass-card p-6 border border-white/5 h-full">
            <h3 className="text-gray-400 text-sm font-medium mb-4 flex items-center gap-2">
                <XCircle size={16} className="text-red-400" />
                Cart Forensic Heatmap
            </h3>

            <div className="space-y-4">
                {steps.map((step, i) => (
                    <div key={step.name} className="relative">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-300">{step.name}</span>
                            <span className="text-gray-500">{step.count} sessions</span>
                        </div>

                        <div className="h-2 w-full bg-surface-100 rounded-full overflow-hidden">
                            <div
                                style={{ width: `${(step.count / maxCount) * 100}%` }}
                                className={`h-full rounded-full ${step.dropoff > 30 ? 'bg-red-500' : 'bg-blue-500'}`}
                            />
                        </div>

                        {i > 0 && (
                            <div className="absolute top-0 right-0 transform translate-x-full ml-2 text-xs text-red-400 font-mono">
                                -{steps[i].dropoff}%
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
