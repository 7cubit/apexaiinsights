import { TrendingUp, TrendingDown, DollarSign, Users, MousePointer2 } from 'lucide-react';
import clsx from 'clsx';

interface KPICardProps {
    range?: string;
}

const BASE_KPI_DATA = [
    {
        label: 'Total Revenue',
        baseValue: 12450,
        change: '+12.5%',
        trend: 'up' as const,
        icon: DollarSign,
        color: 'text-neon-green',
        prefix: '$'
    },
    {
        label: 'Active Traffic',
        baseValue: 8249,
        change: '+24.2%',
        trend: 'up' as const,
        icon: Users,
        color: 'text-neon-blue'
    },
    {
        label: 'Bounce Rate',
        baseValue: 42.3,
        change: '-2.1%',
        trend: 'down' as const,
        icon: MousePointer2,
        color: 'text-neon-purple',
        suffix: '%'
    },
];

export default function KPICards({ range = '7d' }: KPICardProps) {
    const scale = range === '30d' ? 4.2 : range === '90d' ? 12.5 : 1;

    const kpiData = BASE_KPI_DATA.map(item => {
        let displayValue = "";
        if (item.label === 'Bounce Rate') {
            displayValue = `${item.baseValue}${item.suffix}`;
        } else {
            const scaled = Math.round(item.baseValue * scale);
            displayValue = `${item.prefix || ''}${scaled.toLocaleString()}`;
        }
        return { ...item, value: displayValue };
    });

    return (
        <>
            {kpiData.map((item, index) => (
                <div key={index} className="glass-card group hover:-translate-y-1 transition-transform duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className={clsx("p-3 rounded-xl bg-white/5", item.color)}>
                            <item.icon size={24} />
                        </div>
                        <div className={clsx(
                            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border",
                            item.trend === 'up'
                                ? "text-neon-green border-neon-green/20 bg-neon-green/10"
                                : "text-red-400 border-red-400/20 bg-red-400/10"
                        )}>
                            {item.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {item.change}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-gray-400 text-sm font-medium mb-1">{item.label}</h4>
                        <span className="text-3xl font-display font-bold text-white tracking-tight">{item.value}</span>
                    </div>

                    <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className={clsx("h-full rounded-full w-[70%]", item.color.replace('text-', 'bg-'))} />
                    </div>
                </div>
            ))}
        </>
    );
}
