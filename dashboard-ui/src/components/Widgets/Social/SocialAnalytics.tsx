import React from 'react';
import CampaignBuilder from './CampaignBuilder';
import SentimentGauge from './SentimentGauge';
import { Share2, MessageCircle, Users, Loader2 } from 'lucide-react';
import { metricsApi } from '../../../services/api';

const SocialAnalytics: React.FC = () => {
    const [stats, setStats] = React.useState<any>(null);
    const [darkSocial, setDarkSocial] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const loadData = async () => {
            try {
                const [s, d] = await Promise.all([
                    metricsApi.getSocialStats(),
                    metricsApi.getDarkSocial()
                ]);
                setStats(s);
                setDarkSocial(d);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-blue-400" size={48} />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Decrypting Social Signals</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pt-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                        Social Intelligence
                    </h2>
                    <p className="text-gray-400 mt-1">
                        Track viral loops, brand sentiment, and campaign performance.
                    </p>
                </div>
            </div>

            {/* Top Row */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="glass-card p-6 border border-white/10 bg-black/20 backdrop-blur-md rounded-lg">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="text-sm font-medium text-gray-300">Viral K-Factor</h3>
                        <Share2 className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white">{stats?.k_factor || '0.0'}</div>
                        <p className="text-xs text-emerald-400">Viral Growth Co-efficient</p>
                    </div>
                </div>
                <div className="glass-card p-6 border border-white/10 bg-black/20 backdrop-blur-md rounded-lg">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="text-sm font-medium text-gray-300">Dark Social Traffic</h3>
                        <Users className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white">{darkSocial?.dark_social_traffic?.toLocaleString() || '0'}</div>
                        <p className="text-xs text-gray-500">Direct traffic to deep links</p>
                    </div>
                </div>
                <div className="glass-card p-6 border border-white/10 bg-black/20 backdrop-blur-md rounded-lg">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="text-sm font-medium text-gray-300">Brand Mentions</h3>
                        <MessageCircle className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white">
                            {stats ? `${Math.round((Number(stats.positive) / (Number(stats.total) || 1)) * 100)}%` : <Loader2 className="h-4 w-4 animate-spin" />}
                        </div>
                        <p className="text-xs text-emerald-400 flex items-center">
                            {stats ? `Based on ${stats.total} mentions` : 'Analyzing sentiment...'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Gauge */}
                <div className="col-span-1">
                    <SentimentGauge stats={stats} loading={loading} />
                </div>

                {/* Campaign Builder */}
                <div className="col-span-1 lg:col-span-2">
                    <CampaignBuilder />
                </div>
            </div>
        </div>
    );
};

export default SocialAnalytics;
