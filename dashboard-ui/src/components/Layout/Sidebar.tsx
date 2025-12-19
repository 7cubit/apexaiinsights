import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    BarChart2,
    Users,
    Settings,
    ChevronLeft,
    ChevronRight,
    Globe,
    Zap,
    Shield,
    Code,
    ShoppingCart
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', id: 'overview' },
    { icon: Users, label: 'Visitors', id: 'segmentation' },
    { icon: Globe, label: 'Real-time', id: 'live' }, // Note: App.tsx might not have 'live' tab explicitly, might need to map to overview or create it
    { icon: BarChart2, label: 'Analytics', id: 'performance' },
    { icon: ShoppingCart, label: 'WooCommerce', id: 'woocommerce' },
    { icon: Settings, label: 'Settings', id: 'settings' },
    { icon: Zap, label: 'Automation', id: 'automation' },
    { icon: Code, label: 'Developer', id: 'developer' },
    { icon: Shield, label: 'Security', id: 'security' },
];

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <motion.div
            initial={{ width: 240 }}
            animate={{ width: collapsed ? 80 : 240 }}
            className="h-screen bg-midnight-light/50 backdrop-blur-xl border-r border-white/5 flex flex-col relative z-50 transition-all duration-300"
        >
            {/* Logo Area */}
            <div className="h-16 flex items-center justify-center border-b border-white/5 relative">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-neon-green to-neon-blue flex items-center justify-center shadow-neon-green">
                        <Zap className="w-5 h-5 text-midnight fill-current" />
                    </div>
                    {!collapsed && (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="font-display font-bold text-xl tracking-tight"
                        >
                            Apex<span className="text-neon-green">AI</span>
                        </motion.span>
                    )}
                </div>

                {/* Collapse Toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-6 w-6 h-6 bg-surface-200 rounded-full flex items-center justify-center border border-white/10 hover:bg-neon-green hover:text-midnight transition-colors"
                >
                    {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id === 'live' ? 'overview' : item.id)} // Specific override for 'live' if generic
                        className={clsx(
                            "w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                            activeTab === item.id
                                ? "bg-white/10 text-white shadow-lg shadow-black/20"
                                : "text-gray-400 hover:bg-white/5 hover:text-white"
                        )}
                    >
                        {activeTab === item.id && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-neon-green rounded-r-full shadow-neon-green" />
                        )}

                        <item.icon
                            size={20}
                            className={clsx(
                                "transition-colors",
                                activeTab === item.id ? "text-neon-green" : "group-hover:text-white"
                            )}
                        />

                        {!collapsed && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="font-medium text-sm text-left truncate"
                            >
                                {item.label}
                            </motion.span>
                        )}
                    </button>
                ))}
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-white/5">
                <div className={clsx("flex items-center gap-3", collapsed ? "justify-center" : "")}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-surface-200 to-surface-300 border border-white/10" />
                    {!collapsed && (
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-white">Admin User</span>
                            <span className="text-xs text-gray-500 capitalize">
                                {((window as any).apexConfig?.plan || 'pro')} Plan
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
