import { Mic } from 'lucide-react';

interface JarvisOrbProps {
    isListening: boolean;
    onClick: () => void;
    transcript?: string;
}

export default function JarvisOrb({ isListening, onClick, transcript }: JarvisOrbProps) {
    return (
        <div className="fixed bottom-6 right-24 z-50 flex flex-col items-end pointer-events-none">

            {/* Transcript Bubble */}
            {isListening && transcript && (
                <div className="mb-4 bg-midnight-light/80 backdrop-blur-xl border border-neon-purple/30 text-neon-purple/80 px-4 py-2 rounded-xl rounded-tr-none shadow-[0_0_20px_rgba(189,52,254,0.1)] max-w-xs animate-fade-in pointer-events-auto italic text-sm">
                    "{transcript}"
                </div>
            )}

            {/* Orb Container */}
            <button
                onClick={onClick}
                className={`pointer-events-auto relative flex items-center justify-center w-16 h-16 rounded-full transition-all duration-500 ${isListening ? 'bg-neon-purple scale-110 shadow-[0_0_40px_rgba(189,52,254,0.6)]' : 'bg-white/5 hover:bg-white/10 shadow-xl border border-white/10 backdrop-blur-md'}`}
            >
                {/* Pulsing Rings */}
                {isListening && (
                    <>
                        <div className="absolute w-full h-full rounded-full bg-neon-purple opacity-40 animate-ping"></div>
                        <div className="absolute w-[140%] h-[140%] rounded-full border border-neon-purple/20 animate-pulse"></div>
                        <div className="absolute w-[180%] h-[180%] rounded-full border border-neon-purple/5 animate-pulse delay-75"></div>
                    </>
                )}

                {isListening ? (
                    <Mic className="w-7 h-7 text-white animate-pulse" />
                ) : (
                    <Mic className="w-6 h-6 text-gray-500" />
                )}
            </button>
        </div>
    );
}
