import React, { useEffect, useState } from 'react';
import CWVScorecard from './CWVScorecard';
import { Database, Gauge, Loader2 } from 'lucide-react';

const ScriptImpactList: React.FC<{ impacts: any[] }> = ({ impacts }) => {
    if (!impacts || impacts.length === 0) return <div className="text-gray-500 text-sm">No significant script impact detected.</div>;

    return (
        <div className="space-y-4 w-full">
            <h4 className="text-sm font-medium text-gray-400 uppercase tracking-widest">Resource Impact Analysis</h4>
            {impacts.map((impact, i) => (
                <div key={i} className="flex justify-between items-center p-3 rounded bg-white/5 border border-white/5">
                    <div className="flex-1 min-w-0 mr-4">
                        <p className="text-xs text-blue-400 truncate mb-1">{impact.url}</p>
                        <p className="text-[10px] text-gray-500">{impact.plugin}</p>
                    </div>
                    <div className="text-right">
                        <span className="text-sm font-mono text-red-400">
                            +{(impact.wasted_bytes / 1024).toFixed(1)} KB
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};

const PerformanceAnalytics: React.FC = () => {
    const [psiScore, setPsiScore] = useState<number | null>(null);
    const [scriptImpacts, setScriptImpacts] = useState<any[]>([]);
    const [loadingPsi, setLoadingPsi] = useState(false);
    const [dbStats, setDbStats] = useState<any>(null);
    const [isMock, setIsMock] = useState(false);

    const runScan = () => {
        setLoadingPsi(true);
        setIsMock(false);
        // @ts-ignore
        const apiRoot = window.apexConfig?.tunnel_url || '/apex/v1/tunnel';

        // Use current domain or hardcoded for demo
        const target = window.location.origin;

        fetch(`${apiRoot}?path=/v1/performance/scan&url=${encodeURIComponent(target)}`)
            .then(res => res.json())
            .then(data => {
                if (data.score) setPsiScore(Math.round(data.score));
                if (data.script_impact) setScriptImpacts(data.script_impact);
                if (data.mock) setIsMock(true);
            })
            .catch(err => console.error(err))
            .finally(() => setLoadingPsi(false));
    };

    useEffect(() => {
        // @ts-ignore
        const apiRoot = window.apexConfig?.tunnel_url || '/apex/v1/tunnel';
        fetch(`${apiRoot}?path=/v1/performance/db-health`)
            .then(res => res.json())
            .then(data => setDbStats(data))
            .catch(err => console.error(err));
    }, []);

    return (
        <div className="space-y-6 pt-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                        Speed & Stability
                    </h2>
                    <p className="text-gray-400 mt-1">
                        Real-time performance monitoring and optimization.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {isMock && (
                        <span className="text-xs px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                            Demo Mode: PAGESPEED_API_KEY missing
                        </span>
                    )}
                    <button
                        onClick={runScan}
                        disabled={loadingPsi}
                        className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-md text-sm font-medium text-white transition-colors"
                    >
                        {loadingPsi ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Gauge className="mr-2 h-4 w-4" />}
                        Run Lighthouse Scan
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CWVScorecard />

                {/* PSI Score Box */}
                <div className="glass-card p-6 border border-white/10 bg-black/20 backdrop-blur-md rounded-lg flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" />
                    <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-4">Google Performance Score</h3>
                    {loadingPsi ? (
                        <div className="text-center">
                            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-2 mx-auto" />
                            <p className="text-xs text-blue-400">Analyzing via Google PageSpeed API...</p>
                        </div>
                    ) : psiScore !== null ? (
                        <div className="text-center animate-in zoom-in duration-300">
                            <span className={`text-6xl font-black ${psiScore > 89 ? 'text-emerald-400' : psiScore > 49 ? 'text-amber-400' : 'text-red-400'}`}>
                                {psiScore}
                            </span>
                            <span className="text-2xl text-gray-500">/100</span>
                        </div>
                    ) : (
                        <div className="text-center text-gray-500">
                            <Gauge className="h-12 w-12 opacity-20 mx-auto mb-2" />
                            <p className="text-sm">No recent scan.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 border border-white/10 bg-black/20 backdrop-blur-md rounded-lg md:col-span-1">
                    <h3 className="text-sm font-medium text-gray-300 flex items-center mb-4">
                        <Database className="h-4 w-4 mr-2 text-purple-400" />
                        Database Health
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-white/5">
                            <span className="text-sm text-gray-500">Autoload Size</span>
                            <span className="font-mono text-white">
                                {dbStats ? `${dbStats.autoload_size_mb?.toFixed(2)} MB` : '-'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-white/5">
                            <span className="text-sm text-gray-500">Transients</span>
                            <span className="font-mono text-white">
                                {dbStats ? dbStats.transient_count : '-'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Bloat Status</span>
                            <span className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Healthy
                            </span>
                        </div>
                        {dbStats?.last_updated && (
                            <div className="pt-2 text-[10px] text-gray-600 text-right italic">
                                Last updated: {new Date(dbStats.last_updated).toLocaleTimeString()}
                                {dbStats.cached && " (Cached)"}
                            </div>
                        )}
                    </div>
                </div>

                <div className="glass-card p-6 border border-white/10 bg-black/20 backdrop-blur-md rounded-lg md:col-span-2 flex items-center justify-center">
                    <ScriptImpactList impacts={scriptImpacts} />
                </div>
            </div>
        </div>
    );
};

export default PerformanceAnalytics;
