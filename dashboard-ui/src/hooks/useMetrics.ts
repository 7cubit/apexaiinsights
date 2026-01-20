import { useState, useEffect } from 'react';
import { metricsApi } from '../services/api';

const config = (window as any).apexConfig || {};

export function useLiveMetrics(pollingInterval = 5000) {
    const [data, setData] = useState(config.initialLive || { active_users: 0 });
    const [isLoading, setIsLoading] = useState(!config.initialLive);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                const stats = await metricsApi.getLiveStats();
                if (isMounted) {
                    setData(stats);
                    setIsLoading(false);
                    setError(null);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err as Error);
                    setIsLoading(false);
                }
            }
        };

        fetchData();
        const interval = setInterval(fetchData, pollingInterval);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [pollingInterval]);

    return { onlineCount: data.active_users, isLoading, error };
}
