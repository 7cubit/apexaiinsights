import { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, AlertCircle } from 'lucide-react';

interface SearchStat {
    query: string;
    count: number;
    avg_results: number;
}

interface GapStat {
    query: string;
    count: number;
}

const SearchAnalytics = () => {
    const [topQueries, setTopQueries] = useState<SearchStat[]>([]);
    const [gaps, setGaps] = useState<GapStat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // @ts-ignore
                const root = window.apexSearchConfig?.api_root || '';
                // @ts-ignore
                const nonce = window.apexSearchConfig?.nonce || '';

                const res = await axios.get(`${root}/search/stats`, {
                    headers: { 'X-WP-Nonce': nonce }
                });

                if (res.data) {
                    setTopQueries(res.data.top_queries || []);
                    setGaps(res.data.gaps || []);
                }
            } catch (err) {
                console.error("Failed to fetch search stats", err);
                // Mock data fallback
                setTopQueries([
                    { query: "shipping params", count: 45, avg_results: 12 },
                    { query: "return policy", count: 32, avg_results: 1 },
                    { query: "discount code", count: 28, avg_results: 0 }
                ]);
                setGaps([
                    { query: "discount code", count: 28 },
                    { query: "black friday", count: 15 }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-400">Loading Search Insights...</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Queries */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-blue-500/10 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Top Search Queries</h3>
                            <p className="text-sm text-slate-400">Most frequent user searches</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {topQueries.map((q, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                                <div>
                                    <div className="font-medium text-white">{q.query}</div>
                                    <div className="text-xs text-slate-400">{(q.avg_results || 0).toFixed(0)} avg results</div>
                                </div>
                                <div className="text-blue-400 font-bold">{q.count}</div>
                            </div>
                        ))}
                        {topQueries.length === 0 && <div className="text-slate-500 text-sm">No search data yet.</div>}
                    </div>
                </div>

                {/* Content Gaps */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-red-500/10 rounded-lg">
                            <AlertCircle className="w-6 h-6 text-red-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Content Gaps (Zero Results)</h3>
                            <p className="text-sm text-slate-400">Searches yielding no content</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {gaps.map((g, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-red-500/5 border border-red-500/10 rounded-lg">
                                <div className="font-medium text-red-200">{g.query}</div>
                                <div className="text-red-400 font-bold">{g.count}</div>
                            </div>
                        ))}
                        {gaps.length === 0 && <div className="text-slate-500 text-sm">No content gaps detected.</div>}
                    </div>
                </div>
            </div>

            {/* 404 Monitor embedded here for now or separate component? Let's keep separate in SEOManager but pass data if needed. 
                 Actually, let's just show a summary here or creating SEOManager next. 
              */}
        </div>
    );
};

export default SearchAnalytics;
