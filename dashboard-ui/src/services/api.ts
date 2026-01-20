import axios, { type InternalAxiosRequestConfig } from 'axios';

const getWPConfig = () => (window as any).apexConfig || {
    api_root: 'http://localhost:8000/wp-json/',
    nonce: '',
};

const api = axios.create({
    withCredentials: true
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const wpConfig = getWPConfig();
    config.baseURL = wpConfig.api_root;
    if (wpConfig.nonce) {
        config.headers['X-WP-Nonce'] = wpConfig.nonce;
    }
    return config;
});

export const metricsApi = {
    getLiveStats: async () => {
        const wpConfig = getWPConfig();
        if (!wpConfig.nonce) {
            return { active_users: Math.floor(Math.random() * 10) + 1 };
        }
        const response = await api.get('apex/v1/stats/live');
        return response.data;
    },

    getKPIStats: async (range: string) => {
        const wpConfig = getWPConfig();
        if (!wpConfig.nonce) {
            return { total_revenue: 12450, revenue_change: '+12.5%', active_traffic: 8249, traffic_change: '+24.2%', recovered_traffic: 1242, bounce_rate: 42.3 };
        }
        const response = await api.get('apex/v1/stats/kpi', { params: { range } });
        return response.data;
    },

    getTrafficStats: async (range: string) => {
        const wpConfig = getWPConfig();
        if (!wpConfig.nonce) return { data: [] };
        const response = await api.get('apex/v1/stats/traffic', { params: { range } });
        return response.data;
    },

    getOverviewBatch: async (range: string) => {
        const wpConfig = getWPConfig();
        if (!wpConfig.nonce) {
            return {
                kpi: { total_revenue: 12450, revenue_change: '+12.5%', active_traffic: 8249, traffic_change: '+24.2%', recovered_traffic: 1242, bounce_rate: 42.3 },
                traffic: { data: [] },
                live: { active_users: 5 }
            };
        }
        const response = await api.get('apex/v1/overview/batch', { params: { range } });
        return response.data;
    },

    askAgent: async (question: string) => {
        const wpConfig = getWPConfig();
        if (!wpConfig.nonce) return { answer: "Mock AI Answer: Analytics are looking good!", data: [] };
        const response = await api.post('apex/v1/stats/ask', { question });
        return response.data;
    },

    getFormStats: async (range: string) => {
        const wpConfig = getWPConfig();
        if (!wpConfig.nonce) return [];
        const response = await api.get('apex/v1/stats/forms', { params: { range } });
        return response.data;
    },

    optimizeForm: async (payload: any) => {
        const wpConfig = getWPConfig();
        if (!wpConfig.nonce) return { suggestions: "<p>Mock: Reduce field friction.</p>" };
        const response = await api.post('apex/v1/stats/optimize', payload);
        return response.data;
    },

    getSearchStats: async (range: string) => {
        const wpConfig = getWPConfig();
        if (!wpConfig.nonce) return { top_queries: [], gaps: [], recent_404s: [] };
        const response = await api.get('apex/v1/stats/search', { params: { range } });
        return response.data;
    },

    askPerplexity: async (query: string) => {
        const wpConfig = getWPConfig();
        if (!wpConfig.nonce) return { answer: "Mock AI Answer: This search query is trending!" };
        const response = await api.post('apex/v1/ai/answer', { query });
        return response.data;
    },

    getReadabilityStats: async () => {
        const wpConfig = getWPConfig();
        if (!wpConfig.nonce) return { skimmers: 0, readers: 0, casual: 0 };
        const response = await api.get('apex/v1/analysis/readability');
        return response.data;
    },

    getContentDecay: async () => {
        const wpConfig = getWPConfig();
        if (!wpConfig.nonce) return [];
        const response = await api.get('apex/v1/analysis/decay');
        return response.data;
    },

    getCannibalizationStats: async () => {
        const wpConfig = getWPConfig();
        if (!wpConfig.nonce) return [];
        const response = await api.get('apex/v1/analysis/cannibalization');
        return response.data;
    },

    getGSCOverlay: async (days: number) => {
        const wpConfig = getWPConfig();
        if (!wpConfig.nonce) return { clicks: [], impressions: [] };
        const response = await api.get('apex/v1/analysis/gsc-overlay', { params: { days } });
        return response.data;
    },

    getAutomationRules: async () => {
        const wpConfig = getWPConfig();
        if (!wpConfig.nonce) return [
            { id: 1, name: 'Cart Abandonment Alert', trigger_type: 'cart_activity', action_type: 'email', is_active: true },
            { id: 2, name: 'Broken Link Monitor', trigger_type: '404_error', action_type: 'notice', is_active: false }
        ];
        const response = await api.get('apex/v1/automation/rules');
        return response.data;
    },

    createAutomationRule: async (payload: any) => {
        const wpConfig = getWPConfig();
        if (!wpConfig.nonce) return { status: 'created' };
        const response = await api.post('apex/v1/automation/rules', payload);
        return response.data;
    },

    deleteAutomationRule: async (id: number) => {
        const wpConfig = getWPConfig();
        if (!wpConfig.nonce) return { status: 'deleted' };
        const response = await api.delete(`apex/v1/automation/rules/${id}`);
        return response.data;
    },

    testAutomationRule: async (id: number) => {
        const wpConfig = getWPConfig();
        if (!wpConfig.nonce) return { status: 'test_initiated' };
        const response = await api.post(`apex/v1/automation/rules/${id}/test`);
        return response.data;
    },

    // === Segmentation APIs ===
    getCohorts: async () => {
        const wpConfig = getWPConfig();
        if (!wpConfig.nonce) return [
            { date: 'Oct 01', users: 1200, day1: 45, day7: 20, day30: 10 },
            { date: 'Oct 08', users: 1450, day1: 42, day7: 22, day30: 12 },
            { date: 'Oct 15', users: 1100, day1: 48, day7: 25, day30: 15 },
            { date: 'Oct 22', users: 1600, day1: 40, day7: 18, day30: 0 },
        ];
        const response = await api.get('apex/v1/tunnel', { params: { path: '/v1/segmentation/cohorts' } });
        return response.data;
    },

    getSankey: async () => {
        const wpConfig = getWPConfig();
        if (!wpConfig.nonce) return {
            nodes: [
                { name: 'Home' }, { name: 'Pricing' }, { name: 'Checkout' },
                { name: 'Blog' }, { name: 'Features' }, { name: 'Sign Up' }
            ],
            links: [
                { source: 0, target: 1, value: 500 },
                { source: 0, target: 3, value: 300 },
                { source: 0, target: 4, value: 200 },
                { source: 1, target: 2, value: 150 },
                { source: 1, target: 0, value: 100 },
                { source: 3, target: 1, value: 50 },
                { source: 2, target: 5, value: 120 },
            ]
        };
        const response = await api.get('apex/v1/tunnel', { params: { path: '/v1/segmentation/sankey' } });
        return response.data;
    },

    getEngagementScores: async () => {
        const wpConfig = getWPConfig();
        if (!wpConfig.nonce) return {
            topPersona: 'Power Users',
            avgScore: 64,
            scoreChange: '+12%',
            churnRisk: 12.5,
            scores: [
                { user_id: 'user_123', score: 85, persona: 'Power User', risk: 'Low' },
                { user_id: 'user_456', score: 12, persona: 'Window Shopper', risk: 'High' },
                { user_id: 'user_789', score: 45, persona: 'Researcher', risk: 'Medium' },
            ]
        };
        const response = await api.get('apex/v1/tunnel', { params: { path: '/v1/segmentation/scores' } });
        return response.data;
    },

    createSegment: async (payload: { name: string, criteria: string }) => {
        const wpConfig = getWPConfig();
        if (!wpConfig.nonce) return { status: 'created', id: Date.now() };
        const response = await api.post('apex/v1/tunnel?path=/v1/segmentation/segments', payload);
        return response.data;
    },

    getSegments: async () => {
        const wpConfig = getWPConfig();
        if (!wpConfig.nonce) return [
            { id: 1, name: 'VIP Customers', criteria: '{"ltv": ">500"}', created_at: '2026-01-10' },
            { id: 2, name: 'At-Risk Users', criteria: '{"last_visit": ">30d"}', created_at: '2026-01-12' },
        ];
        const response = await api.get('apex/v1/tunnel', { params: { path: '/v1/segmentation/segments' } });
        return response.data;
    },

    deleteSegment: async (id: number) => {
        const wpConfig = getWPConfig();
        if (!wpConfig.nonce) return { status: 'deleted' };
        const response = await api.delete('apex/v1/tunnel', { params: { path: `/v1/segmentation/segments/${id}` } });
        return response.data;
    },

    exportSegmentData: async (segmentId?: number) => {
        const wpConfig = getWPConfig();
        if (!wpConfig.nonce) return { csv: 'mock,data,here' };
        const response = await api.get('apex/v1/tunnel', { params: { path: '/v1/segmentation/export', segment_id: segmentId } });
        return response.data;
    },

    getLeads: async () => {
        const wpConfig = getWPConfig();
        if (!wpConfig.nonce) return [];
        const response = await api.get('apex/v1/tunnel', { params: { path: '/v1/segmentation/leads' } });
        return response.data;
    },

    getSocialStats: async () => {
        const wpConfig = getWPConfig();
        if (!wpConfig.nonce) return { positive: 12, negative: 2, neutral: 5, total: 19, k_factor: '1.1' };
        const response = await api.get('apex/v1/tunnel', { params: { path: '/v1/social/stats' } });
        return response.data;
    },

    getDarkSocial: async () => {
        const wpConfig = getWPConfig();
        if (!wpConfig.nonce) return { dark_social_traffic: 842 };
        const response = await api.get('apex/v1/tunnel', { params: { path: '/v1/social/dark-social' } });
        return response.data;
    },

    getCampaignStats: async () => {
        const wpConfig = getWPConfig();
        if (!wpConfig.nonce) return [];
        const response = await api.get('apex/v1/tunnel', { params: { path: '/v1/campaigns/stats' } });
        return response.data;
    }
};
