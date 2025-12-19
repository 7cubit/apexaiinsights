import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line } from 'recharts';
import { useState } from 'react';

interface TrafficData {
    time: string;
    visitors: number;
    gscImpressions?: number;
    gscClicks?: number;
}

interface TrafficChartProps {
    range?: string;
}

const getDataForRange = (range: string): TrafficData[] => {
    switch (range) {
        case '30d':
            return [
                { time: 'Week 1', visitors: 2400, gscImpressions: 8000, gscClicks: 240 },
                { time: 'Week 2', visitors: 3200, gscImpressions: 11000, gscClicks: 310 },
                { time: 'Week 3', visitors: 2800, gscImpressions: 9500, gscClicks: 280 },
                { time: 'Week 4', visitors: 4500, gscImpressions: 15000, gscClicks: 420 },
            ];
        case '90d':
            return [
                { time: 'Month 1', visitors: 12000, gscImpressions: 45000, gscClicks: 1200 },
                { time: 'Month 2', visitors: 15000, gscImpressions: 55000, gscClicks: 1600 },
                { time: 'Month 3', visitors: 22000, gscImpressions: 75000, gscClicks: 2100 },
            ];
        default: // 7d
            return [
                { time: 'Mon', visitors: 820, gscImpressions: 2400, gscClicks: 72 },
                { time: 'Tue', visitors: 932, gscImpressions: 2800, gscClicks: 84 },
                { time: 'Wed', visitors: 901, gscImpressions: 2600, gscClicks: 78 },
                { time: 'Thu', visitors: 934, gscImpressions: 3100, gscClicks: 92 },
                { time: 'Fri', visitors: 1290, gscImpressions: 4200, gscClicks: 140 },
                { time: 'Sat', visitors: 1330, gscImpressions: 4500, gscClicks: 150 },
                { time: 'Sun', visitors: 1320, gscImpressions: 4300, gscClicks: 145 },
            ];
    }
};

export default function TrafficChart({ range = '7d' }: TrafficChartProps) {
    const data = getDataForRange(range);
    const [showGSC, setShowGSC] = useState(true);

    const rangeLabel = range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days';

    // In a real implementation:
    // useEffect(() => { fetch('/v1/analysis/gsc-overlay')... }, [])

    return (
        <div className="glass-card h-[400px] flex flex-col">
            <div className="mb-6 px-2 flex justify-between items-start">
                <div>
                    <h3 className="text-white font-display font-semibold text-lg">Traffic Trends</h3>
                    <p className="text-gray-400 text-sm">{rangeLabel}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowGSC(!showGSC)}
                        className={`text-xs px-2 py-1 rounded border transition-colors ${showGSC ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'border-white/10 text-gray-500'}`}
                    >
                        GSC Overlay
                    </button>
                </div>
            </div>

            <div className="flex-1 w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis
                            dataKey="time"
                            stroke="#6b7280"
                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            stroke="#6b7280"
                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(10, 10, 10, 0.95)',
                                borderColor: 'rgba(255,255,255,0.1)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '0.75rem',
                                color: '#fff'
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="visitors"
                            stroke="#8b5cf6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorVisitors)"
                            name="Internal Traffic"
                        />
                        {showGSC && (
                            <Line
                                type="monotone"
                                dataKey="gscImpressions"
                                stroke="#f97316"
                                strokeWidth={2}
                                dot={false}
                                name="GSC Impressions"
                                strokeDasharray="5 5"
                            />
                        )}
                        {showGSC && (
                            <Line
                                type="monotone"
                                dataKey="gscClicks"
                                stroke="#f59e0b"
                                strokeWidth={2}
                                dot={{ r: 4, strokeWidth: 0, fill: '#f59e0b' }}
                                name="GSC Clicks"
                            />
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {showGSC && (
                <div className="flex justify-center gap-6 mt-2 pb-2">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        GSC Impressions
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        GSC Clicks
                    </div>
                </div>
            )}
        </div>
    );
}
