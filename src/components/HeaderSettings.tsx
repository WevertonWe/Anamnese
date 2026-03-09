'use client';
// v2-flags-refresh

import { useState, useEffect } from 'react';
import { logoutUser } from '@/app/actions/auth.actions';
import { getDoctorProfile } from '@/app/actions/profile.actions';
import SettingsModal from '@/components/SettingsModal';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

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



    return (
        <div className="absolute top-4 right-4 sm:top-8 sm:right-8 flex items-center gap-3 z-30">
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

            <SettingsModal isOpen={isSettingsOpen} onClose={() => { setIsSettingsOpen(false); getDoctorProfile().then(p => setProfile(p)); }} />
        </div>
    );
}
