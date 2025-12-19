import { Search, Sparkles } from 'lucide-react';

export default function CommandBar() {
    return (
        <div className="w-full max-w-2xl mx-auto mb-8 relative">
            <div className="relative group">
                {/* Dynamic Background Glow */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-green to-neon-purple rounded-2xl blur opacity-10 group-hover:opacity-25 transition duration-1000 group-hover:duration-200"></div>

                <div className="relative flex items-center bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)] focus-within:border-neon-green/40 transition-all duration-300">
                    <div className="pl-5 text-neon-green drop-shadow-[0_0_8px_rgba(0,242,234,0.5)]">
                        <Sparkles size={22} />
                    </div>

                    <input
                        type="text"
                        placeholder="Ask Apex: 'How many visitors from Tokyo last week?'"
                        style={{ background: 'transparent', border: 'none', outline: 'none' }}
                        className="w-full bg-transparent text-white placeholder-white/30 px-5 py-4.5 text-lg font-normal tracking-wide"
                    />

                    <div className="pr-5 flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] text-white/50 font-bold tracking-tighter uppercase backdrop-blur-sm">
                            <span className="opacity-70">⌘</span>
                            <span>K</span>
                        </div>
                        <button className="flex items-center justify-center w-10 h-10 rounded-xl bg-neon-green/5 hover:bg-neon-green/20 border border-neon-green/20 text-neon-green transition-all duration-300 shadow-inner">
                            <Search size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
