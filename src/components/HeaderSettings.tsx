'use client';

import { useState } from 'react';
import { logoutUser } from '@/app/actions/auth.actions';
import SettingsModal from '@/components/SettingsModal';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function HeaderSettings() {
    const t = useTranslations('Header');
    const locale = useLocale();
    const router = useRouter();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const setLanguage = (locale: string) => {
        document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;
        router.refresh();
    };

    return (
        <div className="absolute top-4 right-4 sm:top-8 sm:right-8 flex items-center gap-3 z-30">
            <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-full shadow-sm">
                <button
                    onClick={() => setLanguage('pt')}
                    className={`text-2xl w-10 h-10 flex flex-col justify-center items-center rounded-full transition-all duration-300 ${locale === 'pt' ? 'ring-2 ring-emerald-500 bg-emerald-50 scale-110 shadow-md' : 'hover:bg-slate-100 opacity-70 hover:opacity-100'}`}
                    title="Português">
                    🇧🇷
                </button>
                <button
                    onClick={() => setLanguage('en')}
                    className={`text-2xl w-10 h-10 flex flex-col justify-center items-center rounded-full transition-all duration-300 ${locale === 'en' ? 'ring-2 ring-emerald-500 bg-emerald-50 scale-110 shadow-md' : 'hover:bg-slate-100 opacity-70 hover:opacity-100'}`}
                    title="English">
                    🇺🇸
                </button>
                <button
                    onClick={() => setLanguage('es')}
                    className={`text-2xl w-10 h-10 flex flex-col justify-center items-center rounded-full transition-all duration-300 ${locale === 'es' ? 'ring-2 ring-emerald-500 bg-emerald-50 scale-110 shadow-md' : 'hover:bg-slate-100 opacity-70 hover:opacity-100'}`}
                    title="Español">
                    🇪🇸
                </button>
            </div>
            <button
                onClick={() => logoutUser()}
                className="hidden sm:block px-4 py-2 text-xs font-bold text-slate-500 hover:text-red-600 bg-white rounded-full shadow-sm border border-slate-200 hover:bg-red-50 hover:border-red-200 transition"
            >
                {t('switchProfile')}
            </button>
            <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2.5 text-slate-500 hover:text-emerald-700 bg-white rounded-full shadow-sm border border-slate-200 hover:bg-emerald-50 transition"
                aria-label={t('settingsLabel')}
                title={t('settingsLabel')}
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
