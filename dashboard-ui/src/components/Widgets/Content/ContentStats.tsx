import { motion } from 'framer-motion';
import { FileText, Clock, TrendingDown, Trophy } from 'lucide-react';

interface ContentStatsProps {
    range?: string;
}

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    subtext: string;
    trend?: 'up' | 'down' | 'neutral';
    color: string;
}

const StatCard = ({ icon, label, value, subtext, trend, color }: StatCardProps) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all"
    >
        <div className="flex items-start justify-between">
            <div className={`p-2.5 rounded-xl ${color}`}>
                {icon}
            </div>
            {trend && (
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' :
                    trend === 'down' ? 'bg-rose-500/10 text-rose-400' :
                    'bg-gray-500/10 text-gray-400'
                }`}>
                    {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
                </span>
            )}
        </div>
        <div className="mt-4">
            <p className="text-2xl font-bold text-white font-display">{value}</p>
            <p className="text-sm text-gray-400 mt-1">{label}</p>
        </div>
        <p className="text-xs text-gray-500 mt-2">{subtext}</p>
    </motion.div>
);

export const ContentStats = ({ range = '7d' }: ContentStatsProps) => {
    // Mock data - in production, fetch from API
    const stats = {
        totalPosts: 247,
        newThisWeek: 5,
        avgReadTime: '4:32',
        readTimeChange: '+12s',
        decayRate: 12,
        decayingPosts: 3,
        topPost: 'Ultimate AI Guide 2024',
        topPostViews: 14200,
    };

    const periodLabel = range === '7d' ? 'this week' : range === '30d' ? 'this month' : 'this quarter';

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                icon={<FileText className="w-5 h-5 text-neon-blue" />}
                label="Total Posts"
                value={stats.totalPosts}
                subtext={`+${stats.newThisWeek} ${periodLabel}`}
                trend="up"
                color="bg-neon-blue/10"
            />
            <StatCard
                icon={<Clock className="w-5 h-5 text-neon-purple" />}
                label="Avg. Read Time"
                value={stats.avgReadTime}
                subtext={`${stats.readTimeChange} vs last period`}
                trend="up"
                color="bg-neon-purple/10"
            />
            <StatCard
                icon={<TrendingDown className="w-5 h-5 text-rose-400" />}
                label="Decay Rate"
                value={`${stats.decayRate}%`}
                subtext={`${stats.decayingPosts} posts declining`}
                trend="down"
                color="bg-rose-500/10"
            />
            <StatCard
                icon={<Trophy className="w-5 h-5 text-amber-400" />}
                label="Top Performer"
                value={(stats.topPostViews / 1000).toFixed(1) + 'k'}
                subtext={stats.topPost.length > 25 ? stats.topPost.slice(0, 25) + '...' : stats.topPost}
                trend="up"
                color="bg-amber-500/10"
            />
        </div>
    );
};

export default ContentStats;
