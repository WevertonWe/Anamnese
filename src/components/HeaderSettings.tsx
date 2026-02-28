'use client';

import { useState } from 'react';
import { logoutUser } from '@/app/actions/auth.actions';
import SettingsModal from '@/components/SettingsModal';

export default function HeaderSettings() {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    return (
        <div className="absolute top-4 right-4 sm:top-8 sm:right-8 flex items-center gap-2">
            <button
                onClick={() => logoutUser()}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-red-600 bg-white rounded-full shadow-sm border border-slate-200 hover:bg-red-50 hover:border-red-200 transition"
            >
                Trocar Perfil
            </button>
            <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2.5 text-slate-500 hover:text-emerald-700 bg-white rounded-full shadow-sm border border-slate-200 hover:bg-emerald-50 transition"
                aria-label="Configurações do Profissional"
                title="Configurações do Profissional"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
    );
}
