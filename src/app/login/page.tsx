'use client';

import { loginUser } from '@/app/actions/auth.actions';
import { useState } from 'react';

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (role: 'doctor' | 'patient') => {
        setIsLoading(true);
        await loginUser(role);
        // O redirect é feito na Server Action
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-[family-name:var(--font-geist-sans)]">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
                <div className="p-8 text-center bg-slate-900">
                    <h1 className="text-3xl font-bold text-white mb-2">Anamnese PWA</h1>
                    <p className="text-slate-300 text-sm font-medium">Ecossistema Clínico e Pessoal</p>
                </div>

                <div className="p-8 space-y-6">
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-slate-800 mb-1">Como você deseja entrar?</h2>
                        <p className="text-slate-500 text-sm">Selecione seu perfil para personalizar a experiência.</p>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={() => handleLogin('doctor')}
                            disabled={isLoading}
                            className={`w-full flex items-center p-4 rounded-xl border-2 transition-all ${isLoading ? 'opacity-50 cursor-not-allowed border-slate-200' : 'border-emerald-100 hover:border-emerald-500 hover:bg-emerald-50 bg-white group'}`}
                        >
                            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                            </div>
                            <div className="ml-4 text-left">
                                <h3 className="font-bold text-slate-800 text-lg">Médico Profissional</h3>
                                <p className="text-slate-500 text-xs mt-1">Acesso à IA de transcrição e geração automática de relatórios.</p>
                            </div>
                        </button>

                        <button
                            onClick={() => handleLogin('patient')}
                            disabled={isLoading}
                            className={`w-full flex items-center p-4 rounded-xl border-2 transition-all ${isLoading ? 'opacity-50 cursor-not-allowed border-slate-200' : 'border-blue-100 hover:border-blue-500 hover:bg-blue-50 bg-white group'}`}
                        >
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            </div>
                            <div className="ml-4 text-left">
                                <h3 className="font-bold text-slate-800 text-lg">Paciente / Pessoal</h3>
                                <p className="text-slate-500 text-xs mt-1">Acesso focado e simplificado para preenchimento manual de ficha.</p>
                            </div>
                        </button>
                    </div>

                    <div className="text-center pt-4">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Processamento 100% Offline (Local First)</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
