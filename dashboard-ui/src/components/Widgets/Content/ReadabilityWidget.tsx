import { motion } from 'framer-motion';
import { BookOpen, GraduationCap, AlertCircle, CheckCircle } from 'lucide-react';

interface ReadabilityScore {
    fleschScore: number;
    gradeLevel: string;
    avgSentenceLength: number;
    complexWordPct: number;
}

// Mock data
const MOCK_READABILITY: ReadabilityScore = {
    fleschScore: 62,
    gradeLevel: '8th Grade',
    avgSentenceLength: 18,
    complexWordPct: 12,
};

const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-rose-400';
};

const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Very Easy';
    if (score >= 70) return 'Easy';
    if (score >= 60) return 'Standard';
    if (score >= 50) return 'Fairly Difficult';
    if (score >= 30) return 'Difficult';
    return 'Very Difficult';
};

export const ReadabilityWidget = () => {
    const data = MOCK_READABILITY;
    const scoreColor = getScoreColor(data.fleschScore);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 rounded-2xl border border-white/5 h-full"
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-neon-blue/10 rounded-lg">
                    <BookOpen className="w-5 h-5 text-neon-blue" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Readability Score</h3>
                    <p className="text-xs text-gray-400">Average across all content</p>
                </div>
            </div>

            {/* Main Score */}
            <div className="flex items-center justify-center mb-6">
                <div className="relative">
                    <svg className="w-32 h-32 transform -rotate-90">
                        <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            className="text-white/5"
                        />
                        <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${(data.fleschScore / 100) * 352} 352`}
                            strokeLinecap="round"
                            className={scoreColor}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-3xl font-bold font-display ${scoreColor}`}>{data.fleschScore}</span>
                        <span className="text-xs text-gray-400">{getScoreLabel(data.fleschScore)}</span>
                    </div>
                </div>
            </div>

            {/* Details */}
            <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-300">Reading Level</span>
                    </div>
                    <span className="text-sm font-medium text-white">{data.gradeLevel}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-2">
                        {data.avgSentenceLength > 20 ? (
                            <AlertCircle className="w-4 h-4 text-amber-400" />
                        ) : (
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                        )}
                        <span className="text-sm text-gray-300">Avg. Sentence</span>
                    </div>
                    <span className="text-sm font-medium text-white">{data.avgSentenceLength} words</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-2">
                        {data.complexWordPct > 15 ? (
                            <AlertCircle className="w-4 h-4 text-amber-400" />
                        ) : (
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                        )}
                        <span className="text-sm text-gray-300">Complex Words</span>
                    </div>
                    <span className="text-sm font-medium text-white">{data.complexWordPct}%</span>
                </div>
            </div>
        </motion.div>
    );
};

export default ReadabilityWidget;
