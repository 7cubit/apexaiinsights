import React, { useState } from 'react';

// Mock Component for now, just the UI shell
const SegmentBuilder: React.FC = () => {
    const [segmentName, setSegmentName] = useState('');
    const [criteria, setCriteria] = useState('');

    const handleSave = () => {
        console.log('Saving segment:', segmentName, criteria);
        // Implement API call to save to wp_apex_segments
    };

    return (
        <div className="w-[350px] p-6 glass-card border border-white/10 bg-black/20 backdrop-blur-md rounded-lg">
            <div className="mb-4">
                <h3 className="text-lg font-medium text-white">Create Segment</h3>
                <p className="text-sm text-gray-400">Define criteria to group users.</p>
            </div>
            <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                    <label htmlFor="name" className="text-sm font-medium text-gray-300">Name</label>
                    <input
                        id="name"
                        placeholder="e.g. VIP Customers"
                        value={segmentName}
                        onChange={(e) => setSegmentName(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
                <div className="flex flex-col space-y-1.5">
                    <label htmlFor="criteria" className="text-sm font-medium text-gray-300">Criteria (JSON)</label>
                    <input
                        id="criteria"
                        placeholder='{"country": "US", "visits": ">5"}'
                        value={criteria}
                        onChange={(e) => setCriteria(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
            </div>
            <div className="flex justify-between mt-6">
                <button className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    className="px-4 py-2 text-sm font-medium bg-emerald-500 text-black hover:bg-emerald-400 rounded-md transition-colors"
                >
                    Save
                </button>
            </div>
        </div>
    );
};

export default SegmentBuilder;
