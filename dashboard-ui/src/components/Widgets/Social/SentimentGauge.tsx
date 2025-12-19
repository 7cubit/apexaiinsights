import React, { useEffect, useState } from 'react';
import { Smile, Frown, Meh, Loader } from 'lucide-react';

const SentimentGauge: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // @ts-ignore
        const apiRoot = window.apexConfig?.tunnel_url || '/apex/v1/tunnel';

        fetch(`${apiRoot}?path=/v1/social/stats`)
            .then(res => res.json())
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="glass-card p-6 border border-white/10 bg-black/20 backdrop-blur-md rounded-lg flex items-center justify-center">
            <Loader className="animate-spin text-[#00ff9d]" />
        </div>
    );

    if (!stats) return null;

    const total = stats.total || 1;
    const posPercent = (stats.positive / total) * 100;
    const negPercent = (stats.negative / total) * 100;

    return (
        <div className="glass-card p-6 border border-white/10 bg-black/20 backdrop-blur-md rounded-lg">
            <h3 className="text-sm font-medium uppercase tracking-widest text-[#00ff9d] mb-4 flex items-center gap-2">
                Brand Sentiment
            </h3>

            <div className="flex items-end gap-2 mb-4">
                <span className="text-4xl font-bold text-white">{Math.round(posPercent)}%</span>
                <span className="text-sm text-gray-400 mb-1">Positive</span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden flex mb-6">
                <div style={{ width: `${posPercent}%` }} className="h-full bg-emerald-500" />
                <div style={{ width: `${100 - posPercent - negPercent}%` }} className="h-full bg-gray-500" />
                <div style={{ width: `${negPercent}%` }} className="h-full bg-red-500" />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-emerald-500/10 rounded border border-emerald-500/20">
                    <Smile className="mx-auto h-5 w-5 text-emerald-400 mb-1" />
                    <span className="text-xs text-white">{stats.positive}</span>
                </div>
                <div className="p-2 bg-gray-500/10 rounded border border-gray-500/20">
                    <Meh className="mx-auto h-5 w-5 text-gray-400 mb-1" />
                    <span className="text-xs text-white">{stats.neutral}</span>
                </div>
                <div className="p-2 bg-red-500/10 rounded border border-red-500/20">
                    <Frown className="mx-auto h-5 w-5 text-red-400 mb-1" />
                    <span className="text-xs text-white">{stats.negative}</span>
                </div>
            </div>

            {stats.recent_mentions && (
                <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs text-gray-500 mb-2">Recent Mentions</p>
                    <div className="space-y-2">
                        {stats.recent_mentions.map((m: string, i: number) => (
                            <div key={i} className="text-xs text-gray-300 italic">"{m}"</div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SentimentGauge;
