import { useState, useEffect } from 'react';
import { Shield, Lock, AlertTriangle, Search, Activity, Trash2, Loader2 } from 'lucide-react';

export default function SecurityCenter() {
    const [auditLog, setAuditLog] = useState([]);

    interface ScanResult {
        safe?: boolean;
        threat?: string;
        note?: string;
        error?: string;
    }
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);

    const [scanUrl, setScanUrl] = useState('http://testsafebrowsing.appspot.com/s/malware.html');
    const [gdprMode, setGdprMode] = useState(false);
    const [deletionEmail, setDeletionEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [logsLoading, setLogsLoading] = useState(true);

    // @ts-ignore
    const apiRoot = window.apexConfig?.tunnel_url || '/apex/v1/tunnel';

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLogsLoading(true);
        try {
            const res = await fetch(`${apiRoot}?path=/v1/security/audit`);
            if (res.ok) {
                const data = await res.json();
                setAuditLog(data || []);
            }
        } catch (e) {
            console.error("Failed to fetch logs", e);
        }
        setLogsLoading(false);
    };

    const handleScan = async () => {
        setLoading(true);
        setScanResult(null);
        try {
            const res = await fetch(`${apiRoot}?path=/v1/security/scan&url=${encodeURIComponent(scanUrl)}`);
            const data = await res.json();
            setScanResult(data);
        } catch (e) {
            setScanResult({ error: "Scan failed" });
        }
        setLoading(false);
        fetchLogs(); // refresh logs as scan likely logged something
    };

    const handleDeletionRequest = async () => {
        if (!deletionEmail) return;
        try {
            await fetch(`${apiRoot}?path=/v1/compliance/delete&email=${encodeURIComponent(deletionEmail)}`, { method: 'POST' });
            alert("Request logged.");
            setDeletionEmail('');
            fetchLogs();
        } catch (e) {
            alert("Error sending request");
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        Security & Compliance Center
                    </h1>
                    <p className="text-slate-400 mt-1">Protect your site and ensure regulatory compliance.</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 text-sm font-medium">System Secure</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Malware Scanner */}
                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-red-500/20 rounded-lg">
                            <Search className="w-5 h-5 text-red-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white">Malware Scanner</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input
                                value={scanUrl}
                                onChange={(e) => setScanUrl(e.target.value)}
                                className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-red-500 transition-colors"
                                placeholder="https://example.com"
                            />
                            <button
                                onClick={handleScan}
                                disabled={loading}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                {loading ? 'Scanning...' : 'Scan URL'}
                            </button>
                        </div>

                        {scanResult && (
                            <div className={`p-4 rounded-lg border ${!scanResult.safe ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
                                {scanResult.safe ? (
                                    <div className="flex items-center gap-2 text-green-400">
                                        <Shield className="w-5 h-5" />
                                        <span className="font-semibold">Safe. No threats detected.</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-red-400">
                                        <AlertTriangle className="w-5 h-5" />
                                        <span className="font-semibold">THREAT DETECTED: {scanResult.threat || 'Malware or Social Engineering'}</span>
                                    </div>
                                )}
                                {scanResult.note && <p className="text-xs text-slate-400 mt-1">{scanResult.note}</p>}
                            </div>
                        )}

                        <p className="text-xs text-slate-500">
                            Powered by Google Safe Browsing API. Checks external links for malware and phishing content.
                        </p>
                    </div>
                </div>

                {/* Privacy Controls */}
                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Lock className="w-5 h-5 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white">GDPR Compliance</h3>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                            <div>
                                <h4 className="text-white font-medium">GDPR Mode</h4>
                                <p className="text-xs text-slate-400">Redact IPs and User-Agents from all analytics collection.</p>
                            </div>
                            <button
                                onClick={() => setGdprMode(!gdprMode)}
                                className={`relative w-11 h-6 transition-colors rounded-full ${gdprMode ? 'bg-blue-500' : 'bg-slate-600'}`}
                            >
                                <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${gdprMode ? 'translate-x-5' : ''}`} />
                            </button>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-slate-300">Data Deletion Request (Right to be Forgotten)</h4>
                            <div className="flex gap-2">
                                <input
                                    value={deletionEmail}
                                    onChange={(e) => setDeletionEmail(e.target.value)}
                                    placeholder="user@example.com"
                                    className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200"
                                />
                                <button
                                    onClick={handleDeletionRequest}
                                    className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Audit Log */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-amber-500/20 rounded-lg">
                        <Activity className="w-5 h-5 text-amber-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Audit Log</h3>
                </div>

                <div className="overflow-x-auto">
                    {logsLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-700 text-slate-400 text-sm">
                                    <th className="py-3 px-4">Timestamp</th>
                                    <th className="py-3 px-4">Actor</th>
                                    <th className="py-3 px-4">Action</th>
                                    <th className="py-3 px-4">Target Resource</th>
                                    <th className="py-3 px-4">Details</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-300 text-sm divide-y divide-slate-800">
                                {auditLog.length === 0 ? (
                                    <tr><td colSpan={5} className="py-4 text-center text-slate-500">No logs found</td></tr>
                                ) : (
                                    auditLog.map((log: any) => (
                                        <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="py-3 px-4">{new Date(log.created_at).toLocaleString()}</td>
                                            <td className="py-3 px-4">
                                                <span className="px-2 py-0.5 rounded bg-slate-700 text-xs">{log.actor}</span>
                                            </td>
                                            <td className="py-3 px-4 font-medium">{log.action}</td>
                                            <td className="py-3 px-4 font-mono text-xs text-slate-400">{log.target_resource}</td>
                                            <td className="py-3 px-4 text-slate-400">{log.details}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
