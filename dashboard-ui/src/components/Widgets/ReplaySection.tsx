import { useState, useEffect } from 'react';
import { Play, Monitor, User, Film, X } from 'lucide-react';
import { ReplayPlayer } from './ReplayPlayer';
import axios from 'axios';

interface Recording {
    sid: string;
    started_at: string;
    last_active: string;
    chunks: number;
    is_active?: boolean;
}

export const ReplaySection = () => {
    const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'rage' | 'errors'>('all');
    const [recordings, setRecordings] = useState<Recording[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [sessionEvents, setSessionEvents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPlayerOpen, setIsPlayerOpen] = useState(false);

    useEffect(() => {
        // Fetch list of recordings
        // @ts-ignore
        const apiRoot = window.apexConfig?.api_root || '/wp-json/apex/v1';
        // @ts-ignore
        const nonce = window.apexConfig?.nonce || '';

        const filterParam = activeFilter === 'all' ? '' : `?filter=${activeFilter}`;

        setIsLoading(true);
        axios.get(`${apiRoot}/replay/list${filterParam}`, {
            headers: { 'X-WP-Nonce': nonce }
        }).then(res => {
            if (Array.isArray(res.data)) {
                setRecordings(res.data);
            }
        }).catch(err => console.error("Failed to fetch recordings", err))
            .finally(() => setIsLoading(false));
    }, [activeFilter]);

    const loadSession = (sid: string) => {
        setSelectedSessionId(sid);
        setSessionEvents([]);
        setIsPlayerOpen(true); // Open Modal
        setIsLoading(true);

        // @ts-ignore
        const apiRoot = window.apexConfig?.api_root || '/wp-json/apex/v1';
        // @ts-ignore
        const nonce = window.apexConfig?.nonce || '';

        axios.get(`${apiRoot}/replay/${sid}`, {
            headers: { 'X-WP-Nonce': nonce }
        }).then(res => {
            if (res.data.events) {
                setSessionEvents(res.data.events);
            }
        }).catch(err => console.error("Failed to load session", err))
            .finally(() => setIsLoading(false));
    };

    const closePlayer = () => {
        setIsPlayerOpen(false);
        setSessionEvents([]);
        setSelectedSessionId(null);
    };

    return (
        <div className="space-y-6">
            {isLoading && !isPlayerOpen && <div className="absolute top-0 right-0 p-2 text-xs text-emerald-500 animate-pulse">Loading...</div>}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                    Session Replays (Beta)
                </h2>
                <span className="text-xs text-emerald-500/60 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                    {activeFilter === 'active' ? 'Live Monitoring' : 'Archive Mode'}
                </span>
            </div>

            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {[
                    { id: 'all', label: 'All Sessions', icon: Film },
                    { id: 'active', label: 'Active Now', icon: Monitor },
                    { id: 'rage', label: 'Rage Clicks', icon: User },
                    { id: 'errors', label: 'Start w/ Errors', icon: User },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveFilter(tab.id as any)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeFilter === tab.id
                            ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        <tab.icon className="w-3 h-3" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Session Grid List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recordings.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-gray-600 italic text-sm border border-white/5 rounded-xl bg-white/5">
                        No recordings found for this filter.
                    </div>
                ) : (
                    recordings.map((rec) => (
                        <button
                            key={rec.sid}
                            onClick={() => loadSession(rec.sid)}
                            className="bg-black/40 backdrop-blur-sm p-4 rounded-xl border border-white/5 hover:border-emerald-500/30 base-transition group text-left relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-white/5 rounded-full group-hover:bg-emerald-500/20 transition-colors">
                                        <User className="w-4 h-4 text-gray-400 group-hover:text-emerald-400" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-mono text-gray-400">ID: {rec.sid.substring(0, 8)}</div>
                                        <div className="text-[10px] text-gray-600">{new Date(rec.started_at).toLocaleString()}</div>
                                    </div>
                                </div>
                                {rec.last_active && (new Date().getTime() - new Date(rec.last_active).getTime() < 60000) && (
                                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold animate-pulse bg-emerald-500/10 px-2 py-0.5 rounded">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                        LIVE
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                                <div className="text-[10px] text-gray-500">{rec.chunks} events captured</div>
                                <div className="flex items-center gap-1 text-xs text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Play className="w-3 h-3" /> Watch
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>

            {/* Player Modal */}
            {isPlayerOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-10">
                    <div className="bg-midnight border border-white/10 rounded-2xl w-full h-full max-w-6xl flex flex-col shadow-2xl overflow-hidden relative">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
                            <div className="flex items-center gap-3">
                                <Monitor className="w-5 h-5 text-emerald-400" />
                                <div>
                                    <h3 className="text-sm font-bold text-white">Session Replay</h3>
                                    <p className="text-xs text-gray-500 font-mono">{selectedSessionId}</p>
                                </div>
                            </div>
                            <button onClick={closePlayer} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Player Body */}
                        <div className="flex-1 bg-black relative flex items-center justify-center p-4 overflow-hidden">
                            {isLoading && sessionEvents.length === 0 ? (
                                <div className="flex flex-col items-center gap-3 text-emerald-400 animate-pulse">
                                    <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                    <span className="text-sm">Downloading session stream...</span>
                                </div>
                            ) : (
                                <ReplayPlayer events={sessionEvents} />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
