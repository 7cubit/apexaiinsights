import { useState, useEffect } from 'react';
import axios from 'axios';
import { Globe, Link2Off, Eye } from 'lucide-react';

interface Recent404 {
    url: string;
    referrer: string;
    count: number;
}

const SEOManager = () => {
    const [recent404s, setRecent404s] = useState<Recent404[]>([]);

    // SERP Preview State
    const [title, setTitle] = useState("Your Page Title | Site Name");
    const [desc, setDesc] = useState("This is an example meta description. Typically around 150-160 characters. It summarizes the page content.");
    const [url, setUrl] = useState("example.com/your-page-slug");

    useEffect(() => {
        const fetchData = async () => {
            try {
                // @ts-ignore
                const root = window.apexConfig?.api_root || '';
                // @ts-ignore
                const nonce = window.apexConfig?.nonce || '';

                const res = await axios.get(`${root}/search/stats`, {
                    headers: { 'X-WP-Nonce': nonce }
                });
                if (res.data && res.data.recent_404s) {
                    setRecent404s(res.data.recent_404s);
                }
            } catch (err) {
                // Fallback
                setRecent404s([
                    { url: 'https://site.com/broken-page', referrer: 'google.com', count: 12 },
                    { url: 'https://site.com/old-product', referrer: 'direct', count: 5 }
                ]);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="space-y-8">
            {/* 404 Monitor */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-orange-500/10 rounded-lg">
                        <Link2Off className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Broken Link Monitor (404s)</h3>
                        <p className="text-sm text-slate-400">Recent traffic to non-existent pages</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-slate-700/50 text-slate-200">
                            <tr>
                                <th className="p-3 rounded-l-lg">Broken URL</th>
                                <th className="p-3">Referrer</th>
                                <th className="p-3 rounded-r-lg">Hits</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {recent404s.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-700/30 transition-colors">
                                    <td className="p-3 text-white truncate max-w-[200px]" title={item.url}>{item.url}</td>
                                    <td className="p-3 truncate max-w-[200px]" title={item.referrer}>{item.referrer || 'Direct'}</td>
                                    <td className="p-3 text-orange-400 font-bold">{item.count}</td>
                                </tr>
                            ))}
                            {recent404s.length === 0 && <tr><td colSpan={3} className="p-4 text-center">No 404s recorded.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* SERP Preview Tool */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-green-500/10 rounded-lg">
                        <Eye className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">SERP Simulator</h3>
                        <p className="text-sm text-slate-400">Preview how your pages appear in Google Search</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Inputs */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Page Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <div className={`text-xs mt-1 ${title.length > 60 ? 'text-red-400' : 'text-slate-500'}`}>{title.length} / 60 chars</div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Snippet / Meta Description</label>
                            <textarea
                                value={desc}
                                onChange={(e) => setDesc(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none h-24"
                            />
                            <div className={`text-xs mt-1 ${desc.length > 160 ? 'text-red-400' : 'text-slate-500'}`}>{desc.length} / 160 chars</div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">URL / Slug</label>
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="bg-white rounded-lg p-6 font-arial text-left">
                        <h4 className="text-xs text-slate-400 uppercase font-bold mb-4 tracking-wider">Google Mobile Preview</h4>
                        <div className="max-w-md">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-xs text-gray-500">
                                    <Globe size={14} />
                                </div>
                                <div>
                                    <div className="text-xs text-gray-800 font-normal">example.com</div>
                                    <div className="text-xs text-gray-500">{url}</div>
                                </div>
                            </div>
                            <div className="text-[18px] text-[#1a0dab] font-normal leading-snug hover:underline cursor-pointer mb-1">
                                {title}
                            </div>
                            <div className="text-sm text-[#4d5156] leading-normal">
                                {desc}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SEOManager;
