import { useState, useEffect } from 'react';
import { Globe, Link2Off, Eye, AlertTriangle, ArrowDownRight, BookOpen, Search, UserCheck } from 'lucide-react';
import { metricsApi } from '../../services/api';

interface ContentDecay {
    post_id: number;
    title: string;
    current_views: number;
    previous_views: number;
    change_pct: number;
    slug: string;
}

interface Cannibalization {
    keyword: string;
    urls: string[];
    positions: number[];
    lost_clicks: number;
}

interface Readability {
    skimmers: number;
    readers: number;
    casual: number;
}

interface Recent404 {
    url: string;
    referrer: string;
    count: number;
}

interface SEOManagerProps {
    range: string;
}

const SEOManager = ({ range }: SEOManagerProps) => {
    const [decay, setDecay] = useState<ContentDecay[]>([]);
    const [cannibalization, setCannibalization] = useState<Cannibalization[]>([]);
    const [readability, setReadability] = useState<Readability | null>(null);
    const [recent404s, setRecent404s] = useState<Recent404[]>([]);
    const [loading, setLoading] = useState(true);

    // SERP Preview State
    const [title, setTitle] = useState("AI-Powered SEO Insights | Apex Intelligence");
    const [desc, setDesc] = useState("Unlock the truth behind your traffic. Apex AI Insights identifies content decay, keyword cannibalization, and readability gaps in real-time.");
    const [slug] = useState("seo-intelligence");

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [decayData, cannData, readData, searchData] = await Promise.all([
                    metricsApi.getContentDecay(),
                    metricsApi.getCannibalizationStats(),
                    metricsApi.getReadabilityStats(),
                    metricsApi.getSearchStats(range)
                ]);

                setDecay(decayData || []);
                setCannibalization(cannData || []);
                setReadability(readData || { skimmers: 0, readers: 0, casual: 0 });
                setRecent404s(searchData.recent_404s || []);
            } catch (err) {
                console.error("Failed to fetch SEO stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [range]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-medium animate-pulse">Running SEO Intelligence Audit...</p>
        </div>
    );

    const totalAudience = (readability?.readers || 0) + (readability?.skimmers || 0) + (readability?.casual || 0) || 1;
    const readerPct = Math.round(((readability?.readers || 0) / totalAudience) * 100);
    const skimmerPct = Math.round(((readability?.skimmers || 0) / totalAudience) * 100);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Top Row: Readability & Cannibalization */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Readability Distribution */}
                <div className="lg:col-span-1 bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-white/5 shadow-2xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-indigo-500/10 rounded-xl">
                            <BookOpen className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white tracking-tight">Readability</h3>
                            <p className="text-sm text-slate-400">Audience intent distribution</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                                <span className="text-emerald-400">Deep Readers</span>
                                <span className="text-slate-300">{readerPct}%</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: `${readerPct}%` }} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                                <span className="text-amber-400">Quick Skimmers</span>
                                <span className="text-slate-300">{skimmerPct}%</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500" style={{ width: `${skimmerPct}%` }} />
                            </div>
                        </div>
                        <div className="pt-4 border-t border-white/5 flex items-center gap-3 text-xs text-slate-400 italic leading-relaxed">
                            <UserCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            <span>AI detected {readability?.readers || 0} users thoroughly reading core content.</span>
                        </div>
                    </div>
                </div>

                {/* Keyword Cannibalization */}
                <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-white/5 shadow-2xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-rose-500/10 rounded-xl">
                            <AlertTriangle className="w-6 h-6 text-rose-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white tracking-tight">Keyword Cannibalization</h3>
                            <p className="text-sm text-slate-400">Competing pages ranking for same terms</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {cannibalization.map((c, idx) => (
                            <div key={idx} className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-4 hover:bg-rose-500/10 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="font-bold text-rose-200">"{c.keyword}"</div>
                                    <div className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-black uppercase">Conflict Detected</div>
                                </div>
                                <div className="space-y-1">
                                    {c.urls.map((url, uidx) => (
                                        <div key={uidx} className="flex items-center gap-2 text-xs text-slate-400">
                                            <Search className="w-3 h-3 opacity-50" />
                                            <span className="truncate">{url}</span>
                                            <span className="text-slate-500 ml-auto">Pos: {c.positions[uidx]}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Decay Section */}
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-white/5 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-orange-500/10 rounded-xl">
                        <ArrowDownRight className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white tracking-tight">Content Decay Monitor</h3>
                        <p className="text-sm text-slate-400">High-priority pages losing traffic (30-day Comparison)</p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-white/5">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/[0.03] text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                            <tr>
                                <th className="px-4 py-3">Decaying Page</th>
                                <th className="px-4 py-3 text-right">Prev 30d</th>
                                <th className="px-4 py-3 text-right">Current</th>
                                <th className="px-4 py-3 text-right text-orange-400">Loss %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {decay.map((item, idx) => (
                                <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-4 py-4">
                                        <div className="font-semibold text-slate-200 group-hover:text-white">{item.title}</div>
                                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.slug}</div>
                                    </td>
                                    <td className="px-4 py-4 text-right text-slate-400 font-mono">{item.previous_views}</td>
                                    <td className="px-4 py-4 text-right text-slate-200 font-mono font-bold">{item.current_views}</td>
                                    <td className="px-4 py-4 text-right font-black text-orange-400 bg-orange-400/5">
                                        {item.change_pct.toFixed(1)}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* SERP Preview & 404 Monitor Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* SERP Preview Tool */}
                <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-white/5 shadow-2xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-emerald-500/10 rounded-xl">
                            <Eye className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white tracking-tight">SERP Simulator Pro</h3>
                            <p className="text-sm text-slate-400">Optimize search appearance instantly</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] uppercase font-black tracking-widest text-slate-500 mb-2">Meta Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    />
                                    <div className="flex justify-between mt-2">
                                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Ideal: 50–60 chars</div>
                                        <div className={`text-[10px] font-bold ${title.length > 60 ? 'text-rose-400' : 'text-emerald-500'}`}>{title.length} chars</div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-black tracking-widest text-slate-500 mb-2">Meta Description</label>
                                    <textarea
                                        value={desc}
                                        onChange={(e) => setDesc(e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none h-24 resize-none transition-all"
                                    />
                                    <div className="flex justify-between mt-2">
                                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Ideal: 150–160 chars</div>
                                        <div className={`text-[10px] font-bold ${desc.length > 160 ? 'text-rose-400' : 'text-emerald-500'}`}>{desc.length} chars</div>
                                    </div>
                                </div>
                            </div>

                            {/* Live Preview Card */}
                            <div className="bg-[#f8f9fa] rounded-2xl p-6 shadow-sm border border-black/5 flex flex-col justify-center">
                                <div className="text-[10px] font-arial text-slate-400 uppercase font-black mb-4 flex items-center gap-2">
                                    <Globe className="w-3 h-3" /> Google Preview
                                </div>
                                <div className="max-w-md font-arial">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm border border-black/5">
                                            <Globe className="w-3 h-3 text-slate-400" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <div className="text-xs text-[#202124] truncate">https://{window.location.hostname}</div>
                                            <div className="text-[11px] text-[#5f6368] truncate">› {slug}</div>
                                        </div>
                                    </div>
                                    <div className="text-[20px] text-[#1a0dab] font-normal leading-tight hover:underline cursor-pointer mb-1 line-clamp-2">
                                        {title}
                                    </div>
                                    <div className="text-sm text-[#4d5156] leading-relaxed line-clamp-3">
                                        {desc}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 404 Integration */}
                <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-white/5 shadow-2xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-rose-500/10 rounded-xl">
                            <Link2Off className="w-6 h-6 text-rose-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white tracking-tight">404 Health Monitor</h3>
                            <p className="text-sm text-slate-400">Broken links impacting SEO authority</p>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-white/5">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/[0.03] text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                                <tr>
                                    <th className="px-4 py-3">URL</th>
                                    <th className="px-4 py-3 text-right">Referrer</th>
                                    <th className="px-4 py-3 text-right">Hits</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {recent404s.slice(0, 5).map((log, idx) => (
                                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-4 py-3 font-mono text-rose-300 truncate max-w-[150px]">{log.url}</td>
                                        <td className="px-4 py-3 text-right text-slate-500 text-xs truncate max-w-[120px]">{log.referrer || 'Direct'}</td>
                                        <td className="px-4 py-3 text-right font-bold text-rose-400">{log.count}</td>
                                    </tr>
                                ))}
                                {recent404s.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-10 text-center text-slate-600 italic">No healthy link issues found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SEOManager;
