import { Calendar, ChevronDown, Check } from 'lucide-react';
import { useState } from 'react';

interface DateRangePickerProps {
    range: string;
    setRange: (range: string) => void;
}

export default function DateRangePicker({ range, setRange }: DateRangePickerProps) {
    const [isOpen, setIsOpen] = useState(false);

    const options = [
        { label: 'Last 7 Days', value: '7d' },
        { label: 'Last 30 Days', value: '30d' },
        { label: 'Last 90 Days', value: '90d' },
    ];

    const currentLabel = options.find(opt => opt.value === range)?.label || 'Select Range';

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 bg-white/5 hover:bg-white/10 backdrop-blur-md transition-all duration-300 border border-white/10 hover:border-white/20 rounded-xl px-5 py-2.5 text-sm font-medium text-white/70 hover:text-white shadow-lg group"
            >
                <Calendar size={18} className="text-neon-purple drop-shadow-[0_0_8px_rgba(112,0,255,0.4)]" />
                <span className="tracking-wide">{currentLabel}</span>
                <ChevronDown size={16} className={`ml-1 text-white/30 group-hover:text-white/50 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full right-0 mt-2 w-56 glass-card p-2 z-50 border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in duration-200 origin-top-right">
                        <div className="text-[10px] font-bold text-white/30 mb-2 px-3 uppercase tracking-widest">Timeframe Selection</div>
                        <div className="space-y-1">
                            {options.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => {
                                        setRange(opt.value);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group ${range === opt.value ? 'bg-neon-purple/20 text-white' : 'hover:bg-white/5 text-white/60 hover:text-white'}`}
                                >
                                    <span className="text-sm font-medium">{opt.label}</span>
                                    {range === opt.value && <Check size={14} className="text-neon-purple shadow-[0_0_8px_rgba(112,0,255,0.5)]" />}
                                </button>
                            ))}
                        </div>

                        <div className="mt-2 pt-2 border-t border-white/5">
                            <div className="text-[10px] font-bold text-white/20 mb-2 px-3 uppercase tracking-widest">AI Presets</div>
                            <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-xs text-white/40 hover:text-white/70 transition-colors">"Since last major update"</button>
                            <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-xs text-white/40 hover:text-white/70 transition-colors">"During seasonal peak"</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

