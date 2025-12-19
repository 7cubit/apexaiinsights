import { motion } from 'framer-motion';
import { Award, Clock, Eye } from 'lucide-react';

interface Author {
    author_id: number;
    name: string;
    total_views: number;
    avg_time: number;
    score: number;
}

// Mock Data (matches backend fallback)
const MOCK_AUTHORS: Author[] = [
    { author_id: 3, name: 'Jane Smith', total_views: 3400, avg_time: 230, score: 782000 },
    { author_id: 1, name: 'Sarah Connor', total_views: 1250, avg_time: 145, score: 181250 },
    { author_id: 2, name: 'John Doe', total_views: 980, avg_time: 65, score: 63700 },
];

interface AuthorLeaderboardWidgetProps {
    range?: string;
}

export const AuthorLeaderboardWidget = ({ range = '7d' }: AuthorLeaderboardWidgetProps) => {
    // In real app, fetch from /v1/analysis/authors
    const authors = MOCK_AUTHORS;

    return (
        <div className="glass-panel p-6 rounded-2xl border border-white/5 h-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 rounded-lg">
                        <Award className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Author Leaderboard</h3>
                        <p className="text-xs text-gray-400">Ranked by Engagement ({range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'})</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {authors.map((author, index) => (
                    <motion.div
                        key={author.author_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-amber-500/30 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`
                flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm
                ${index === 0 ? 'bg-amber-500 text-black' :
                                    index === 1 ? 'bg-gray-400 text-black' :
                                        index === 2 ? 'bg-orange-700 text-white' : 'bg-white/10 text-gray-400'}
              `}>
                                #{index + 1}
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-200">{author.name}</h4>
                                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                    <span className="flex items-center gap-1">
                                        <Eye className="w-3 h-3" /> {author.total_views.toLocaleString()} views
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {Math.round(author.avg_time)}s avg
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="text-lg font-bold text-white">{Math.round(author.score / 1000)}k</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest">Score</div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
