
import { useEffect, useRef } from 'react';

declare global {
    interface Window {
        rrwebPlayer: any;
    }
}

interface ReplayPlayerProps {
    events: any[];
}

export const ReplayPlayer = ({ events }: ReplayPlayerProps) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Wait for rrwebPlayer to be available (CDN load)
        const checkInterval = setInterval(() => {
            if (window.rrwebPlayer && containerRef.current && events.length > 0) {
                clearInterval(checkInterval);

                // Clear previous player instance if any
                containerRef.current.innerHTML = '';

                try {
                    new window.rrwebPlayer({
                        target: containerRef.current,
                        props: {
                            events,
                            width: containerRef.current.clientWidth || 800,
                            height: 500, // Fixed height for now
                            autoPlay: true,
                            showController: true,
                        },
                    });
                } catch (e) {
                    console.error("Replay Error:", e);
                    containerRef.current.innerHTML = '<div class="p-4 text-red-500">Failed to load replay. Data might be corrupted.</div>';
                }
            }
        }, 100);

        return () => clearInterval(checkInterval);
    }, [events]);

    if (!events || events.length === 0) return (
        <div className="h-[500px] flex items-center justify-center bg-black/40 border border-white/5 rounded-lg">
            <span className="text-gray-400 animate-pulse">Loading session data...</span>
        </div>
    );

    return (
        <div className="w-full bg-black rounded-lg overflow-hidden border border-white/10 shadow-2xl relative z-10" >
            <div ref={containerRef} className="w-full" />
        </div>
    );
};
