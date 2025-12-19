import { useState, useEffect, useCallback } from 'react';

export interface VoiceState {
    isListening: boolean;
    transcript: string;
    error: string | null;
}

export const useVoice = (onResult?: (text: string) => void) => {
    const [state, setState] = useState<VoiceState>({
        isListening: false,
        transcript: '',
        error: null,
    });

    const [recognition, setRecognition] = useState<any>(null);

    useEffect(() => {
        // Check browser support
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            setState(s => ({ ...s, error: 'Voice recognition not supported in this browser.' }));
            return;
        }

        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognitionInstance = new SpeechRecognition();

        recognitionInstance.continuous = false; // Stop after one command usually
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'en-US';

        recognitionInstance.onstart = () => {
            setState(s => ({ ...s, isListening: true, error: null }));
        };

        recognitionInstance.onend = () => {
            setState(s => ({ ...s, isListening: false }));
        };

        recognitionInstance.onresult = (event: any) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            const currentText = finalTranscript || interimTranscript;
            setState(s => ({ ...s, transcript: currentText }));

            if (finalTranscript && onResult) {
                onResult(finalTranscript);
            }
        };

        recognitionInstance.onerror = (event: any) => {
            setState(s => ({ ...s, isListening: false, error: event.error }));
        };

        setRecognition(recognitionInstance);
    }, [onResult]);

    const startListening = useCallback(() => {
        if (recognition && !state.isListening) {
            try {
                recognition.start();
            } catch (e) {
                console.error("Speech recognition start failed", e);
            }
        }
    }, [recognition, state.isListening]);

    const stopListening = useCallback(() => {
        if (recognition && state.isListening) {
            recognition.stop();
        }
    }, [recognition, state.isListening]);

    const speak = useCallback((text: string) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            // Optional: Select a specific voice if desired
            // const voices = window.speechSynthesis.getVoices();
            // utterance.voice = voices.find(v => v.name.includes("Google")) || null; 
            window.speechSynthesis.speak(utterance);
        }
    }, []);

    return {
        ...state,
        startListening,
        stopListening,
        speak
    };
};
