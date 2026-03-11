'use client';
// v2-flags-refresh

import { useState, useEffect } from 'react';
import { logoutUser } from '@/app/actions/auth.actions';
import { getDoctorProfile } from '@/app/actions/profile.actions';
import SettingsModal from '@/components/SettingsModal';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HeaderSettings() {
    const t = useTranslations('Header');
    const locale = useLocale();
    const router = useRouter();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [cachedName, setCachedName] = useState<string>('');

    useEffect(() => {
        const storedName = localStorage.getItem('@AnamnesePro:doctorName');
        if (storedName) setCachedName(storedName);

        getDoctorProfile().then(p => {
            setProfile(p);
            if (p?.fullName) {
                localStorage.setItem('@AnamnesePro:doctorName', p.fullName);
                setCachedName(p.fullName);
            }
        });
    }, []);

    const setLanguage = (locale: string) => {
        document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;
        router.refresh();
    };

    const getInitials = (name?: string) => {
        if (!name) return 'DR';
        return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    };



    const playSuccessSound = () => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="absolute top-4 right-4 sm:top-8 sm:right-8 flex items-center gap-3 z-30">
            {profile?.isSuperAdmin && (
                <Link 
                    href="/admin" 
                    className="hidden sm:flex px-4 py-2 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 border border-emerald-200 rounded-full shadow-sm transition"
                >
                    Painel Admin
                </Link>
            )}

            <button
                onClick={playSuccessSound}
                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 hover:border-emerald-200 shadow-sm transition-all"
                title="Testar Áudio do Sistema"
            >
                🔈
            </button>

            <div key={locale} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1 rounded-full shadow-sm">
                <button
                    onClick={() => setLanguage('pt')}
                    className={`relative w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 overflow-hidden ${locale === 'pt' ? 'ring-2 ring-emerald-500 bg-emerald-50 scale-110 shadow-md z-10' : 'hover:bg-slate-100 opacity-60 hover:opacity-100 grayscale-[0.3] hover:grayscale-0'}`}
                    title="Português">
                    <img src="https://flagcdn.com/w40/br.png" alt="PT-BR" className="w-5 h-auto rounded-[2px] shadow-sm" />
                </button>
                <button
                    onClick={() => setLanguage('en')}
                    className={`relative w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 overflow-hidden ${locale === 'en' ? 'ring-2 ring-emerald-500 bg-emerald-50 scale-110 shadow-md z-10' : 'hover:bg-slate-100 opacity-60 hover:opacity-100 grayscale-[0.3] hover:grayscale-0'}`}
                    title="English">
                    <img src="https://flagcdn.com/w40/us.png" alt="EN-US" className="w-5 h-auto rounded-[2px] shadow-sm" />
                </button>
                <button
                    onClick={() => setLanguage('es')}
                    className={`relative w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 overflow-hidden ${locale === 'es' ? 'ring-2 ring-emerald-500 bg-emerald-50 scale-110 shadow-md z-10' : 'hover:bg-slate-100 opacity-60 hover:opacity-100 grayscale-[0.3] hover:grayscale-0'}`}
                    title="Español">
                    <img src="https://flagcdn.com/w40/es.png" alt="ES" className="w-5 h-auto rounded-[2px] shadow-sm" />
                </button>
            </div>

            <button
                onClick={() => setIsSettingsOpen(true)}
                className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shadow-md border-[3px] border-slate-100 hover:border-slate-300 hover:ring-2 hover:ring-emerald-400 hover:scale-105 transition-all duration-300 overflow-hidden ml-1"
                aria-label={t('settingsLabel')}
                title={profile?.fullName || cachedName || t('settingsLabel')}
            >
                {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                    getInitials(profile?.fullName || cachedName)
                )}
            </button>

            <button
                onClick={() => logoutUser()}
                className="hidden sm:block px-4 py-2 text-xs font-bold text-slate-500 hover:text-red-600 bg-white rounded-full shadow-sm border border-slate-200 hover:bg-red-50 hover:border-red-200 transition"
            >
                Sair
            </button>

            <button
                onClick={() => logoutUser()}
                className="sm:hidden w-11 h-11 rounded-full bg-white text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 shadow-sm flex items-center justify-center ml-1 transition"
                aria-label="Sair"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>

            <SettingsModal isOpen={isSettingsOpen} onClose={() => { setIsSettingsOpen(false); getDoctorProfile().then(p => setProfile(p)); }} />
        </div>
    );
}
