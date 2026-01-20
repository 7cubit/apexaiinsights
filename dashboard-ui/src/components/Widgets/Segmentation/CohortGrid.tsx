import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Users } from 'lucide-react';
import { metricsApi } from '../../../services/api';

interface CohortData {
    date: string;
    users: number;
    day1: number;
    day7: number;
    day30: number;
}

const CohortGrid = () => {
    const [data, setData] = useState<CohortData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const cohorts = await metricsApi.getCohorts();
                setData(Array.isArray(cohorts) ? cohorts : []);
            } catch (e) {
                console.error("Failed to load cohorts", e);
                setError("Failed to load cohort data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getColor = (val: number) => {
        if (val >= 40) return 'bg-emerald-500/80 text-white';
        if (val >= 20) return 'bg-emerald-400/60 text-white';
        if (val > 0) return 'bg-emerald-300/30 text-emerald-300';
        return 'bg-slate-800/50 text-slate-600';
    };

    if (loading) {
        return (
            <div className="glass-card p-6 border border-white/10 bg-black/20 backdrop-blur-md rounded-2xl h-[300px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin text-emerald-400" size={32} />
                    <span className="text-slate-500 text-sm uppercase tracking-widest font-bold">Loading Cohorts</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="glass-card p-6 border border-red-500/20 bg-black/20 backdrop-blur-md rounded-2xl h-[300px] flex items-center justify-center">
                <span className="text-red-400">{error}</span>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 border border-white/10 bg-black/20 backdrop-blur-md rounded-2xl"
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-500/10 rounded-xl">
                    <Users className="text-emerald-400" size={18} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-emerald-400">
                    Retention Cohorts
                </h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="p-3 text-left text-xs font-black uppercase tracking-widest text-slate-500">Cohort</th>
                            <th className="p-3 text-left text-xs font-black uppercase tracking-widest text-slate-500">Users</th>
                            <th className="p-3 text-center text-xs font-black uppercase tracking-widest text-slate-500">Day 1</th>
                            <th className="p-3 text-center text-xs font-black uppercase tracking-widest text-slate-500">Day 7</th>
                            <th className="p-3 text-center text-xs font-black uppercase tracking-widest text-slate-500">Day 30</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, idx) => (
                            <motion.tr
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                            >
                                <td className="p-3 font-mono text-slate-400 group-hover:text-white transition-colors">{row.date}</td>
                                <td className="p-3 font-mono text-white font-bold">{row.users.toLocaleString()}</td>
                                <td className="p-3 text-center">
                                    <span className={`inline-block px-3 py-1 rounded-lg font-bold text-xs ${getColor(row.day1)}`}>
                                        {row.day1}%
                                    </span>
                                </td>
                                <td className="p-3 text-center">
                                    <span className={`inline-block px-3 py-1 rounded-lg font-bold text-xs ${getColor(row.day7)}`}>
                                        {row.day7}%
                                    </span>
                                </td>
                                <td className="p-3 text-center">
                                    <span className={`inline-block px-3 py-1 rounded-lg font-bold text-xs ${getColor(row.day30)}`}>
                                        {row.day30}%
                                    </span>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};

export default CohortGrid;
