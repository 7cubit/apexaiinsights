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
    // Mock Data - In real app, fetch from /v1/performance/stats
    // LCP < 2500ms Good
    // CLS < 0.1 Good
    // INP < 200ms Good

    return (
        <div className="glass-card p-6 border border-white/10 bg-black/20 backdrop-blur-md rounded-lg">
            <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                Core Web Vitals (Live RUM)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                    label="Largest Contentful Paint"
                    value={1200}
                    unit="ms"
                    score="good"
                    desc="Time to render main content."
                />
                <MetricCard
                    label="Cumulative Layout Shift"
                    value={0.05}
                    unit=""
                    score="good"
                    desc="Visual stability of the page."
                />
                <MetricCard
                    label="Interaction to Next Paint"
                    value={150}
                    unit="ms"
                    score="good"
                    desc="Responsiveness to user input."
                />
            </div>
        </div>
    );
};

export default CWVScorecard;
