import { motion } from 'framer-motion';
import { Building2, Users, Linkedin, Target, ShieldCheck } from 'lucide-react';

interface CompanyProfileProps {
    company: {
        name: string;
        domain: string;
        industry?: string;
        employees?: string;
        confidence?: number;
        isISP?: boolean;
        firstSeen?: string;
    };
}

export const CompanyProfileWidget = ({ company }: CompanyProfileProps) => {
    if (!company || !company.name || company.name === 'Unknown') return null;

    const linkedInSearchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(company.name + ' decision maker')}`;

    const config = (window as any).apexConfig || {};
    const currentPlan = (config.plan || 'pro').toLowerCase();
    const isLocked = currentPlan === 'plus';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden group"
        >
            {isLocked && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-midnight/40 backdrop-blur-[6px] p-6 text-center">
                    <Target className="w-8 h-8 text-neon-green mb-3 opacity-50" />
                    <h4 className="text-white font-bold text-sm mb-1">B2B Intelligence Locked</h4>
                    <p className="text-[10px] text-gray-300 mb-4 px-4 line-clamp-2">Upgrade to **Pro** for unlimited company identification and decision-maker discovery.</p>
                </div>
            )}

            <div className={`absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity ${isLocked ? 'blur-sm' : ''}`}>
                <Target className="w-16 h-16 text-emerald-500/10" />
            </div>

            <div className={`flex items-start justify-between mb-6 relative z-10 ${isLocked ? 'blur-md opacity-30 select-none' : ''}`}>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                        <img
                            src={`https://www.google.com/s2/favicons?domain=${company.domain}&sz=128`}
                            alt={company.name}
                            className="w-12 h-12 object-contain"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                            {company.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                            <Building2 className="w-3 h-3" />
                            <span>{company.domain}</span>
                            {company.isISP && <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full ml-2">ISP Detected</span>}
                        </div>
                    </div>
                </div>

                {company.confidence && (
                    <div className="text-right">
                        <div className="text-2xl font-mono font-bold text-emerald-400">{company.confidence}%</div>
                        <div className="text-xs text-emerald-500/60 uppercase tracking-wider">Lead Score</div>
                    </div>
                )}
            </div>

            <div className={`grid grid-cols-2 gap-4 mb-6 relative z-10 ${isLocked ? 'blur-md opacity-30 select-none' : ''}`}>
                <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                    <div className="text-xs text-gray-500 mb-1">Industry</div>
                    <div className="text-sm font-medium">{company.industry || 'Technology'}</div>
                </div>
                <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                    <div className="text-xs text-gray-500 mb-1">Employees</div>
                    <div className="text-sm font-medium flex items-center gap-2">
                        <Users className="w-3 h-3" />
                        {company.employees || 'Unknown'}
                    </div>
                </div>
            </div>

            <div className={`flex gap-3 relative z-10 ${isLocked ? 'blur-md opacity-30 select-none' : ''}`}>
                {!isLocked ? (
                    <a
                        href={linkedInSearchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-[#0A66C2] hover:bg-[#004182] text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                        <Linkedin className="w-4 h-4" />
                        Find Decision Makers
                    </a>
                ) : (
                    <div className="flex-1 bg-[#0A66C2] text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                        <Linkedin className="w-4 h-4" />
                        Find Decision Makers
                    </div>
                )}
            </div>

            {!company.isISP && !isLocked && (
                <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400/80 bg-emerald-500/5 p-2 rounded border border-emerald-500/10">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Corporate Entity via Apex Recon
                </div>
            )}
        </motion.div>
    );
};
