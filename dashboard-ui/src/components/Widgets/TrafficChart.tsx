import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line } from 'recharts';
import { useState, useEffect } from 'react';
import { Activity, Zap } from 'lucide-react';
import { metricsApi } from '../../services/api';

interface TrafficData {
    time: string;
    visitors: number;
    ga4Users: number; // Added GA4 data
    gscImpressions?: number;
    gscClicks?: number;
}

interface TrafficChartProps {
    range?: string;
}

type ChartMode = 'apex' | 'ga4' | 'hybrid';

export default function TrafficChart({ range = '7d' }: TrafficChartProps) {
    const [data, setData] = useState<TrafficData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [mode, setMode] = useState<ChartMode>('hybrid');
    const [showGSC, setShowGSC] = useState(false);

    useEffect(() => {
        const fetchTraffic = async () => {
            setIsLoading(true);
            try {
                const result = await metricsApi.getTrafficStats(range);
                setData(result.data || []);
            } catch (error) {
                console.error('Failed to fetch traffic data:', error);
                // Fallback to mock data on error
                setData([
                    { time: 'Mon', visitors: 820, ga4Users: 710, gscImpressions: 2400, gscClicks: 72 },
                    { time: 'Tue', visitors: 932, ga4Users: 805, gscImpressions: 2800, gscClicks: 84 },
                    { time: 'Wed', visitors: 901, ga4Users: 780, gscImpressions: 2600, gscClicks: 78 },
                    { time: 'Thu', visitors: 934, ga4Users: 810, gscImpressions: 3100, gscClicks: 92 },
                    { time: 'Fri', visitors: 1290, ga4Users: 1110, gscImpressions: 4200, gscClicks: 140 },
                    { time: 'Sat', visitors: 1330, ga4Users: 1150, gscImpressions: 4500, gscClicks: 150 },
                    { time: 'Sun', visitors: 1320, ga4Users: 1140, gscImpressions: 4300, gscClicks: 145 },
                ]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTraffic();
    }, [range]);

    // Transform data for range shading
    const chartData = data.map(d => ({
        ...d,
        truthGap: [d.ga4Users, d.visitors]
    }));

    const rangeLabel = range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days';

    return (
        <div className="glass-card h-[450px] flex flex-col relative overflow-hidden">
            {/* Visual Flare for Hybrid mode */}
            {mode === 'hybrid' && (
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <Zap size={120} className="text-neon-green" />
                </div>
            )}

            <div className="mb-6 px-2 flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <h3 className="text-white font-display font-semibold text-lg flex items-center gap-2">
                        Unified Truth Traffic
                        {mode === 'hybrid' && <span className="text-[10px] bg-neon-green/20 text-neon-green px-1.5 py-0.5 rounded border border-neon-green/30 uppercase tracking-widest">Hybrid</span>}
                    </h3>
                    <p className="text-gray-400 text-sm">{rangeLabel}</p>
                </div>

                <div className="flex items-center gap-3 self-end">
                    {/* Mode Toggle [Apex | GA4 | HYBRID] */}
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                        <button
                            onClick={() => setMode('apex')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${mode === 'apex' ? 'bg-neon-purple text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                            Apex
                        </button>
                        <button
                            onClick={() => setMode('ga4')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${mode === 'ga4' ? 'bg-gray-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                            GA4
                        </button>
                        <button
                            onClick={() => setMode('hybrid')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${mode === 'hybrid' ? 'bg-neon-green text-black shadow-lg font-bold' : 'text-gray-500 hover:text-white'}`}
                        >
                            <Zap size={12} />
                            Hybrid
                        </button>
                    </div>

                    <button
                        onClick={() => setShowGSC(!showGSC)}
                        className={`text-xs px-3 py-1.5 rounded-xl border transition-colors flex items-center gap-1.5 ${showGSC ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'border-white/10 text-gray-500 hover:text-white'}`}
                    >
                        <Activity size={14} />
                        GSC
                    </button>
                </div>
            </div>

            <div className="flex-1 w-full h-full relative">
                {isLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0a0a0a]/50 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-4 border-neon-green/20 border-t-neon-green rounded-full animate-spin"></div>
                            <span className="text-neon-green text-xs font-medium animate-pulse">Synchronizing Analytics...</span>
                        </div>
                    </div>
                )}
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorApex" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorGA4" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6b7280" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorGap" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                                <stop offset="100%" stopColor="#10b981" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis
                            dataKey="time"
                            stroke="#ffffff20"
                            tick={{ fill: '#6b7280', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            stroke="#ffffff20"
                            tick={{ fill: '#6b7280', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(5, 5, 5, 0.9)',
                                borderColor: 'rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(20px)',
                                borderRadius: '1rem',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                            }}
                            itemStyle={{ fontSize: '12px' }}
                        />

                        {/* Hybrid Shading (The Gap) */}
                        {mode === 'hybrid' && (
                            <Area
                                type="monotone"
                                dataKey="truthGap"
                                stroke="none"
                                fill="url(#colorGap)"
                                name="Ad-Block Recovery"
                                animationDuration={1000}
                                connectNulls
                            />
                        )}

                        {/* Apex Line (The Truth) */}
                        {(mode === 'apex' || mode === 'hybrid') && (
                            <Area
                                type="monotone"
                                dataKey="visitors"
                                stroke="#10b981"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill={mode === 'apex' ? "url(#colorApex)" : "none"}
                                name="Apex (True Visitors)"
                                animationDuration={1000}
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
                            />
                        )}

                        {/* GA4 Line (Standard View) */}
                        {(mode === 'ga4' || mode === 'hybrid') && (
                            <Area
                                type="monotone"
                                dataKey="ga4Users"
                                stroke="#6b7280"
                                strokeWidth={mode === 'hybrid' ? 2 : 3}
                                strokeDasharray={mode === 'hybrid' ? "5 5" : "0"}
                                fillOpacity={1}
                                fill={mode === 'ga4' ? "url(#colorGA4)" : "none"}
                                name="Google (GA4)"
                                animationDuration={mode === 'hybrid' ? 1500 : 1000}
                            />
                        )}

                        {showGSC && (
                            <Line
                                type="monotone"
                                dataKey="gscClicks"
                                stroke="#f97316"
                                strokeWidth={2}
                                dot={false}
                                name="GSC Clicks"
                            />
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Harmonized Legend */}
            <div className="flex justify-center flex-wrap gap-4 mt-4 pb-4 border-t border-white/5 pt-4">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/60">
                    <div className="w-3 h-1 bg-neon-green rounded-full"></div>
                    Apex (Local Truth)
                </div>
                {mode === 'hybrid' && (
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-neon-green/80">
                        <div className="w-3 h-3 bg-neon-green/20 border border-neon-green/40 rounded-sm"></div>
                        The Truth Gap (Recovered)
                    </div>
                )}
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-500">
                    <div className="w-3 h-1 bg-gray-600 rounded-full border-t border-dashed border-gray-400"></div>
                    Google Analytics (Partial)
                </div>
            </div>
        </div>
    );
}

