import { useState, useEffect } from 'react';
import { Zap, Plus, Trash2, PlayCircle, Mail, Globe, Monitor, ShieldAlert, CheckCircle2, XCircle, Loader2, Sparkles, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { metricsApi } from '../../services/api';

interface Rule {
    id: number;
    name: string;
    trigger_type: string;
    action_type: string;
    is_active: boolean;
}

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
        {type === 'success' ? <CheckCircle2 size={20} /> : type === 'error' ? <AlertCircle size={20} /> : <Info size={20} />}
        <span className="text-sm font-medium flex-1">{message}</span>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <XCircle size={16} />
        </button>
    </motion.div>
);

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }: { isOpen: boolean, title: string, message: string, onConfirm: () => void, onCancel: () => void }) => (
    <AnimatePresence>
        {isOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onCancel}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-md glass-card p-8 border border-white/10 rounded-3xl shadow-2xl"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
                            <ShieldAlert className="text-red-500" size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white">{title}</h3>
                    </div>
                    <p className="text-slate-400 mb-8 leading-relaxed">
                        {message}
                    </p>
                    <div className="flex justify-end gap-4">
                        <button
                            onClick={onCancel}
                            className="px-6 py-3 text-slate-400 hover:text-white transition-colors text-sm font-bold"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="px-8 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                        >
                            Confirm Delete
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
    </AnimatePresence>
);

