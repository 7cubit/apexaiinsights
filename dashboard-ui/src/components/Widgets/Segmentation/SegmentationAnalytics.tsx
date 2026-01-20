import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CohortGrid from './CohortGrid';
import UserJourneySankey from './UserJourneySankey';
import { CompanyProfileWidget } from '../CompanyProfileWidget';
import { metricsApi } from '../../../services/api';
import {
    Users, Filter, Download, Target, Zap, AlertTriangle,
    CheckCircle2, XCircle, Plus, Loader2, Sparkles
} from 'lucide-react';

// Toast Component
interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'info';
    onClose: () => void;
}

const Toast = ({ message, type, onClose }: ToastProps) => (
    <motion.div
        initial={{ opacity: 0, y: 50, x: '-50%' }}
        animate={{ opacity: 1, y: 0, x: '-50%' }}
        exit={{ opacity: 0, y: 20, x: '-50%' }}
        className={`fixed bottom-8 left-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-3 min-w-[320px] ${type === 'success' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' :
            type === 'error' ? 'bg-red-500/20 border-red-500/30 text-red-400' :
                'bg-blue-500/20 border-blue-500/30 text-blue-400'
            }`}
    >
        {type === 'success' ? <CheckCircle2 size={20} /> : type === 'error' ? <AlertTriangle size={20} /> : <Sparkles size={20} />}
        <span className="text-sm font-medium flex-1">{message}</span>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <XCircle size={16} />
        </button>
    </motion.div>
);

// Segment Builder Modal
interface SegmentBuilderProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, criteria: string) => Promise<void>;
}

const SegmentBuilderModal = ({ isOpen, onClose, onSave }: SegmentBuilderProps) => {
    const [name, setName] = useState('');
    const [criteria, setCriteria] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) return;
        setSaving(true);
        await onSave(name, criteria);
        setSaving(false);
        setName('');
        setCriteria('');
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg glass-card p-8 border border-emerald-500/20 rounded-3xl shadow-2xl"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                                <Filter className="text-emerald-400" size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Create Segment</h3>
                                <p className="text-sm text-slate-400">Define criteria to group users</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs text-slate-500 uppercase tracking-[0.2em] font-black">Segment Name</label>
                                <input
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-slate-700 focus:border-emerald-500/50 outline-none"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. VIP Customers"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-slate-500 uppercase tracking-[0.2em] font-black">Criteria (JSON)</label>
                                <textarea
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white font-mono placeholder:text-slate-700 focus:border-emerald-500/50 outline-none h-32 resize-none"
                                    value={criteria}
                                    onChange={e => setCriteria(e.target.value)}
                                    placeholder='{"country": "US", "visits": ">5"}'
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-white/5">
                            <button onClick={onClose} className="px-6 py-3 text-slate-400 hover:text-white transition-colors font-bold">
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !name.trim()}
                                className="px-8 py-3 bg-emerald-500 text-black rounded-xl font-bold hover:bg-emerald-400 transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving && <Loader2 size={16} className="animate-spin" />}
                                Create Segment
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const SegmentationAnalytics = () => {
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
    const [showBuilder, setShowBuilder] = useState(false);
    const [kpis, setKpis] = useState({ topPersona: 'Loading...', avgScore: 0, scoreChange: '', churnRisk: 0 });
    const [leads, setLeads] = useState<any[]>([]);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        const loadKpis = async () => {
            try {
                const data = await metricsApi.getEngagementScores();
                setKpis({
                    topPersona: data.topPersona || 'Power Users',
                    avgScore: data.avgScore || 64,
                    scoreChange: data.scoreChange || '+12%',
                    churnRisk: data.churnRisk || 12.5
                });
            } catch (e) {
                console.error("Failed to load KPIs", e);
            }
        };

        const loadLeads = async () => {
            try {
                const data = await metricsApi.getLeads();
                setLeads(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error("Failed to load leads", e);
            }
        };

        loadKpis();
        loadLeads();
    }, []);

    const showToast = (message: string, type: 'success' | 'error' | 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleCreateSegment = async (name: string, criteria: string) => {
        try {
            await metricsApi.createSegment({ name, criteria });
            showToast(`Segment "${name}" created successfully`, 'success');
        } catch (e) {
            showToast("Failed to create segment", 'error');
        }
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            await metricsApi.exportSegmentData();
            showToast("Data exported successfully", 'success');
        } catch (e) {
            showToast("Export failed", 'error');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-500">
            <AnimatePresence>
                {toast && <Toast {...toast} onClose={() => setToast(null)} />}
            </AnimatePresence>

            <SegmentBuilderModal
                isOpen={showBuilder}
                onClose={() => setShowBuilder(false)}
                onSave={handleCreateSegment}
            />

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-md relative overflow-hidden group"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                    <h2 className="text-4xl font-display font-black bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent flex items-center gap-4">
                        <Users className="text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" size={40} />
                        Audience Intelligence
                    </h2>
                    <p className="text-slate-400 mt-2 text-lg font-medium">
                        Analyze user behavior, retention cohorts, and behavioral segments.
                    </p>
                </div>
                <div className="flex gap-3 relative z-10">
                    <button
                        onClick={() => setShowBuilder(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all active:scale-95"
                    >
                        <Plus size={18} />
                        Segment Builder
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="flex items-center gap-2 px-6 py-3 border border-white/10 rounded-xl text-sm font-bold text-gray-300 hover:bg-white/5 transition-colors disabled:opacity-50"
                    >
                        {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                        Export Data
                    </button>
                </div>
            </motion.div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card p-6 border border-white/10 bg-black/20 backdrop-blur-md rounded-2xl group hover:border-emerald-500/30 transition-all"
                >
                    <div className="flex flex-row items-center justify-between pb-2">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Top Persona</h3>
                        <Zap className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div className="text-3xl font-black text-emerald-400">{kpis.topPersona}</div>
                    <p className="text-xs text-slate-500 mt-1">Highest engagement score (85+)</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card p-6 border border-white/10 bg-black/20 backdrop-blur-md rounded-2xl group hover:border-cyan-500/30 transition-all"
                >
                    <div className="flex flex-row items-center justify-between pb-2">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Avg Engagement</h3>
                        <Users className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div className="text-3xl font-black text-white">{kpis.avgScore}<span className="text-xl text-slate-500">/100</span></div>
                    <p className="text-xs text-emerald-400 mt-1">{kpis.scoreChange} from last week</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card p-6 border border-white/10 bg-black/20 backdrop-blur-md rounded-2xl group hover:border-red-500/30 transition-all"
                >
                    <div className="flex flex-row items-center justify-between pb-2">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Churn Risk</h3>
                        <AlertTriangle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="text-3xl font-black text-red-400">{kpis.churnRisk}%</div>
                    <p className="text-xs text-slate-500 mt-1">Users inactive &gt; 30 days</p>
                </motion.div>
            </div>

            {/* Main Visualizations */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="col-span-1">
                    <CohortGrid />
                </div>
                <div className="col-span-2">
                    <UserJourneySankey />
                </div>
            </div>

            {/* Lead Hunter Section */}
            <div className="mt-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-emerald-500/10 rounded-xl">
                        <Target className="text-emerald-400" size={20} />
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                        Lead Hunter
                        <span className="text-xs font-normal text-slate-500 uppercase ml-3 tracking-widest">B2B Intelligence</span>
                    </h3>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {leads.length > 0 ? (
                        leads.map((company, idx) => (
                            <CompanyProfileWidget key={idx} company={company} />
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center glass-card border border-white/5 rounded-3xl">
                            <p className="text-slate-500 font-medium">No identified companies found yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SegmentationAnalytics;
