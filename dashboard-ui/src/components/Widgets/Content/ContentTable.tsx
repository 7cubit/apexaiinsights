import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ArrowUpDown, ExternalLink, TrendingUp, TrendingDown, Minus, Edit3 } from 'lucide-react';

interface ContentPost {
    id: number;
    title: string;
    slug: string;
    views: number;
    bounceRate: number;
    avgTimeOnPage: number;
    lastUpdated: string;
    status: 'trending' | 'stable' | 'declining';
}

// Mock data
const MOCK_POSTS: ContentPost[] = [
    { id: 1, title: 'Ultimate AI Guide 2024', slug: 'ai-guide-2024', views: 14200, bounceRate: 32, avgTimeOnPage: 285, lastUpdated: '2024-01-05', status: 'trending' },
    { id: 2, title: 'WordPress Performance Tips', slug: 'wp-performance', views: 8750, bounceRate: 41, avgTimeOnPage: 192, lastUpdated: '2024-01-02', status: 'stable' },
    { id: 3, title: 'SEO Best Practices', slug: 'seo-best-practices', views: 6320, bounceRate: 38, avgTimeOnPage: 210, lastUpdated: '2023-12-28', status: 'stable' },
    { id: 4, title: 'Top 10 AI Tools for 2024', slug: 'top-ai-tools', views: 1200, bounceRate: 55, avgTimeOnPage: 95, lastUpdated: '2023-11-15', status: 'declining' },
    { id: 5, title: 'How to Install WordPress', slug: 'install-wp', views: 450, bounceRate: 62, avgTimeOnPage: 78, lastUpdated: '2023-10-20', status: 'declining' },
];

interface ContentTableProps {
    range?: string;
}

const StatusBadge = ({ status }: { status: ContentPost['status'] }) => {
    const config = {
        trending: { icon: TrendingUp, color: 'text-emerald-400 bg-emerald-500/10', label: 'Trending' },
        stable: { icon: Minus, color: 'text-gray-400 bg-gray-500/10', label: 'Stable' },
        declining: { icon: TrendingDown, color: 'text-rose-400 bg-rose-500/10', label: 'Declining' },
    };
    
    const { icon: Icon, color, label } = config[status];
    
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}>
            <Icon className="w-3 h-3" />
            {label}
        </span>
    );
};

export const ContentTable = ({ range: _range = '7d' }: ContentTableProps) => {
    // _range can be used for API calls in production
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'views' | 'bounceRate' | 'avgTimeOnPage'>('views');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const filteredPosts = MOCK_POSTS
        .filter(post => post.title.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            const modifier = sortOrder === 'asc' ? 1 : -1;
            return (a[sortBy] - b[sortBy]) * modifier;
        });

    const handleSort = (column: typeof sortBy) => {
        if (sortBy === column) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('desc');
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-2xl border border-white/5 overflow-hidden"
        >
            {/* Header */}
            <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-white">Content Performance</h3>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search posts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:border-neon-purple/50 focus:outline-none transition-colors"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Post</th>
                            <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Status</th>
                            <th 
                                className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3 cursor-pointer hover:text-white transition-colors"
                                onClick={() => handleSort('views')}
                            >
                                <span className="inline-flex items-center gap-1">
                                    Views
                                    <ArrowUpDown className="w-3 h-3" />
                                </span>
                            </th>
                            <th 
                                className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3 cursor-pointer hover:text-white transition-colors"
                                onClick={() => handleSort('bounceRate')}
                            >
                                <span className="inline-flex items-center gap-1">
                                    Bounce
                                    <ArrowUpDown className="w-3 h-3" />
                                </span>
                            </th>
                            <th 
                                className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3 cursor-pointer hover:text-white transition-colors"
                                onClick={() => handleSort('avgTimeOnPage')}
                            >
                                <span className="inline-flex items-center gap-1">
                                    Time
                                    <ArrowUpDown className="w-3 h-3" />
                                </span>
                            </th>
                            <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPosts.map((post, index) => (
                            <motion.tr
                                key={post.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.05 }}
                                className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                            >
                                <td className="px-5 py-4">
                                    <div>
                                        <p className="text-sm font-medium text-white line-clamp-1">{post.title}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">Updated {post.lastUpdated}</p>
                                    </div>
                                </td>
                                <td className="px-5 py-4">
                                    <StatusBadge status={post.status} />
                                </td>
                                <td className="px-5 py-4 text-right">
                                    <span className="text-sm font-mono text-white">{post.views.toLocaleString()}</span>
                                </td>
                                <td className="px-5 py-4 text-right">
                                    <span className={`text-sm font-mono ${post.bounceRate > 50 ? 'text-rose-400' : 'text-white'}`}>
                                        {post.bounceRate}%
                                    </span>
                                </td>
                                <td className="px-5 py-4 text-right">
                                    <span className="text-sm font-mono text-white">{formatTime(post.avgTimeOnPage)}</span>
                                </td>
                                <td className="px-5 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                                            <ExternalLink className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-white/5 text-xs text-gray-500">
                Showing {filteredPosts.length} of {MOCK_POSTS.length} posts
            </div>
        </motion.div>
    );
};

export default ContentTable;
