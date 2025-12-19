import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { metricsApi } from '../../services/api';
import clsx from 'clsx';

interface Message {
    id: string;
    role: 'user' | 'agent';
    content: string;
    data?: any[];
    query?: string;
    timestamp: Date;
}

const SUGGESTIONS = [
    "Why is traffic down?",
    "Show top landing pages",
    "Visitors from France?",
    "How many bounce sessions?"
];

export default function ChatInterface() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const config = (window as any).apexConfig || {};
    const currentPlan = (config.plan || 'pro').toLowerCase();
    const isPro = currentPlan !== 'plus';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async (text: string) => {
        if (!text.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsLoading(true);

        try {
            const resp = await metricsApi.askAgent(text);
            const agentMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'agent',
                content: resp.answer || "I processed your request.",
                data: resp.data,
                query: resp.query,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, agentMsg]);
        } catch (err: any) {
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'agent',
                content: "Sorry, I encountered an error communicating with the intelligence engine.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Floating Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-neon-purple rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(189,52,254,0.4)] hover:shadow-[0_0_30px_rgba(189,52,254,0.6)] transition-all z-50 border border-white/20"
            >
                <Sparkles className="text-white" size={24} />
            </motion.button>

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className="fixed bottom-24 right-6 w-[400px] h-[600px] glass-card flex flex-col z-50 shadow-2xl overflow-hidden border border-neon-purple/30"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full animate-pulse ${isPro ? 'bg-neon-purple' : 'bg-emerald-500'}`} />
                                <h3 className="font-display font-medium text-white">Nexus Intelligence</h3>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${isPro ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    }`}>
                                    {currentPlan}
                                </span>
                            </div>
                            <button onClick={() => setMessages([])} className="text-gray-500 hover:text-white transition-colors" title="Clear Chat">
                                <RefreshCw size={14} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.length === 0 && (
                                <div className="text-center mt-20 opacity-50">
                                    <Sparkles size={48} className="mx-auto mb-4 text-neon-purple/50" />
                                    <p className="text-sm text-gray-400">Ask me anything about your analytics.</p>
                                </div>
                            )}

                            {messages.map(msg => (
                                <div key={msg.id} className={clsx("flex flex-col max-w-[85%]", msg.role === 'user' ? "self-end items-end" : "self-start items-start")}>
                                    <div
                                        className={clsx(
                                            "p-3 rounded-2xl text-sm leading-relaxed",
                                            msg.role === 'user'
                                                ? "bg-neon-purple text-white rounded-br-none"
                                                : "glass-card border border-white/10 text-gray-200 rounded-bl-none"
                                        )}
                                    >
                                        {msg.content}
                                    </div>
                                    {msg.role === 'agent' && msg.query && (
                                        <div className="mt-2 text-[10px] font-mono text-gray-500 bg-black/30 p-2 rounded w-full overflow-x-auto">
                                            SQL: {msg.query}
                                        </div>
                                    )}
                                    <span className="text-[10px] text-gray-600 mt-1 px-1">
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="self-start glass-card p-3 rounded-2xl rounded-bl-none flex gap-1 items-center">
                                    <div className="w-2 h-2 bg-neon-purple/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-neon-purple/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-neon-purple/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Suggestions Chips */}
                        {!inputValue && messages.length < 2 && (
                            <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar mask-gradient-r">
                                {SUGGESTIONS.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => handleSend(s)}
                                        className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-neon-purple transition-colors flex-shrink-0"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-md">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
                                    placeholder="Trace specific events..."
                                    className="w-full bg-surface-200 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple/50 transition-colors"
                                />
                                <button
                                    onClick={() => handleSend(inputValue)}
                                    disabled={!inputValue.trim()}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-neon-purple/20 text-neon-purple hover:bg-neon-purple hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                            <div className="text-[10px] text-gray-600 mt-2 text-center flex items-center justify-center gap-1">
                                Powered by GPT-4o <span className="w-1 h-1 rounded-full bg-green-500" />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
