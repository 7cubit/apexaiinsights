import React, { useState } from 'react';
import { MessageSquare, Send, ThumbsUp } from 'lucide-react';

export const FeedbackForm = () => {
    const [sent, setSent] = useState(false);
    const [feedback, setFeedback] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!feedback.trim()) return;

        // Mock Send
        setSent(true);
        setFeedback('');
        setTimeout(() => setSent(false), 3000);
    };

    return (
        <div className="p-6 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Share Feedback</h3>
            </div>

            <div className="relative z-10">
                {sent ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center animate-fade-in">
                        <div className="p-3 bg-neon-green/10 rounded-full mb-3">
                            <ThumbsUp className="w-6 h-6 text-neon-green" />
                        </div>
                        <p className="text-white font-medium">Thank you!</p>
                        <p className="text-sm text-gray-400">Your feedback helps us improve Apex.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Tell us what you love or what we should improve..."
                            className="w-full h-32 bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-gray-200 focus:border-purple-500 outline-none transition-colors resize-none"
                        />
                        <button
                            type="submit"
                            className="w-full flex items-center justify-center gap-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 px-4 py-2 rounded-lg transition-colors border border-purple-500/30"
                        >
                            <Send className="w-4 h-4" />
                            Send Feedback
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};
