import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Users, MousePointer2, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';
import { metricsApi } from '../../services/api';

interface KPICardProps {
    range?: string;
}

interface KPIData {
    total_revenue: number;
    revenue_change: string;
    active_traffic: number;
    traffic_change: string;
    recovered_traffic: number;
    bounce_rate: number;
}

const config = (window as any).apexConfig || {};

export default function KPICards({ range = '7d' }: KPICardProps) {
    const [data, setData] = useState<KPIData | null>(range === '7d' ? config.initialKPI : null);
    const [isLoading, setIsLoading] = useState(range === '7d' ? !config.initialKPI : true);

    useEffect(() => {
        const fetchKPIs = async () => {
            setIsLoading(true);
            try {
                const result = await metricsApi.getKPIStats(range);
                setData(result);
            } catch (error) {
                console.error('Failed to fetch KPI data:', error);
                // Fallback to mock data on error if we don't have better data
                if (!data) {
                    setData({
                        total_revenue: 12450,
                        revenue_change: '+12.5%',
                        active_traffic: 8249,
                        traffic_change: '+24.2%',
                        recovered_traffic: 1242,
                        bounce_rate: 42.3,
                    });
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchKPIs();
    }, [range]);

    if (isLoading || !data) {
        return (
            <>
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="glass-card animate-pulse">
                        <div className="h-12 w-12 bg-white/5 rounded-xl mb-4"></div>
                        <div className="h-4 w-24 bg-white/5 rounded mb-2"></div>
                        <div className="h-8 w-32 bg-white/5 rounded"></div>
                    </div>
                ))}
            </>
        );
    }

    const kpiItems = [
        {
            label: 'Total Revenue',
            value: `$${data.total_revenue.toLocaleString()}`,
            change: data.revenue_change,
            trend: data.revenue_change.startsWith('+') ? 'up' as const : 'down' as const,
            icon: DollarSign,
            color: 'text-neon-green',
        },
        {
            label: 'Active Traffic',
            value: data.active_traffic.toLocaleString(),
            change: data.traffic_change,
            trend: data.traffic_change.startsWith('+') ? 'up' as const : 'down' as const,
            icon: Users,
            color: 'text-neon-blue',
        },
        {
            label: 'Recovered Traffic',
            value: data.recovered_traffic.toLocaleString(),
            change: 'Ad-Block',
            trend: 'up' as const,
            icon: ShieldCheck,
            color: 'text-neon-green',
        },
        {
            label: 'Bounce Rate',
            value: `${data.bounce_rate.toFixed(1)}%`,
            change: data.bounce_rate < 50 ? '-2.1%' : '+1.5%',
            trend: data.bounce_rate < 50 ? 'down' as const : 'up' as const,
            icon: MousePointer2,
            color: 'text-neon-purple',
        },
    ];

    return (
        <>
            {kpiItems.map((item, index) => (
                <div key={index} className="glass-card group hover:-translate-y-1 transition-transform duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className={clsx("p-3 rounded-xl bg-white/5", item.color)}>
                            <item.icon size={24} />
                        </div>
                        <div className={clsx(
                            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border",
                            item.label === 'Bounce Rate'
                                ? (item.trend === 'down' ? "text-neon-green border-neon-green/20 bg-neon-green/10" : "text-red-400 border-red-400/20 bg-red-400/10")
                                : (item.trend === 'up' ? "text-neon-green border-neon-green/20 bg-neon-green/10" : "text-red-400 border-red-400/20 bg-red-400/10")
                        )}>
                            {item.label === 'Bounce Rate'
                                ? (item.trend === 'down' ? <TrendingDown size={12} /> : <TrendingUp size={12} />)
                                : (item.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />)
                            }
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
