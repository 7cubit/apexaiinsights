import { useState } from 'react';
import { Shield, Save, CheckCircle, Trash2 } from 'lucide-react';

export const GDPRSettings = () => {
    const [isGhostMode, setIsGhostMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setLoading(true);
        // Mock saving to WP options
        setTimeout(() => {
            setLoading(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }, 1000);
    };

    return (
        <div className="p-6 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl relative overflow-hidden group hover:border-neon-purple/30 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-2 bg-neon-purple/10 rounded-lg">
                    <Shield className="w-5 h-5 text-neon-purple" />
                </div>
                <h3 className="text-lg font-bold text-white">Compliance & GDPR</h3>
            </div>

            <div className="space-y-6 relative z-10">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                    <div>
                        <p className="text-sm font-medium text-white">GDPR Ghost Mode</p>
                        <p className="text-xs text-gray-400">Instantly hash IP addresses for maximum privacy.</p>
                    </div>
                    <button
                        onClick={() => setIsGhostMode(!isGhostMode)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${isGhostMode ? 'bg-neon-purple' : 'bg-gray-700'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isGhostMode ? 'left-7' : 'left-1'}`} />
                    </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                    <div>
                        <p className="text-sm font-medium text-white">Data Subject Requests</p>
                        <p className="text-xs text-gray-400">Process "Right to be Forgotten" deletions.</p>
                    </div>
                    <button className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg border border-red-500/20 transition-colors flex items-center gap-2">
                        <Trash2 className="w-3 h-3" />
                        Purge Data
                    </button>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 bg-neon-purple/10 hover:bg-neon-purple/20 text-neon-purple px-4 py-2 rounded-lg transition-colors border border-neon-purple/30 disabled:opacity-50"
                    >
                        {loading ? <div className="w-4 h-4 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                        {loading ? 'Saving...' : 'Update Policy'}
                    </button>

                    {saved && (
                        <div className="flex items-center gap-2 text-xs text-green-400 animate-fade-in">
                            <CheckCircle className="w-3 h-3" />
                            Policy Updated
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
