import axios from 'axios';

// Get config from window (injected by WP) or default for dev
const config = (window as any).apexConfig || {
    api_root: 'http://localhost:8081/wp-json/',
    nonce: '',
};

const api = axios.create({
    baseURL: config.api_root,
    headers: {
        'X-WP-Nonce': config.nonce,
    },
});

export const metricsApi = {
    getLiveStats: async () => {
        // In dev mode, return mock data
        if (!config.nonce) {
            return { active_users: Math.floor(Math.random() * 10) + 1 };
        }
        const response = await api.get('apex/v1/stats/live');
        return response.data;
    },

    getTrafficStats: async () => {
        if (!config.nonce) return { data: [] };
        const response = await api.get('apex/v1/stats/traffic');
        return response.data;
    },

    askAgent: async (question: string) => {
        if (!config.nonce) return { answer: "Mock AI Answer: Analytics are looking good!", data: [] };
        const response = await api.post('apex/v1/stats/ask', { question });
        return response.data;
    }
};
