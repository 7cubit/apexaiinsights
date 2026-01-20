import React, { useState } from 'react';

import { metricsApi } from '../../../services/api';

interface SegmentBuilderProps {
    onSave?: (segment: any) => void;
    onCancel?: () => void;
}

const SegmentBuilder: React.FC<SegmentBuilderProps> = ({ onSave, onCancel }) => {
    const [segmentName, setSegmentName] = useState('');
    const [criteria, setCriteria] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!segmentName || !criteria) return;
        setLoading(true);
        try {
            const result = await metricsApi.createSegment({ name: segmentName, criteria });
            if (onSave) onSave(result);
        } catch (e) {
            console.error("Save failed", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full p-6 glass-card border border-white/10 bg-black/40 backdrop-blur-xl rounded-2xl shadow-2xl">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-1">Create Audience Segment</h3>
                <p className="text-sm text-slate-400">Target specific groups of users based on behavior.</p>
            </div>

            <div className="space-y-5">
                <div className="space-y-2">
                    <label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Segment Name</label>
                    <input
                        id="name"
                        placeholder="e.g. High-Value Tech Companies"
                        value={segmentName}
                        onChange={(e) => setSegmentName(e.target.value)}
                        className="flex h-12 w-full rounded-xl border border-white/5 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="criteria" className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Targeting Criteria (JSON)</label>
                    <textarea
                        id="criteria"
                        placeholder='{"industry": "Technology", "visits": ">5"}'
                        rows={4}
                        value={criteria}
                        onChange={(e) => setCriteria(e.target.value)}
                        className="flex w-full rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-mono"
                    />
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-white/5">
                <button
                    onClick={onCancel}
                    className="px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                >
                    Discard
                </button>
                <button
                    onClick={handleSave}
                    disabled={loading || !segmentName || !criteria}
                    className="px-6 py-2.5 text-sm font-bold bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                >
                    {loading ? 'Creating...' : 'Save Segment'}
                </button>
            </div>
        </div>
    );
};

export default SegmentBuilder;
