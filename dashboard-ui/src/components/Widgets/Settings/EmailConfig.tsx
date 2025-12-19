import { useState } from 'react';
import { Mail, Save, CheckCircle } from 'lucide-react';

export const EmailConfig = () => {
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [config, setConfig] = useState({
        host: 'smtp.example.com',
        port: '587',
        user: 'admin@apex-insights.com',
        pass: '••••••••',
        secure: true
    });

    const handleSave = () => {
        setLoading(true);
        // Mock API Call
        setTimeout(() => {
            setLoading(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }, 1500);
    };

    return (
        <div className="p-6 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl relative overflow-hidden group hover:border-neon-green/30 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-2 bg-neon-green/10 rounded-lg">
                    <Mail className="w-5 h-5 text-neon-green" />
                </div>
                <h3 className="text-lg font-bold text-white">Email Service Config</h3>
            </div>

            <div className="space-y-4 relative z-10">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-gray-400 block mb-1">SMTP Host</label>
                        <input
                            type="text"
                            value={config.host}
                            onChange={(e) => setConfig({ ...config, host: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-neon-green focus:border-neon-green outline-none transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 block mb-1">Port</label>
                        <input
                            type="text"
                            value={config.port}
                            onChange={(e) => setConfig({ ...config, port: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-neon-green focus:border-neon-green outline-none transition-colors"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-gray-400 block mb-1">Username</label>
                        <input
                            type="text"
                            value={config.user}
                            onChange={(e) => setConfig({ ...config, user: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-neon-green focus:border-neon-green outline-none transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 block mb-1">Password</label>
                        <input
                            type="password"
                            value={config.pass}
                            onChange={(e) => setConfig({ ...config, pass: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-neon-green focus:border-neon-green outline-none transition-colors"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 bg-neon-green/10 hover:bg-neon-green/20 text-neon-green px-4 py-2 rounded-lg transition-colors border border-neon-green/30 disabled:opacity-50"
                    >
                        {loading ? <div className="w-4 h-4 border-2 border-neon-green border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                        {loading ? 'Saving...' : 'Save Configuration'}
                    </button>

                    {saved && (
                        <div className="flex items-center gap-2 text-xs text-green-400 animate-fade-in">
                            <CheckCircle className="w-3 h-3" />
                            Settings Saved
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
