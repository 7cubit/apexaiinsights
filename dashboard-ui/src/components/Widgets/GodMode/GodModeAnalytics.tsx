import { useState, useEffect } from 'react';
import { Terminal, Zap, Activity, Globe, Power } from 'lucide-react';

export default function GodModeAnalytics() {
    const [instances, setInstances] = useState([]);
    const [selectedInstance, setSelectedInstance] = useState<any>(null);
    const [command, setCommand] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchInstances();
        const interval = setInterval(fetchInstances, 10000); // Poll status
        return () => clearInterval(interval);
    }, []);

    const fetchInstances = async () => {
        try {
            const res = await fetch('http://localhost:8080/v1/god/instances');
            const data = await res.json();
            setInstances(data || []);
        } catch (e) {
            console.error("Failed to fetch instances", e);
        }
    };

    const sendCommand = async () => {
        if (!selectedInstance || !command) return;
        setLoading(true);
        try {
            await fetch('http://localhost:8080/v1/god/command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    instance_id: selectedInstance.id,
                    command: 'shell', // generic shell for now
                    payload: command
                })
            });
            alert(`Command "${command}" queued for ${selectedInstance.domain}`);
            setCommand('');
        } catch (e) {
            alert("Command failed");
        }
        setLoading(false);
    };

    const handleGlobalUpdate = async () => {
        if (!confirm("Are you sure you want to trigger plugin updates for ALL instances?")) return;
        // Loop through all (naive approach)
        instances.forEach(async (inst: any) => {
            await fetch('http://localhost:8080/v1/god/command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    instance_id: inst.id,
                    command: 'update_plugin',
                    payload: 'latest'
                })
            });
        });
        alert("Global update queued.");
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        God Mode Controller
                    </h1>
                    <p className="text-slate-400 mt-1">Multi-site management and remote execution.</p>
                </div>
                <button
                    onClick={handleGlobalUpdate}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg transition-all"
                >
                    <Zap className="w-4 h-4" />
                    <span className="font-medium">Update All Plugins</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Instance Grid */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {instances.length === 0 ? (
                        <div className="col-span-full p-8 text-center text-slate-500 border border-slate-700 rounded-xl border-dashed">
                            No instances connected yet. <br />
                            <span className="text-xs">Configure plugins to point to /v1/god/connect</span>
                        </div>
                    ) : instances.map((inst: any) => (
                        <div
                            key={inst.id}
                            onClick={() => setSelectedInstance(inst)}
                            className={`cursor-pointer group relative overflow-hidden bg-slate-900/50 backdrop-blur-md border rounded-xl p-4 transition-all hover:border-purple-500/50 ${selectedInstance?.id === inst.id ? 'border-purple-500 ring-1 ring-purple-500/50' : 'border-slate-700'}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                                    <Globe className="w-5 h-5 text-purple-400" />
                                </div>
                                <div className={`px-2 py-1 rounded-full text-xs font-medium border ${inst.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                                    {inst.status.toUpperCase()}
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold text-white mb-1 truncate">{inst.domain}</h3>
                            <div className="flex justify-between items-end">
                                <div className="text-xs text-slate-400">
                                    v{inst.plugin_version} • <span className={inst.seconds_since_heartbeat < 30 ? "text-green-400" : "text-amber-400"}>
                                        {inst.seconds_since_heartbeat}s ago
                                    </span>
                                </div>
                                <Activity className="w-4 h-4 text-slate-600" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Command Terminal */}
                <div className="lg:col-span-1 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col h-[500px]">
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
                        <Terminal className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-mono text-slate-300">
                            {selectedInstance ? `root@${selectedInstance.domain}:~` : "Select an instance..."}
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto font-mono text-xs text-slate-400 space-y-2 mb-4">
                        <div className="text-slate-500"># System Ready.</div>
                        {selectedInstance && (
                            <>
                                <div className="text-green-400">$ connected directly to {selectedInstance.domain}</div>
                                <div className="text-slate-500">Waiting for input...</div>
                            </>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <input
                            value={command}
                            onChange={(e) => setCommand(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendCommand()}
                            disabled={!selectedInstance || loading}
                            className="flex-1 bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-sm text-green-400 font-mono focus:outline-none focus:border-purple-500"
                            placeholder={selectedInstance ? "Enter command..." : "Select instance first"}
                        />
                        <button
                            onClick={sendCommand}
                            disabled={!selectedInstance || loading}
                            className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-md disabled:opacity-50"
                        >
                            <Power className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                        <button onClick={() => setCommand('flush_cache')} className="px-2 py-1 bg-slate-800 text-xs text-slate-300 rounded hover:bg-slate-700">Quick: Flush Cache</button>
                        <button onClick={() => setCommand('debug_mode_on')} className="px-2 py-1 bg-slate-800 text-xs text-slate-300 rounded hover:bg-slate-700">Quick: Debug On</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
