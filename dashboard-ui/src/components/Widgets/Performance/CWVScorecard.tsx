import React from 'react';
import { Activity, Zap } from 'lucide-react';

interface MetricProps {
    label: string;
    value: number;
    unit: string;
    score: 'good' | 'needs-improvement' | 'poor';
    desc: string;
}

const MetricCard: React.FC<MetricProps> = ({ label, value, unit, score, desc }) => {
    const getColor = (s: string) => {
        if (s === 'good') return 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10';
        if (s === 'needs-improvement') return 'text-amber-400 border-amber-500/50 bg-amber-500/10';
        return 'text-red-400 border-red-500/50 bg-red-500/10';
    };

    return (
        <div className={`p-4 rounded-lg border backdrop-blur-sm ${getColor(score)} h-full`}>
            <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-sm opacity-90">{label}</h4>
                <Activity className="h-4 w-4 opacity-50" />
            </div>
            <div className="text-3xl font-bold mb-1">
                {value}<span className="text-sm font-normal opacity-70 ml-1">{unit}</span>
            </div>
            <p className="text-xs opacity-70">{desc}</p>
        </div>
    );
};

const CWVScorecard: React.FC = () => {
    const [stats, setStats] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        // @ts-ignore
        const apiRoot = window.apexConfig?.tunnel_url || '/apex/v1/tunnel';
        fetch(`${apiRoot}?path=/v1/performance/stats`)
            .then(res => res.json())
            .then(data => setStats(data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const getScore = (val: number, good: number, ni: number) => {
        if (val <= good) return 'good';
        if (val <= ni) return 'needs-improvement';
        return 'poor';
    };

    if (loading) {
        return (
            <div className="glass-card p-6 border border-white/10 bg-black/20 backdrop-blur-md rounded-lg min-h-[200px]">
                <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2 opacity-50">
                    <Zap className="h-5 w-5 text-yellow-400" />
                    Core Web Vitals (Live RUM)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="p-4 rounded-lg border border-white/5 bg-white/5 h-[120px] animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="glass-card p-6 border border-white/10 bg-black/20 backdrop-blur-md rounded-lg">
            <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                Core Web Vitals (Live RUM)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                    label="Largest Contentful Paint"
                    value={stats?.avg_lcp ? Math.round(stats.avg_lcp) : 0}
                    unit="ms"
                    score={getScore(stats?.avg_lcp || 0, 2500, 4000)}
                    desc="Time to render main content."
                />
                <MetricCard
                    label="Cumulative Layout Shift"
                    value={stats?.avg_cls ? parseFloat(stats.avg_cls.toFixed(3)) : 0}
                    unit=""
                    score={getScore(stats?.avg_cls || 0, 0.1, 0.25)}
                    desc="Visual stability of the page."
                />
                <MetricCard
                    label="Interaction to Next Paint"
                    value={stats?.avg_inp ? Math.round(stats.avg_inp) : 0}
                    unit="ms"
                    score={getScore(stats?.avg_inp || 0, 200, 500)}
                    desc="Responsiveness to user input."
                />
            </div>
        </div>
    );
};

export default CWVScorecard;
