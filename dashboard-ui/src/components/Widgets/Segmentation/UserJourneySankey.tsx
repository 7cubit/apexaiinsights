import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, Sankey, Tooltip } from 'recharts';
import { Loader2, GitBranch } from 'lucide-react';
import { metricsApi } from '../../../services/api';

interface SankeyNode {
    name: string;
}
interface SankeyLink {
    source: number;
    target: number;
    value: number;
}
interface SankeyData {
    nodes: SankeyNode[];
    links: SankeyLink[];
}

const UserJourneySankey = () => {
    const [data, setData] = useState<SankeyData>({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const sankey = await metricsApi.getSankey();
                if (sankey && Array.isArray(sankey.nodes) && Array.isArray(sankey.links)) {
                    setData(sankey);
                }
            } catch (e) {
                console.error("Failed to load sankey data", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const renderNode = (props: any) => {
        const { x, y, width, height, payload } = props;
        return (
            <g>
                <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill="url(#nodeGradient)"
                    rx={4}
                    className="drop-shadow-[0_0_8px_rgba(0,255,157,0.3)]"
                />
                <text
                    x={x + width + 8}
                    y={y + height / 2 + 4}
                    fontSize={11}
                    fill="#fff"
                    fontWeight="bold"
                    className="uppercase tracking-wider"
                >
                    {payload.name}
                </text>
            </g>
        );
    };

    if (loading) {
        return (
            <div className="glass-card h-[400px] p-6 border border-white/10 bg-black/20 backdrop-blur-md rounded-2xl col-span-2 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin text-blue-400" size={32} />
                    <span className="text-slate-500 text-sm uppercase tracking-widest font-bold">Loading Journey Map</span>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card h-[400px] p-6 border border-white/10 bg-black/20 backdrop-blur-md rounded-2xl col-span-2"
        >
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/10 rounded-xl">
                    <GitBranch className="text-blue-400" size={18} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-blue-400">
                    User Journey Map
                </h3>
            </div>
            <div className="h-[320px]">
                {data.nodes.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <Sankey
                            data={data}
                            node={renderNode}
                            nodePadding={50}
                            margin={{ left: 20, right: 120, top: 20, bottom: 20 }}
                            link={{ stroke: '#374151', strokeOpacity: 0.5 }}
                        >
                            <defs>
                                <linearGradient id="nodeGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#00ff9d" stopOpacity={0.9} />
                                    <stop offset="100%" stopColor="#00d4ff" stopOpacity={0.7} />
                                </linearGradient>
                            </defs>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(0,0,0,0.9)',
                                    borderColor: '#333',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                                }}
                                labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                            />
                        </Sankey>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex h-full items-center justify-center text-gray-500">
                        No journey data available
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default UserJourneySankey;
