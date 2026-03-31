'use client';

import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useState, useEffect } from 'react';
import { generateAnamnesis } from '@/app/actions/anamnese.actions';
import Modal from '@/components/ui/Modal';

export default function AudioRecorder({ templateFields = [], onResult, minimal = false, variant = 'minimal' }: { templateFields?: any[], onResult?: (data: any) => void, minimal?: boolean, variant?: 'minimal' | 'card' }) {
    const { isRecording, startRecording, stopRecording, audioBlob, resetAudio, liveTranscription } = useAudioRecorder();
    const [seconds, setSeconds] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
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
            const res = await generateAnamnesis({
                transcription: liveTranscription || "(Áudio capturado sem transcrição em texto)",
                templateFields: templateFields,
                patientName: "Paciente Atual"
            });

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

    // Card View
    if (variant === 'card') {
        return (
            <div className={`w-full transition-all duration-500 ease-in-out ${isExpanded ? 'mb-8' : 'mb-4'}`}>
                {!isExpanded ? (
                    <button 
                        onClick={() => setIsExpanded(true)}
                        className="w-full bg-slate-900 group relative overflow-hidden rounded-2xl p-5 flex items-center justify-between shadow-xl shadow-slate-200 border border-slate-800 transition-all hover:scale-[1.01] active:scale-[0.99]"
                    >
                        {/* Background Effect */}
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <svg className="w-20 h-20 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        </div>
                        
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <span className="text-2xl">🎙️</span>
                            </div>
                            <div className="text-left">
                                <h3 className="text-white font-bold text-lg leading-tight">Ouvir Consulta (IA)</h3>
                                <p className="text-slate-400 text-xs font-medium">Capture e preencha automaticamente a anamnese</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 h-6 relative z-10">
                            <div className="w-1 h-3 bg-slate-700 rounded-full"></div>
                            <div className="w-1 h-5 bg-slate-600 rounded-full"></div>
                            <div className="w-1 h-4 bg-slate-700 rounded-full"></div>
                            <div className="w-1 h-2 bg-slate-800 rounded-full"></div>
                            <div className="ml-2 bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest border border-emerald-500/20">Alpha</div>
                        </div>
                    </button>
                ) : (
                    <div className="w-full bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Header Expands */}
                        <div className="bg-slate-900 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-xl">🎙️</span>
                                <span className="text-white font-bold">Assistente de Áudio IA</span>
                            </div>
                            <button 
                                onClick={() => {
                                    if (isRecording) stopRecording();
                                    setIsExpanded(false);
                                }}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 flex flex-col items-center gap-6">
                            {/* Recording Visualization */}
                            <div className="flex flex-col items-center justify-center w-full min-h-[140px] relative">
                                {isRecording ? (
                                    <div className="flex flex-col items-center gap-6">
                                        {/* Wave Animation */}
                                        <div className="flex items-end gap-1.5 h-16 mb-2">
                                            {[...Array(12)].map((_, i) => (
                                                <div 
                                                    key={i} 
                                                    className="w-1.5 bg-emerald-500 rounded-full animate-wave" 
                                                    style={{ 
                                                        height: `${20 + Math.random() * 80}%`,
                                                        animationDelay: `${i * 0.1}s`,
                                                        animationDuration: `${0.5 + Math.random() * 0.5}s`
                                                    }}
                                                ></div>
                                            ))}
                                        </div>
                                        
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-red-500 rounded-full opacity-20 animate-ping"></div>
                                            <button
                                                onClick={stopRecording}
                                                className="relative z-10 w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg transition hover:scale-105 active:scale-95"
                                            >
                                                <div className="w-6 h-6 bg-white rounded-sm"></div>
                                            </button>
                                        </div>
                                        <span className="font-mono text-2xl text-slate-800 font-black">{formatTime(seconds)}</span>
                                    </div>
                                ) : !audioBlob ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="text-center mb-2">
                                            <p className="text-slate-500 font-medium">Pronto para ouvir a consulta?</p>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-tighter">O áudio não é salvo, apenas processado</p>
                                        </div>
                                        <button
                                            onClick={startRecording}
                                            className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-700 hover:scale-105 active:scale-95 group"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                            </svg>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-full flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
                                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-emerald-900">Áudio Capturado</p>
                                                    <p className="text-[10px] text-emerald-600 uppercase font-bold tracking-widest">Clique abaixo para processar</p>
                                                </div>
                                            </div>
                                            <button onClick={resetAudio} className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>

                                        <button
                                            onClick={handleTranscribe}
                                            disabled={isProcessing}
                                            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 shadow-xl transition hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400"
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <svg className="animate-spin h-5 w-5 text-emerald-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                    Extraindo com IA...
                                                </>
                                            ) : (
                                                <>
                                                    <span className="text-xl">✨</span>
                                                    Preencher Anamnese Agora
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Live Transcript (Hidden until needed/recording) */}
                            {isRecording && liveTranscription && (
                                <div className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm text-slate-600 italic animate-in fade-in slide-in-from-top-2">
                                    "{liveTranscription}..."
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                {/* Global Wave Animation Style */}
                <style jsx>{`
                    @keyframes wave {
                        0%, 100% { transform: scaleY(0.3); }
                        50% { transform: scaleY(1); }
                    }
                    .animate-wave {
                        transform-origin: bottom;
                        animation: wave 1s ease-in-out infinite;
                    }
                `}</style>
            </div>
        );
    }

    // Original Minimal Logic
    return (
        <div className={`flex ${minimal ? 'flex-row items-center gap-3' : 'flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-sm border border-slate-200 gap-6 max-w-md'} w-full mx-auto`}>
            {!minimal && (
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-slate-800">Nova Consulta</h2>
                    <p className="text-sm text-slate-500 mt-1">Grave o áudio para iniciar a transcrição local</p>
                </div>
            )}

            <div className={`flex items-center justify-center ${minimal ? '' : 'w-full'}`}>
                {isRecording ? (
                    <div className={`flex ${minimal ? 'flex-row items-center gap-3' : 'flex-col items-center gap-4'}`}>
                        <div className={`relative flex items-center justify-center ${minimal ? 'w-10 h-10' : 'w-24 h-24'}`}>
                            <div className="absolute inset-0 bg-red-500 rounded-full opacity-20 animate-ping"></div>
                            <div className="absolute inset-0 bg-red-500 rounded-full opacity-40 animate-pulse"></div>
                            <button
                                onClick={stopRecording}
                                className={`relative z-10 flex items-center justify-center bg-red-600 rounded-full transition ${minimal ? 'w-10 h-10' : 'w-16 h-16 shadow-lg'}`}
                                aria-label="Parar gravação"
                            >
                                <div className={`bg-white rounded-sm ${minimal ? 'w-3.5 h-3.5' : 'w-6 h-6'}`}></div>
                            </button>
                        </div>
                        <span className={`font-mono text-red-600 font-medium ${minimal ? 'text-sm' : 'text-lg'}`}>{formatTime(seconds)}</span>
                    </div>
                ) : (
                    <button
                        onClick={startRecording}
                        className={`flex items-center justify-center bg-emerald-600 rounded-full hover:bg-emerald-700 transition group ${minimal ? 'w-10 h-10' : 'w-24 h-24 shadow-lg flex-col gap-2'}`}
                        aria-label="Iniciar gravação"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`text-white group-hover:scale-110 transition-transform ${minimal ? 'w-5 h-5' : 'w-8 h-8'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

