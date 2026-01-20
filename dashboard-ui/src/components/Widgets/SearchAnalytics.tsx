import { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, Search, HelpCircle, Terminal, ExternalLink, Globe } from 'lucide-react';
import { metricsApi } from '../../services/api';

interface SearchStat {
    query: string;
    count: number;
    avg_results: number;
}

interface GapStat {
    query: string;
    count: number;
}

interface Log404 {
    url: string;
    referrer: string;
    count: number;
}

interface SearchAnalyticsProps {
    range: string;
}

const SearchAnalytics = ({ range }: SearchAnalyticsProps) => {
    const [topQueries, setTopQueries] = useState<SearchStat[]>([]);
    const [gaps, setGaps] = useState<GapStat[]>([]);
    const [recent404s, setRecent404s] = useState<Log404[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [aiAnswers, setAiAnswers] = useState<Record<string, string>>({});
    const [answering, setAnswering] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const data = await metricsApi.getSearchStats(range);
                setTopQueries(data.top_queries || []);
                setGaps(data.gaps || []);
                setRecent404s(data.recent_404s || []);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch search stats", err);
                setError("Disconnected from Intelligence Engine.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [range]);

    const handleAskAI = async (query: string) => {
        if (answering[query]) return;
        setAnswering(prev => ({ ...prev, [query]: true }));
        try {
            const res = await metricsApi.askPerplexity(query);
            setAiAnswers(prev => ({ ...prev, [query]: res.answer }));
        } catch (err) {
            setAiAnswers(prev => ({ ...prev, [query]: "Failed to reach AI Brain. Check API config." }));
        } finally {
            setAnswering(prev => ({ ...prev, [query]: false }));
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-medium animate-pulse">Analyzing Search Behavior...</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Queries */}
                <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-white/5 shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-500/10 rounded-xl">
                                <TrendingUp className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white tracking-tight">Top Search Queries</h3>
                                <p className="text-sm text-slate-400">Winning keywords & trends</p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {topQueries.map((q, idx) => (
                            <div key={idx} className="group flex justify-between items-center p-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-xl transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-slate-500 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
                                        #{idx + 1}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-slate-200 group-hover:text-white transition-colors">{q.query}</div>
                                        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{(q.avg_results || 0).toFixed(1)} Avg Results</div>
                                    </div>
                                </div>
                                <div className="text-blue-400 font-mono font-bold bg-blue-400/10 px-2 py-1 rounded text-sm">{q.count}</div>
                            </div>
                        ))}
                        {topQueries.length === 0 && (
                            <div className="py-10 text-center">
                                <Search className="w-12 h-12 text-slate-700 mx-auto mb-3 opacity-20" />
                                <p className="text-slate-500 text-sm">No search data for this range.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Gaps (Zero Results) */}
                <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-white/5 shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-amber-500/10 rounded-xl">
                                <AlertCircle className="w-6 h-6 text-amber-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white tracking-tight">Search Result Gaps</h3>
                                <p className="text-sm text-slate-400">Zero-result blind spots</p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {gaps.map((g, idx) => (
                            <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden transition-all hover:border-amber-500/30">
                                <div className="flex justify-between items-center p-3">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                        <div className="font-bold text-slate-200">{g.query}</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-amber-400 font-mono font-bold text-sm bg-amber-400/10 px-2 py-1 rounded">{g.count} fails</div>
                                        <button
                                            onClick={() => handleAskAI(g.query)}
                                            disabled={answering[g.query]}
                                            className="p-1.5 hover:bg-emerald-500/20 rounded-lg text-emerald-400 transition-colors border border-emerald-500/20"
                                            title="Get AI content suggestion"
                                        >
                                            {answering[g.query] ? <div className="w-4 h-4 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" /> : <HelpCircle className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                {aiAnswers[g.query] && (
                                    <div className="px-3 pb-3 pt-0 border-t border-white/5 mt-1 bg-emerald-500/[0.02]">
                                        <div className="flex gap-2 mt-3 items-start">
                                            <div className="mt-1"><Globe className="w-3 h-3 text-emerald-500" /></div>
                                            <div className="text-xs text-slate-300 leading-relaxed italic pr-2">
                                                {aiAnswers[g.query]}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        {gaps.length === 0 && (
                            <div className="py-10 text-center">
                                <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <AlertCircle className="w-6 h-6 text-emerald-500 opacity-40" />
                                </div>
                                <p className="text-slate-500 text-sm">Perfect! No content gaps found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 404 Monitor Section */}
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-white/5 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-rose-500/10 rounded-xl">
                        <Terminal className="w-6 h-6 text-rose-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white tracking-tight">404 Real-Time Monitor</h3>
                        <p className="text-sm text-slate-400">Detecting broken links and missing assets</p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-white/5">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/[0.03] text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                            <tr>
                                <th className="px-4 py-3">Missing URL</th>
                                <th className="px-4 py-3">Referrer</th>
                                <th className="px-4 py-3 text-right">Hits</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {recent404s.map((log, idx) => (
                                <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-4 py-3 font-mono text-rose-300/80 group-hover:text-rose-300">
                                        <div className="flex items-center gap-2">
                                            <span className="truncate max-w-xs">{log.url}</span>
                                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-40" />
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 font-medium">
                                        <span className="truncate max-w-[200px] block">{log.referrer || 'Direct / Unknown'}</span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-slate-300">
                                        <span className="bg-rose-500/10 px-2 py-0.5 rounded text-rose-400">{log.count}</span>
                                    </td>
                                </tr>
                            ))}
                            {recent404s.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-4 py-10 text-center text-slate-500 italic">
                                        No 404 errors detected in this timeframe. Link health is stable.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SearchAnalytics;
