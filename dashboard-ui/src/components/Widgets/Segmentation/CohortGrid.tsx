import React, { useEffect, useState } from 'react';

// Types
interface CohortData {
    date: string;
    users: number;
    day1: number;
    day7: number;
    day30: number;
}

const CohortGrid: React.FC = () => {
    const [data, setData] = useState<CohortData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // @ts-ignore
        const apiRoot = window.apexConfig?.tunnel_url || '/apex/v1/tunnel';

        fetch(`${apiRoot}?path=/v1/segmentation/cohorts`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setData(data);
                } else {
                    console.error("Cohort data is not an array:", data);
                    setData([]);
                }
            })
            .catch(err => console.error("Failed to load cohorts", err))
            .finally(() => setLoading(false));
    }, []);

    const getColor = (val: number) => {
        if (val >= 40) return 'bg-emerald-500 text-white';
        if (val >= 20) return 'bg-emerald-400 text-black';
        if (val > 0) return 'bg-emerald-200 text-black';
        return 'bg-muted text-muted-foreground';
    };

    if (loading) return <div className="p-4 text-muted-foreground">Loading Cohorts...</div>;

    return (
        <div className="glass-card p-6 border border-white/10 bg-black/20 backdrop-blur-md rounded-lg">
            <h3 className="text-sm font-medium uppercase tracking-widest text-[#00ff9d] mb-4">
                Retention Cohorts
            </h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-gray-300">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="p-2 text-left">Cohort</th>
                            <th className="p-2 text-left">Users</th>
                            <th className="p-2 text-center">Day 1</th>
                            <th className="p-2 text-center">Day 7</th>
                            <th className="p-2 text-center">Day 30</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, idx) => (
                            <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="p-2 font-mono text-gray-500">{row.date}</td>
                                <td className="p-2 font-mono">{row.users.toLocaleString()}</td>
                                <td className={`p-2 text-center font-bold ${getColor(row.day1)} rounded`}>{row.day1}%</td>
                                <td className={`p-2 text-center font-bold ${getColor(row.day7)} rounded`}>{row.day7}%</td>
                                <td className={`p-2 text-center font-bold ${getColor(row.day30)} rounded`}>{row.day30}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CohortGrid;
