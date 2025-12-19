import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, Sankey, Tooltip } from 'recharts';

// Types for Sankey Data
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

const UserJourneySankey: React.FC = () => {
    const [data, setData] = useState<SankeyData>({ nodes: [], links: [] });

    useEffect(() => {
        // @ts-ignore
        const apiRoot = window.apexConfig?.tunnel_url || '/apex/v1/tunnel';

        // Mock fetch or real endpoint
        fetch(`${apiRoot}?path=/v1/segmentation/sankey`)
            .then(res => res.json())
            .then(data => {
                if (data && Array.isArray(data.nodes) && Array.isArray(data.links)) {
                    setData(data);
                } else {
                    console.error("Invalid Sankey data:", data);
                }
            })
            .catch(err => console.error(err));
    }, []);

    // Custom Node for Sankey (futuristic styling)
    const renderNode = (props: any) => {
        const { x, y, width, height, payload } = props;
        return (
            <g>
                <rect x={x} y={y} width={width} height={height} fill="#00ff9d" fillOpacity={0.8} rx={2} />
                <text
                    x={x + width / 2}
                    y={y + height / 2 + 5}
                    textAnchor="start"
                    fontSize={12}
                    fill="#fff"
                    style={{ pointerEvents: 'none', marginLeft: 10 }}
                    dx={width + 5}
                >
                    {payload.name}
                </text>
            </g>
        );
    };

    return (
        <div className="glass-card h-[400px] p-6 border border-white/10 bg-black/20 backdrop-blur-md rounded-lg col-span-2">
            <h3 className="text-sm font-medium uppercase tracking-widest text-blue-400 mb-4">
                User Journey Map
            </h3>
            <div className="h-[320px]">
                {data.nodes.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <Sankey
                            data={data}
                            node={renderNode}
                            nodePadding={50}
                            margin={{ left: 20, right: 100, top: 20, bottom: 20 }}
                            link={{ stroke: '#374151', strokeOpacity: 0.4 }} // dark link
                        >
                            <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#333' }} />
                        </Sankey>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex h-full items-center justify-center text-gray-500">
                        Loading Journey Data...
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserJourneySankey;
