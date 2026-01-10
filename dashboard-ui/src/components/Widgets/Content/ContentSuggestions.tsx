import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Check, ChevronRight, LinkIcon, Calendar, Combine } from 'lucide-react';

interface Suggestion {
    id: number;
    type: 'update' | 'links' | 'merge' | 'refresh';
    title: string;
    description: string;
    postTitle: string;
    priority: 'high' | 'medium' | 'low';
    applied?: boolean;
}

const MOCK_SUGGESTIONS: Suggestion[] = [
    {
        id: 1,
        type: 'update',
        title: 'Update with 2024 Data',
        description: 'The statistics in this post are from 2023. Update with latest figures.',
        postTitle: 'Top 10 AI Tools for 2024',
        priority: 'high',
    },
    {
        id: 2,
        type: 'links',
        title: 'Add Internal Links',
        description: 'This post has no internal links. Add 2-3 relevant links to improve SEO.',
        postTitle: 'How to Install WordPress',
        priority: 'medium',
    },
    {
        id: 3,
        type: 'merge',
        title: 'Consider Merging',
        description: 'Similar to "WordPress Setup Tutorial". Combine to avoid cannibalization.',
        postTitle: 'WordPress Installation Guide',
        priority: 'low',
    },
];

const typeIcons = {
    update: Calendar,
    links: LinkIcon,
    merge: Combine,
    refresh: RefreshCw,
};

const priorityColors = {
    high: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    low: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

export const ContentSuggestions = () => {
    const [suggestions, setSuggestions] = useState<Suggestion[]>(MOCK_SUGGESTIONS);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleApply = (id: number) => {
        setSuggestions(prev =>
            prev.map(s => s.id === id ? { ...s, applied: true } : s)
        );
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            setIsRefreshing(false);
            // In real app, fetch new suggestions from AI
        }, 1500);
    };

    const activeSuggestions = suggestions.filter(s => !s.applied);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 rounded-2xl border border-white/5 h-full"
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-neon-purple/10 rounded-lg">
                        <Sparkles className="w-5 h-5 text-neon-purple" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">AI Suggestions</h3>
                        <p className="text-xs text-gray-400">Powered by Intelligence Engine</p>
                    </div>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {activeSuggestions.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-8"
                        >
                            <Check className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                            <p className="text-gray-400 text-sm">All suggestions applied!</p>
                            <button
                                onClick={handleRefresh}
                                className="mt-3 text-xs text-neon-purple hover:text-neon-purple/80"
                            >
                                Get New Suggestions
                            </button>
                        </motion.div>
                    ) : (
                        activeSuggestions.map((suggestion) => {
                            const Icon = typeIcons[suggestion.type];
                            return (
                                <motion.div
                                    key={suggestion.id}
                                    layout
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="p-4 bg-black/20 rounded-xl border border-white/5 hover:border-neon-purple/30 transition-colors group"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-white/5 rounded-lg mt-0.5">
                                            <Icon className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="text-sm font-medium text-white">{suggestion.title}</h4>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${priorityColors[suggestion.priority]}`}>
                                                    {suggestion.priority}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 mb-2 line-clamp-2">{suggestion.description}</p>
                                            <p className="text-xs text-gray-500 truncate">
                                                📄 {suggestion.postTitle}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleApply(suggestion.id)}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-neon-purple hover:bg-neon-purple/10 rounded-lg transition-all"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default ContentSuggestions;
