import { useState } from 'react';
import { Key, ShieldCheck, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';


export const LicenseActivation = () => {
    const [licenseKey, setLicenseKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const config = (window as any).apexConfig || {};
    const apiRoot = config.api_root || '/wp-json/apex/v1';
    const nonce = config.nonce || '';

    const handleActivate = async () => {
        if (!licenseKey.trim()) return;
        setIsLoading(true);
        setError(null);

        try {
            const response = await axios.post(`${apiRoot}/license/activate`,
                { license_key: licenseKey },
                { headers: { 'X-WP-Nonce': nonce } }
            );

            if (response.data.success) {
                // Force layout update to reflect new plan logic
                window.location.reload();
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to activate license.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="glass-card p-8 border border-white/5 relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-neon-purple/10 blur-[80px] rounded-full pointer-events-none" />

            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-neon-purple/10 rounded-xl border border-neon-purple/20">
                    <Key className="w-6 h-6 text-neon-purple" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">License & Activation</h3>
                    <p className="text-sm text-gray-400">Manage your Apex AI Insights subscription.</p>
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        License Key
                    </label>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={licenseKey}
                            onChange={(e) => setLicenseKey(e.target.value)}
                            placeholder="APEX_PRO_sk_XXXXX"
                            className="flex-1 bg-midnight/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-neon-purple/50 transition-colors font-mono"
                        />
                        <button
                            onClick={handleActivate}
                            disabled={isLoading || !licenseKey.trim()}
                            className="bg-neon-purple hover:bg-neon-purple/80 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                            Activate
                        </button>
                    </div>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-3 flex items-center gap-2 text-red-400 text-sm"
                        >
                            <AlertCircle size={14} />
                            {error}
                        </motion.div>
                    )}
                </div>

                {/* Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-neon-green" />
                            <span className="text-sm text-gray-400">Current Plan</span>
                        </div>
                        <span className="text-sm font-bold text-white uppercase tracking-widest">
                            {(config.plan || 'plus')}
                        </span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-4 h-4 text-neon-green" />
                            <span className="text-sm text-gray-400">License Status</span>
                        </div>
                        <span className="text-sm font-bold text-neon-green">
                            Active
                        </span>
                    </div>
                </div>

                <div className="p-4 bg-neon-purple/5 border border-neon-purple/10 rounded-xl">
                    <p className="text-xs text-neon-purple/70 leading-relaxed">
                        Your license key is verified against the Apex AI secure cloud.
                        Heartbeat active. Next check in 24 hours.
                    </p>
                </div>
            </div>
        </div>
    );
};
