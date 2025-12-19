import { useState, useEffect } from 'react';
import { Code, Webhook, Key, Database, Play, Plus, Copy } from 'lucide-react';

export default function DeveloperCenter() {
    interface WebhookItem {
        id: number;
        target_url: string;
        event_types: string;
        is_active: boolean;
        secret: string;
    }

    const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
    const [apiKey] = useState('apx_live_7x9s8d6f5g4h3j2k1l'); // Mock for now
    const [showKey, setShowKey] = useState(false);
    const [newHookUrl, setNewHookUrl] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchWebhooks();
    }, []);

    const fetchWebhooks = async () => {
        try {
            const res = await fetch('http://localhost:8080/v1/dev/webhooks');
            if (res.ok) {
                const data = await res.json();
                setWebhooks(data || []);
            }
        } catch (e) {
            console.error("Failed to fetch webhooks", e);
        }
    };

    const handleCreateWebhook = async () => {
        if (!newHookUrl) return;
        setLoading(true);
        try {
            await fetch('http://localhost:8080/v1/dev/webhooks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    target_url: newHookUrl,
                    event_types: '["alert", "report"]'
                })
            });
            setNewHookUrl('');
            fetchWebhooks();
        } catch (e) {
            alert("Failed to create webhook");
        }
        setLoading(false);
    };

    const handleTestWebhook = async (id: number) => {
        try {
            await fetch(`http://localhost:8080/v1/dev/webhooks/${id}/test`, { method: 'POST' });
            alert("Test payload sent!");
        } catch (e) {
            alert("Test failed");
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Developer Platform
                    </h1>
                    <p className="text-slate-400 mt-1">Build integrations, manage webhooks, and access your data.</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full">
                    <Code className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-400 text-sm font-medium">v1.0.0 Alpha</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* API Credentials */}
                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Key className="w-5 h-5 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white">API Credentials</h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-slate-400 uppercase">Public API Key</label>
                            <div className="flex gap-2 mt-1">
                                <div className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 font-mono text-sm text-slate-300 relative group">
                                    {showKey ? apiKey : 'apx_live_••••••••••••••••••••••'}
                                </div>
                                <button
                                    onClick={() => setShowKey(!showKey)}
                                    className="p-2 hover:bg-slate-700 rounded-lg text-slate-400"
                                >
                                    {showKey ? 'Hide' : 'Show'}
                                </button>
                                <button
                                    onClick={() => navigator.clipboard.writeText(apiKey)}
                                    className="p-2 hover:bg-slate-700 rounded-lg text-slate-400"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                Use this key to authenticate requests to <span className="font-mono text-purple-400">/v1/public/*</span> endpoints.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Webhooks Manager */}
                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-pink-500/20 rounded-lg">
                            <Webhook className="w-5 h-5 text-pink-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white">Webhooks</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input
                                value={newHookUrl}
                                onChange={(e) => setNewHookUrl(e.target.value)}
                                placeholder="https://api.myapp.com/webhook"
                                className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200"
                            />
                            <button
                                onClick={handleCreateWebhook}
                                disabled={loading}
                                className="px-3 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add
                            </button>
                        </div>

                        <div className="space-y-2 mt-4 max-h-60 overflow-y-auto">
                            {webhooks.length === 0 ? (
                                <p className="text-center text-slate-500 py-4 text-sm">No webhooks configured</p>
                            ) : (
                                webhooks.map((hook) => (
                                    <div key={hook.id} className="flex items-center justify-between p-3 bg-slate-800/30 border border-slate-700 rounded-lg">
                                        <div className="min-w-0 flex-1 mr-4">
                                            <p className="text-sm font-medium text-slate-200 truncate">{hook.target_url}</p>
                                            <p className="text-xs text-slate-500 font-mono mt-0.5">Secret: {hook.secret.substring(0, 8)}...</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleTestWebhook(hook.id)}
                                                className="p-1.5 hover:bg-slate-700 rounded-md text-slate-400 hover:text-white"
                                                title="Send Test Event"
                                            >
                                                <Play className="w-3 h-3" />
                                            </button>
                                            <div className={`w-2 h-2 rounded-full ${hook.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Documentation / Helper */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                        <Database className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">GraphQL Playground</h3>
                </div>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <p className="text-sm text-slate-400 mb-2">Endpoint: <span className="font-mono text-emerald-400">/v1/dev/graphql</span></p>
                    <pre className="font-mono text-xs text-emerald-300 bg-slate-900/50 p-3 rounded">
                        {`query {
  site {
    visitors
    revenue
  }
}`}
                    </pre>
                </div>
            </div>
        </div>
    );
}
