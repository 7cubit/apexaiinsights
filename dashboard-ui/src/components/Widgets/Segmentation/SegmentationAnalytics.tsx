import React from 'react';
import CohortGrid from './CohortGrid';
import UserJourneySankey from './UserJourneySankey';
import { CompanyProfileWidget } from '../CompanyProfileWidget';
import { Users, Filter, Download, Target } from 'lucide-react';

const SegmentationAnalytics: React.FC = () => {
    return (
        <div className="space-y-6 pt-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
                        Audience Intelligence
                    </h2>
                    <p className="text-gray-400 mt-1">
                        Analyze user behavior, retention cohorts, and behavioral segments.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center px-4 py-2 border border-white/10 rounded-md text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors">
                        <Filter className="mr-2 h-4 w-4" />
                        Segment Builder
                    </button>
                    <button className="flex items-center px-4 py-2 border border-white/10 rounded-md text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors">
                        <Download className="mr-2 h-4 w-4" />
                        Export Data
                    </button>
                </div>
            </div>

            {/* Top Row: KPIs */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="glass-card p-6 border border-white/10 bg-black/20 backdrop-blur-md rounded-lg">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="text-sm font-medium text-gray-300">Top Persona</h3>
                        <Users className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-emerald-400">Power Users</div>
                        <p className="text-xs text-gray-500">Highest engagement score (85+)</p>
                    </div>
                </div>
                <div className="glass-card p-6 border border-white/10 bg-black/20 backdrop-blur-md rounded-lg">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="text-sm font-medium text-gray-300">Avg Engagement</h3>
                        <Users className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white">64/100</div>
                        <p className="text-xs text-gray-500">+12% from last week</p>
                    </div>
                </div>
                <div className="glass-card p-6 border border-white/10 bg-black/20 backdrop-blur-md rounded-lg">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="text-sm font-medium text-gray-300">Churn Risk</h3>
                        <Users className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-red-400">12.5%</div>
                        <p className="text-xs text-gray-500">Users inactive &gt; 30 days</p>
                    </div>
                </div>
            </div>

            {/* Main Visualizations */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Cohort Grid - Takes up 1 col */}
                <div className="col-span-1">
                    <CohortGrid />
                </div>

                {/* Sankey - Takes up 2 cols */}
                <div className="col-span-2">
                    <UserJourneySankey />
                </div>
            </div>

            {/* Lead Hunter Section (Phase 24) */}
            <div className="mt-8">
                <div className="flex items-center gap-2 mb-6">
                    <Target className="text-emerald-400 w-6 h-6" />
                    <h3 className="text-2xl font-bold text-white">Lead Hunter <span className="text-xs font-normal text-gray-500 uppercase ml-2 tracking-widest">B2B Intelligence</span></h3>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <CompanyProfileWidget
                        company={{
                            name: "Apple Inc.",
                            domain: "apple.com",
                            industry: "Consumer Electronics",
                            employees: "10,000+",
                            confidence: 98,
                            isISP: false
                        }}
                    />
                    <CompanyProfileWidget
                        company={{
                            name: "Alphabet",
                            domain: "google.com",
                            industry: "Technology",
                            employees: "10,000+",
                            confidence: 95,
                            isISP: false
                        }}
                    />
                    <CompanyProfileWidget
                        company={{
                            name: "Comcast Business",
                            domain: "comcast.com",
                            industry: "Telecommunications",
                            employees: "10,000+",
                            confidence: 80,
                            isISP: true
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default SegmentationAnalytics;
