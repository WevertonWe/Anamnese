import { useState, useRef, useCallback } from 'react';

interface UseAudioRecorderResult {
    isRecording: boolean;
    audioBlob: Blob | null;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    resetAudio: () => void;
    liveTranscription: string;
}

// Para o TypeScript reconhecer as interfaces do Safari/Chrome
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

export function useAudioRecorder(): UseAudioRecorderResult {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [liveTranscription, setLiveTranscription] = useState('');

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const speechRecognitionRef = useRef<any>(null);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(audioBlob);

                // Ensure tracks are stopped and stream is properly released
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                }
            };

            mediaRecorder.start();

            // Configurar o Web Speech API para Web e Mobile Chrome/Safari
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.lang = 'pt-BR';
                recognition.continuous = true;
                recognition.interimResults = true; // Live update letra por letra

                let finalTranscript = '';

                recognition.onresult = (event: any) => {
                    let interimTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript + ' ';
                        } else {
                            interimTranscript += event.results[i][0].transcript;
                        }
                    }
                    const newText = (finalTranscript + interimTranscript).trim();
                    setLiveTranscription(newText);
                    console.log("🎤 Capturado:", newText);
                };

                recognition.onerror = (event: any) => {
                    console.log('SpeechRecognition error:', event.error);
                };

                speechRecognitionRef.current = recognition;
                try {
                    recognition.start();
                } catch (e) {
                    // Evitar crash se já estiver iniciado
                    console.warn(e);
                }
            } else {
                console.warn("Speech Recognition API não suportada neste navegador.");
            }

            setIsRecording(true);
            setLiveTranscription(''); // Reseta a transcrição ao iniciar
        } catch (error) {
            console.error('Error accessing microphone:', error);
            // Let the UI handle the error (perhaps a toast notification)
            throw error;
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);

            if (speechRecognitionRef.current) {
                speechRecognitionRef.current.stop();
            }
        }
    }, []);

    const resetAudio = useCallback(() => {
        setAudioBlob(null);
        audioChunksRef.current = [];
        setLiveTranscription('');
    }, []);

    return {
        isRecording,
        audioBlob,
        startRecording,
        stopRecording,
        resetAudio,
        liveTranscription,
    };
}