export const AutomationBuilder = () => {
    const [rules, setRules] = useState<Rule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isTesting, setIsTesting] = useState<number | null>(null);
    const [showCreator, setShowCreator] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, id: number | null }>({ isOpen: false, id: null });

    // Form State
    const [name, setName] = useState('');
    const [trigger, setTrigger] = useState('cart_activity');
    const [action, setAction] = useState('email');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [webhookUrl, setWebhookUrl] = useState('');

    useEffect(() => {
        fetchRules();
    }, []);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchRules = async () => {
        setIsLoading(true);
        try {
            const data = await metricsApi.getAutomationRules();
            setRules(data || []);
        } catch (e) {
            console.error(e);
            showToast("Failed to fetch rules", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!name) {
            showToast("Please enter a rule name", "error");
            return;
        }
        try {
            const payload = {
                name,
                trigger_type: trigger,
                trigger_config: {},
                action_type: action,
                action_config: {
                    email,
                    message,
                    url: webhookUrl,
                }
            };

            await metricsApi.createAutomationRule(payload);
            setShowCreator(false);
            fetchRules();
            showToast("Rule deployed successfully", "success");
            // Reset form
            setName('');
            setEmail('');
            setMessage('');
            setWebhookUrl('');
        } catch (e) {
            console.error("Failed to create rule", e);
            showToast("Deployment failed", "error");
        }
    };

    const handleDelete = async (id: number) => {
        setDeleteModal({ isOpen: true, id });
    };

    const confirmDelete = async () => {
        if (deleteModal.id === null) return;
        try {
            await metricsApi.deleteAutomationRule(deleteModal.id);
            setDeleteModal({ isOpen: false, id: null });
            fetchRules();
            showToast("Rule deleted successfully", "success");
        } catch (e) {
            console.error(e);
            showToast("Deletion failed", "error");
        }
    };

    const handleTest = async (id: number) => {
        setIsTesting(id);
        try {
            await metricsApi.testAutomationRule(id);
            showToast("Test execution initiated. Check your intelligence logs.", "success");
        } catch (e) {
            console.error(e);
            showToast("Test execution failed", "error");
        } finally {
            setIsTesting(null);
        }
    };

    const getTriggerIcon = (type: string) => {
        switch (type) {
            case 'cart_activity': return <Sparkles size={16} className="text-yellow-400" />;
            case '404_error': return <ShieldAlert size={16} className="text-red-400" />;
            case 'high_load': return <AlertCircle size={16} className="text-orange-400" />;
            default: return <Zap size={16} className="text-blue-400" />;
        }
    };

    const getActionIcon = (type: string) => {
        switch (type) {
            case 'email': return <Mail size={16} className="text-purple-400" />;
            case 'webhook': return <Globe size={16} className="text-emerald-400" />;
            case 'notice': return <Monitor size={16} className="text-blue-400" />;
            default: return <Zap size={16} className="text-slate-400" />;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto pb-20">
            <AnimatePresence>
                {toast && <Toast {...toast} onClose={() => setToast(null)} />}
            </AnimatePresence>

            <ConfirmModal
                isOpen={deleteModal.isOpen}
                title="Delete Automation Rule"
                message="Are you sure you want to permanently delete this rule? This action cannot be undone and the automation will stop immediately."
                onConfirm={confirmDelete}
                onCancel={() => setDeleteModal({ isOpen: false, id: null })}
            />

            <div className="flex justify-between items-center bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-md relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                    <h2 className="text-4xl font-display font-black bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent flex items-center gap-4">
                        <Zap className="text-yellow-400 fill-yellow-400/20 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" size={40} />
                        Auto-Pilot Engine
                    </h2>
                    <p className="text-slate-400 mt-2 text-lg font-medium">Automate marketing and ops based on real-time telemetry.</p>
                </div>
                <button
                    onClick={() => setShowCreator(!showCreator)}
                    className="relative z-10 flex items-center gap-3 px-8 py-4 bg-yellow-500 text-black font-black rounded-2xl hover:shadow-[0_0_30px_rgba(234,179,8,0.4)] transition-all active:scale-95 group/btn overflow-hidden"
                >
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-black/10 transition-all group-hover/btn:h-full" />
                    <span className="relative flex items-center gap-2">
                        <Plus size={20} strokeWidth={3} />
                        New Automation Rule
                    </span>
                </button>
            </div>

            {/* Rule Creator */}
            <AnimatePresence>
                {showCreator && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, scale: 0.95 }}
                        animate={{ opacity: 1, height: 'auto', scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.95 }}
                        className="glass-card border border-yellow-500/30 p-8 rounded-3xl space-y-8 relative overflow-hidden shadow-2xl shadow-yellow-500/5"
                    >
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                            <Zap size={240} className="text-yellow-500" />
                        </div>

                        <div className="flex justify-between items-start">
                            <h3 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                                <Plus size={28} className="text-yellow-400" />
                                Configure Intelligence Rule
                            </h3>
                            <button onClick={() => setShowCreator(false)} className="p-2 text-slate-500 hover:text-white transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="space-y-3">
                                <label className="text-xs text-slate-500 uppercase tracking-[0.2em] font-black">Rule Identity</label>
                                <input
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm text-white focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 outline-none transition-all placeholder:text-slate-700"
                                    value={name} onChange={e => setName(e.target.value)} placeholder="e.g. VIP Cart Abandonment Slack Alert"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs text-slate-500 uppercase tracking-[0.2em] font-black">Trigger (Event Source)</label>
                                <select
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm text-white focus:border-yellow-500/50 cursor-pointer outline-none transition-all"
                                    value={trigger} onChange={e => setTrigger(e.target.value)}
                                >
                                    <option value="cart_activity">🛒 Cart Activity (Add to Cart)</option>
                                    <option value="404_error">🚫 404 Error Detected</option>
                                    <option value="high_load">🔥 High Server Load (Over 80%)</option>
                                </select>
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs text-slate-500 uppercase tracking-[0.2em] font-black">Action (Intelligence Output)</label>
                                <select
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm text-white focus:border-yellow-500/50 cursor-pointer outline-none transition-all"
                                    value={action} onChange={e => setAction(e.target.value)}
                                >
                                    <option value="email">📧 Send Alert Email</option>
                                    <option value="webhook">🪝 Webhook JSON POST</option>
                                    <option value="notice">🖥️ Dashboard Notification</option>
                                </select>
                            </div>
                        </div>

                        {/* Dynamic Action Fields */}
                        <AnimatePresence mode="wait">
                            {action === 'email' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    key="email-fields"
                                    className="space-y-6 p-8 bg-white/[0.02] rounded-3xl border border-white/5"
                                >
                                    <div className="space-y-3">
                                        <label className="text-xs text-slate-500 uppercase tracking-[0.2em] font-black">Recipient Email</label>
                                        <input
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm text-white"
                                            value={email} onChange={e => setEmail(e.target.value)} placeholder="security@yourdomain.com"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs text-slate-500 uppercase tracking-[0.2em] font-black">Custom Intelligence Message</label>
                                        <textarea
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm text-white h-32 resize-none"
                                            value={message} onChange={e => setMessage(e.target.value)} placeholder="Alert: High priority event detected via Apex Intelligence..."
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {action === 'webhook' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    key="webhook-fields"
                                    className="space-y-4 p-8 bg-white/[0.02] rounded-3xl border border-white/5"
                                >
                                    <div className="space-y-3">
                                        <label className="text-xs text-slate-500 uppercase tracking-[0.2em] font-black">Endpoint URL</label>
                                        <input
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm text-white font-mono"
                                            value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://hooks.slack.com/services/..."
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex justify-end gap-6 pt-4 border-t border-white/5">
                            <button onClick={() => setShowCreator(false)} className="px-8 py-3 text-slate-400 hover:text-white transition-colors font-bold">Discard</button>
                            <button onClick={handleCreate} className="px-12 py-4 bg-white text-black font-black rounded-2xl hover:bg-slate-100 active:scale-95 transition-all shadow-xl shadow-white/5">Deploy Intelligence Rule</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Rules List */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                    <Zap size={20} className="text-yellow-500 shadow-yellow-500/50" />
                    <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-500">Active Intelligence Matrix</h3>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-white/5 rounded-[40px] border border-white/5 border-dashed">
                        <Loader2 className="animate-spin text-yellow-500 mb-4" size={48} />
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Syncing with Engine...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        <AnimatePresence mode="popLayout">
                            {rules.map(rule => (
                                <motion.div
                                    key={rule.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-slate-900/40 border border-white/5 hover:border-white/20 p-6 rounded-3xl flex items-center justify-between group transition-all backdrop-blur-sm relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="flex items-center gap-6 relative z-10">
                                        <div className={`p-5 rounded-2xl transition-transform group-hover:scale-110 duration-300 ${rule.is_active ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-slate-800 text-slate-600'}`}>
                                            {getTriggerIcon(rule.trigger_type)}
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold text-white group-hover:text-yellow-400 transition-colors uppercase tracking-tight">{rule.name}</h4>
                                            <div className="flex items-center gap-4 mt-2 font-black">
                                                <span className="flex items-center gap-2 bg-slate-800/80 text-slate-400 px-4 py-1.5 rounded-full text-[10px] tracking-widest border border-white/5">
                                                    IF {rule.trigger_type.replace('_', ' ').toUpperCase()}
                                                </span>
                                                <span className="text-slate-600">→</span>
                                                <span className="flex items-center gap-2 bg-blue-500/10 text-blue-400 px-4 py-1.5 rounded-full text-[10px] tracking-widest border border-blue-500/20">
                                                    {getActionIcon(rule.action_type)}
                                                    THEN {rule.action_type.toUpperCase()}
                                                </span>
                                                {rule.is_active ? (
                                                    <span className="flex items-center gap-2 text-[10px] tracking-widest text-emerald-500 ml-4">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                        OPERATIONAL
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-2 text-[10px] tracking-widest text-slate-500 ml-4">
                                                        <div className="w-2 h-2 rounded-full bg-slate-500" />
                                                        STASTIONED
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300 relative z-10">
                                        <button
                                            onClick={() => handleTest(rule.id)}
                                            disabled={isTesting === rule.id}
                                            className="flex items-center gap-3 px-6 py-3 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-2xl transition-all border border-white/5 active:scale-95"
                                        >
                                            {isTesting === rule.id ? <Loader2 size={18} className="animate-spin" /> : <PlayCircle size={18} />}
                                            <span className="text-xs font-black uppercase tracking-widest">Trigger Test</span>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(rule.id)}
                                            className="p-4 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl transition-all border border-red-500/20 active:scale-95 shadow-lg hover:shadow-red-500/20"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {!isLoading && rules.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-32 text-slate-500 bg-white/[0.02] rounded-[40px] border-2 border-dashed border-white/10 flex flex-col items-center gap-6"
                    >
                        <div className="p-8 bg-slate-800/50 rounded-full border border-white/5 relative">
                            <Zap className="opacity-20 text-yellow-500" size={64} />
                            <div className="absolute inset-0 bg-yellow-500/10 blur-2xl rounded-full" />
                        </div>
                        <div className="max-w-xs space-y-2">
                            <p className="text-white font-black text-2xl uppercase tracking-tight">No Active Automations</p>
                            <p className="text-slate-500 text-base font-medium">Deploy your first Auto-Pilot rule to start automating your intelligence workflows.</p>
                        </div>
                        <button onClick={() => setShowCreator(true)} className="mt-4 px-10 py-4 bg-yellow-500 text-black font-black rounded-2xl active:scale-95 transition-all hover:shadow-[0_0_25px_rgba(234,179,8,0.3)]">
                            Deploy First Rule
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    );
};
