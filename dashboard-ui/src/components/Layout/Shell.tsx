import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import { Bell, Search } from 'lucide-react';

interface ShellProps {
    children: ReactNode;
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export default function Shell({ children, activeTab, setActiveTab }: ShellProps) {
    const isWP = !!(window as any).apexConfig;

    return (
        <div className={`flex h-screen bg-midnight text-white overflow-hidden ${isWP ? 'wp-integrated' : ''}`}>
            {!isWP && <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />}

            <main className="flex-1 flex flex-col relative overflow-hidden">
                {/* Top Bar - Hide in WP as it overlaps or is redundant */}
                {!isWP && (
                    <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-midnight/50 backdrop-blur-sm z-40">
                        <div className="flex items-center gap-4 text-gray-400">
                            <span className="text-sm font-medium">Dashboard</span>
                            <span className="text-white/20">/</span>
                            <span className="text-sm text-white capitalize">{activeTab}</span>
                        </div>

                        <div className="flex items-center gap-6">
                            {/* System Status */}
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-green/10 border border-neon-green/20">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green"></span>
                                </span>
                                <span className="text-xs font-medium text-neon-green tracking-wide uppercase">System Operational</span>
                            </div>

                            <div className="flex items-center gap-4">
                                <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white">
                                    <Search size={20} />
                                </button>
                                <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white relative">
                                    <Bell size={20} />
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-neon-purple rounded-full border border-midnight" />
                                </button>
                            </div>
                        </div>
                    </header>
                )}

                {/* Content Area */}
                <div className="flex-1 overflow-auto p-8 relative">
                    {/* Background Ambient Glow */}
                    <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
                        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-neon-purple/5 rounded-full blur-[120px]" />
                        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-neon-green/5 rounded-full blur-[100px]" />
                    </div>

                    <div className="relative z-10 max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
