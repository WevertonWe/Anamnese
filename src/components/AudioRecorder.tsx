'use client';

import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useState, useEffect } from 'react';
import { generateAnamnesis } from '@/app/actions/anamnese.actions';
import Modal from '@/components/ui/Modal';

export default function AudioRecorder({ templateId = "mock_1", onResult, minimal = false }: { templateId?: string, onResult?: (data: any) => void, minimal?: boolean }) {
    const { isRecording, startRecording, stopRecording, audioBlob, resetAudio, liveTranscription } = useAudioRecorder();
    const [seconds, setSeconds] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [anamnesisResult, setAnamnesisResult] = useState<any>(null);
    const [modalConfig, setModalConfig] = useState<{ isOpen: boolean, title: string, message: string, type: 'success' | 'error' | 'info' }>({
        isOpen: false, title: '', message: '', type: 'info'
    });

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRecording) {
            interval = setInterval(() => {
                setSeconds((s) => s + 1);
            }, 1000);
        } else {
            setSeconds(0);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const formatTime = (totalSeconds: number) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleTranscribe = async () => {
        if (!audioBlob) return;
        setIsProcessing(true);
        setAnamnesisResult(null);

        try {
            console.log("--- TRANSCRIÇÃO ENVIADA PARA IA ---", liveTranscription);

            // API call to the Server Action that connects to LLM
            const res = await generateAnamnesis({
                transcription: liveTranscription || "(Áudio capturado sem transcrição em texto)",
                templateId: templateId,
                patientName: "Paciente Atual"
            });

            console.log("--- RESULTADO DO MODELO ---", res.success ? res.data : res.error);

            if (res.success) {
                if (onResult) onResult(res.data);
                setAnamnesisResult(res.data);
            } else {
                setModalConfig({ isOpen: true, title: 'Processamento Falhou', message: res.error || 'Erro desconhecido', type: 'error' });
            }
        } catch (err) {
            console.error(err);
            setModalConfig({ isOpen: true, title: 'Erro de Comunicação', message: 'Falha na comunicação com o servidor IA.', type: 'error' });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className={`flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-sm border border-slate-200 gap-6 w-full ${minimal ? 'max-w-none' : 'max-w-md'} mx-auto`}>
            {!minimal && (
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-slate-800">Nova Consulta</h2>
                    <p className="text-sm text-slate-500 mt-1">Grave o áudio para iniciar a transcrição local</p>
                </div>
            )}

            <div className="flex items-center justify-center w-full">
                {isRecording ? (
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative flex items-center justify-center w-24 h-24">
                            <div className="absolute inset-0 bg-red-500 rounded-full opacity-20 animate-ping"></div>
                            <div className="absolute inset-0 bg-red-500 rounded-full opacity-40 animate-pulse"></div>
                            <button
                                onClick={stopRecording}
                                className="relative z-10 flex items-center justify-center w-16 h-16 bg-red-600 rounded-full shadow-lg hover:bg-red-700 transition"
                                aria-label="Parar gravação"
                            >
                                <div className="w-6 h-6 bg-white rounded-sm"></div>
                            </button>
                        </div>
                        <span className="text-lg font-mono text-red-600 font-medium">{formatTime(seconds)}</span>
                    </div>
                ) : (
                    <button
                        onClick={startRecording}
                        className="flex flex-col items-center justify-center w-24 h-24 bg-emerald-600 rounded-full shadow-lg hover:bg-emerald-700 transition gap-2 group"
                        aria-label="Iniciar gravação"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    </button>
                )}
            </div>

            {isRecording && (
                <div className="w-full flex flex-col items-center mt-4 animate-in fade-in">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                        <span className="text-sm font-bold text-red-600 animate-pulse">Gravando...</span>
                    </div>
                    {/* Visual Transcript Box */}
                    <div className="w-full min-h-[80px] max-h-[160px] overflow-y-auto bg-slate-100 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-700 italic shadow-inner text-left">
                        {liveTranscription ? liveTranscription : "Aguardando sua voz..."}
                    </div>
                </div>
            )}

            {audioBlob && !isRecording && (
                <div className="w-full flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                            <span className="text-sm font-medium text-slate-700">Áudio capturado</span>
                        </div>
                        <button onClick={resetAudio} className="text-slate-400 hover:text-red-500 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>

                    {/* Exibir o que será enviado no Bridge de IA */}
                    {liveTranscription && (
                        <div className="w-full max-h-[120px] overflow-y-auto bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700 italic text-left relative">
                            <span className="absolute top-2 right-2 text-[10px] font-bold text-slate-400 uppercase">Input da IA</span>
                            "{liveTranscription}"
                        </div>
                    )}

                    <button
                        onClick={handleTranscribe}
                        disabled={isProcessing}
                        className={`w-full rounded-xl py-3 font-medium transition shadow-sm flex items-center justify-center gap-2 ${isProcessing
                            ? "bg-emerald-100 text-emerald-800 cursor-wait"
                            : "bg-slate-900 text-white hover:bg-slate-800"
                            }`}
                    >
                        {isProcessing ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processando com IA...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Processar Clínico (IA)
                            </>
                        )}
                    </button>
                </div>
            )}

            {anamnesisResult && !onResult && (
                <div className="w-full mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100 animate-in fade-in slide-in-from-bottom-2">
                    <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Anamnese Extraída
                    </h4>
                    <div className="space-y-2 text-sm text-slate-700">
                        <p><span className="font-semibold block text-slate-900">Subjetivo:</span> {anamnesisResult.subjetivo}</p>
                        <p><span className="font-semibold block text-slate-900">Objetivo:</span> {anamnesisResult.objetivo}</p>
                        <p><span className="font-semibold block text-slate-900">Avaliação:</span> {anamnesisResult.avaliacao}</p>
                        <p><span className="font-semibold block text-slate-900">Plano:</span> {anamnesisResult.plano}</p>
                        <div className="flex gap-2 mt-2">
                            {anamnesisResult.cid_sugerido?.map((cid: string) => (
                                <span key={cid} className="bg-emerald-200 text-emerald-800 text-[10px] font-bold px-2 py-1 rounded">CID 10: {cid}</span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <Modal
                isOpen={modalConfig.isOpen}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
            />
        </div>
    );
}
