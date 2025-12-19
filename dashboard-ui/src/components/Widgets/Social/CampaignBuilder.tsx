import React, { useState } from 'react';
import { Copy, Link as LinkIcon, Check } from 'lucide-react';

const CampaignBuilder: React.FC = () => {
    const [baseUrl, setBaseUrl] = useState('');
    const [source, setSource] = useState('');
    const [medium, setMedium] = useState('');
    const [campaign, setCampaign] = useState('');
    const [generatedUrl, setGeneratedUrl] = useState('');
    const [copied, setCopied] = useState(false);

    const handleGenerate = () => {
        if (!baseUrl || !source) return;

        let url = baseUrl;
        if (!url.startsWith('http')) url = 'https://' + url;

        const params = new URLSearchParams();
        params.append('utm_source', source);
        params.append('utm_medium', medium || 'social'); // Default to social
        params.append('utm_campaign', campaign || 'promo'); // Default to promo

        setGeneratedUrl(`${url}?${params.toString()}`);
        setCopied(false);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="glass-card p-6 border border-white/10 bg-black/20 backdrop-blur-md rounded-lg">
            <h3 className="text-sm font-medium uppercase tracking-widest text-[#00ff9d] mb-4 flex items-center gap-2">
                <LinkIcon size={16} /> Campaign URL Builder
            </h3>

            <div className="grid gap-4">
                <div>
                    <label className="text-xs text-gray-400">Website URL</label>
                    <input
                        className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:border-[#00ff9d] focus:outline-none"
                        placeholder="https://yoursite.com/product"
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs text-gray-400">Source (e.g. twitter)</label>
                        <input
                            className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:border-[#00ff9d] focus:outline-none"
                            placeholder="twitter"
                            value={source}
                            onChange={(e) => setSource(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400">Medium (e.g. social)</label>
                        <input
                            className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:border-[#00ff9d] focus:outline-none"
                            placeholder="social"
                            value={medium}
                            onChange={(e) => setMedium(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400">Campaign (e.g. spring_sale)</label>
                        <input
                            className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:border-[#00ff9d] focus:outline-none"
                            placeholder="spring_sale"
                            value={campaign}
                            onChange={(e) => setCampaign(e.target.value)}
                        />
                    </div>
                </div>

                <button
                    onClick={handleGenerate}
                    className="w-full bg-[#00ff9d]/10 border border-[#00ff9d]/50 text-[#00ff9d] hover:bg-[#00ff9d]/20 py-2 rounded transition-colors font-medium"
                >
                    Generate Tracking Link
                </button>

                {generatedUrl && (
                    <div className="mt-4 p-4 bg-black/50 rounded border border-white/5 relative group">
                        <p className="font-mono text-sm text-gray-300 break-all pr-8">{generatedUrl}</p>
                        <button
                            onClick={handleCopy}
                            className="absolute top-2 right-2 text-gray-400 hover:text-white"
                        >
                            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CampaignBuilder;
