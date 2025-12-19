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
                <div className="mb-4 bg-slate-900/90 backdrop-blur border border-slate-700 text-purple-300 px-4 py-2 rounded-xl rounded-tr-none shadow-lg max-w-xs animate-fade-in pointer-events-auto">
                    "{transcript}"
                </div>
            )}

            {/* Orb Container */}
            <button
                onClick={onClick}
                className={`pointer-events-auto relative flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 ${isListening ? 'bg-purple-600 scale-110 shadow-[0_0_30px_rgba(147,51,234,0.6)]' : 'bg-slate-800 hover:bg-slate-700 shadow-lg border border-slate-700'}`}
            >
                {/* Pulsing Rings */}
                {isListening && (
                    <>
                        <div className="absolute w-full h-full rounded-full bg-purple-500 opacity-30 animate-ping"></div>
                        <div className="absolute w-[120%] h-[120%] rounded-full border border-purple-500/30 animate-pulse"></div>
                    </>
                )}

                {isListening ? (
                    <Mic className="w-8 h-8 text-white animate-pulse" />
                ) : (
                    <Mic className="w-6 h-6 text-slate-400" />
                )}
            </button>
        </div>
    );
}
