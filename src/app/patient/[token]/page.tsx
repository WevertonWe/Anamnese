'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import confetti from 'canvas-confetti';

export default function PatientLandingPage() {
    const params = useParams();
    const token = params?.token as string;
    const [completed, setCompleted] = useState(false);
    const [invalid, setInvalid] = useState(false);

    const handleComplete = () => {
        // Disparar confetti discreto
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#34d399', '#10b981', '#059669']
        });

        setCompleted(true);
        // "invalidar o link"
        setInvalid(true);
    };

    if (invalid) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Informações Enviadas!</h2>
                <p className="text-slate-500 max-w-sm">Obrigado por preencher. Este link foi invalidado por segurança e não pode mais ser acessado.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
                
                <h1 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">Anamnese Prévia</h1>
                <p className="text-slate-500 mb-8 text-sm leading-relaxed">
                    Por favor, preencha as informações básicas solicitadas pelo seu médico antes da consulta.
                </p>

                <button 
                    onClick={handleComplete}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition transform hover:-translate-y-0.5"
                >
                    Concluir e Enviar
                </button>
            </div>
        </div>
    );
}
