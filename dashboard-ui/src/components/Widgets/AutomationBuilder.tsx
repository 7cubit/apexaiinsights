import { useState, useEffect } from 'react';
import axios from 'axios';
import { Zap, Plus, Trash2, PlayCircle } from 'lucide-react';

interface Rule {
    id: number;
    name: string;
    trigger_type: string;
    action_type: string;
    is_active: boolean;
}

export const AutomationBuilder = () => {
    const [rules, setRules] = useState<Rule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreator, setShowCreator] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [trigger, setTrigger] = useState('cart_activity'); // 'cart_activity', '404_error'
    const [action, setAction] = useState('email'); // 'email', 'webhook', 'notice'

    // Action Config
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        try {
            // @ts-ignore
            const root = window.apexConfig?.api_root || '/wp-json/apex/v1';
            // @ts-ignore
            const nonce = window.apexConfig?.nonce || '';

            const res = await axios.get(`${root}/automation/rules`, {
                headers: { 'X-WP-Nonce': nonce }
            });
            setRules(res.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        try {
            // @ts-ignore
            const root = window.apexConfig?.api_root || '/wp-json/apex/v1';
            // @ts-ignore
            const nonce = window.apexConfig?.nonce || '';

            const payload = {
                name,
                trigger_type: trigger,
                trigger_config: {}, // Simple for now
                action_type: action,
                action_config: {
                    email,
                    message,
                    url: '', // Webhook URL if needed
                    notice: ''
                }
            };

            await axios.post(`${root}/automation/rules`, payload, {
                headers: { 'X-WP-Nonce': nonce }
            });

            setShowCreator(false);
            fetchRules();
            // Reset form
            setName('');
            setEmail('');
            setMessage('');

        } catch (e) {
            console.error("Failed to create rule", e);
            alert("Failed to create rule.");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure?")) return;
        try {
            // @ts-ignore
            const root = window.apexConfig?.api_root || '/wp-json/apex/v1';
            // @ts-ignore
            const nonce = window.apexConfig?.nonce || '';
            await axios.delete(`${root}/automation/rules/${id}`, {
                headers: { 'X-WP-Nonce': nonce }
            });
            fetchRules();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent flex items-center gap-2">
                        <Zap className="text-yellow-400" />
                        Auto-Pilot Engine
                    </h2>
                    <p className="text-slate-400">Automate actions based on live telemetry triggers.</p>
                </div>
                <button
                    onClick={() => setShowCreator(!showCreator)}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/20 rounded-lg transition-all"
                >
                    <Plus size={16} />
                    New Rule
                </button>
            </div>

            {/* Rule Creator */}
            {showCreator && (
                <div className="glass-card border border-yellow-500/30 p-6 rounded-xl space-y-4 animate-in slide-in-from-top duration-300">
                    <h3 className="font-display font-semibold text-white flex items-center gap-2">
                        <Plus size={18} className="text-yellow-400" />
                        Create Automation Rule
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Rule Name</label>
                            <input
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-yellow-500/50 transition-colors"
                                value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Alert me on Cart Abandon"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">If (Trigger)</label>
                            <select
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-yellow-500/50 transition-colors cursor-pointer"
                                value={trigger} onChange={e => setTrigger(e.target.value)}
                            >
                                <option value="cart_activity">Cart Activity (Add to Cart)</option>
                                <option value="404_error">404 Error Detected</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Then (Action)</label>
                            <select
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-yellow-500/50 transition-colors cursor-pointer"
                                value={action} onChange={e => setAction(e.target.value)}
                            >
                                <option value="email">Send Email (via WP)</option>
                                <option value="webhook">Webhook (JSON POST)</option>
                                <option value="notice">Display Frontend Notice</option>
                            </select>
                        </div>
                    </div>

                    {/* Dynamic Action Fields */}
                    {action === 'email' && (
                        <div className="space-y-4 p-4 bg-white/5 rounded-xl border border-white/10 animate-fade-in">
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Recipient Email</label>
                                <input
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white"
                                    value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Message Body</label>
                                <textarea
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white h-24"
                                    value={message} onChange={e => setMessage(e.target.value)} placeholder="Alert: Event detected..."
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={() => setShowCreator(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm">Cancel</button>
                        <button onClick={handleCreate} className="px-8 py-2 bg-yellow-500 text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all text-sm">Save Rule</button>
                    </div>
                </div>
            )}

            {/* Rules List */}
            <div className="grid grid-cols-1 gap-4">
                {isLoading ? <p className="text-slate-500">Loading rules...</p> : rules.map(rule => (
                    <div key={rule.id} className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${rule.is_active ? 'bg-green-500/10 text-green-400' : 'bg-slate-700/50 text-slate-500'}`}>
                                <Zap size={20} />
                            </div>
                            <div>
                                <h4 className="font-medium text-white">{rule.name}</h4>
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <span className="bg-slate-700 px-2 py-0.5 rounded text-xs text-white">IF {rule.trigger_type}</span>
                                    <span>→</span>
                                    <span className="bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded text-xs">THEN {rule.action_type}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleDelete(rule.id)} className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-lg transition-colors">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}

                {!isLoading && rules.length === 0 && (
                    <div className="text-center py-12 text-slate-500 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
                        <PlayCircle className="mx-auto mb-2 opacity-50" size={32} />
                        <p>No active rules. Create one to start automating.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
