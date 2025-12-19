import { motion } from 'framer-motion';
import { TrendingDown, AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';

interface DecayPost {
    id: number;
    title: string;
    slug: string;
    currentViews: number;
    previousViews: number;
    changePct: number;
}

// Mock Data for Visualization
const MOCK_DECAY_DATA: DecayPost[] = [
    { id: 101, title: 'Top 10 AI Tools for 2024', slug: 'top-ai-tools', currentViews: 1200, previousViews: 1500, changePct: -20 },
    { id: 104, title: 'How to Install WordPress', slug: 'install-wp', currentViews: 450, previousViews: 600, changePct: -25 },
    { id: 112, title: 'SEO Best Practices Guide', slug: 'seo-guide', currentViews: 890, previousViews: 1050, changePct: -15.2 },
];

interface ContentDecayWidgetProps {
    range?: string;
}

export const ContentDecayWidget = ({ range = '7d' }: ContentDecayWidgetProps) => {
    // In real app, fetch from /v1/analysis/decay
    const posts = MOCK_DECAY_DATA;

    return (
        <div className="glass-panel p-6 rounded-2xl border border-white/5 h-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-500/10 rounded-lg">
                        <TrendingDown className="w-5 h-5 text-rose-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Content Decay Radar</h3>
                        <p className="text-xs text-gray-400">Posts losing traction ({range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days'})</p>
                    </div>
                </div>
                <div className="text-xs font-mono text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20">
                    {posts.length} ALERTS
                </div>
            </div>

            <div className="space-y-4">
                {posts.map((post) => (
                    <motion.div
                        key={post.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 bg-black/20 rounded-xl border border-white/5 hover:border-rose-500/30 transition-colors group"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-sm text-gray-200 group-hover:text-rose-300 transition-colors line-clamp-1" title={post.title}>
                                {post.title}
                            </h4>
                            <a href="#" className="text-gray-600 hover:text-white transition-colors">
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-4 text-gray-500">
                                <div>
                                    <span className="block text-[10px] uppercase tracking-wider opacity-60">Last 30d</span>
                                    <span className="text-white font-mono">{post.currentViews}</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] uppercase tracking-wider opacity-60">Prev 30d</span>
                                    <span className="text-gray-400 font-mono">{post.previousViews}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 text-rose-400 font-bold bg-rose-500/5 px-2 py-1 rounded">
                                <TrendingDown className="w-3 h-3" />
                                {post.changePct.toFixed(1)}%
                            </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-500" />
                                Smart Republish Opportunity
                            </span>
                            <button className="text-[10px] flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                                <RefreshCw className="w-3 h-3" />
                                Generate Update Plan
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
