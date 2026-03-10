'use client';

import { loginUserWithCredentials, registerUser } from '@/app/actions/auth.actions';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const errorQuery = searchParams.get('error');
        if (errorQuery) {
            setErrorMsg(errorQuery);
        }
    }, [searchParams]);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setIsLoading(true);

        if (!formData.email || !formData.password) {
            setErrorMsg('Preencha e-mail e senha.');
            setIsLoading(false);
            return;
        }
        const res = await loginUserWithCredentials(formData.email, formData.password);
        if (res.success) {
            router.push('/');
        } else {
            setErrorMsg(res.error || 'Credenciais inválidas.');
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
                <div className="p-8 text-center bg-slate-900">
                    <h1 className="text-3xl font-bold text-white mb-2">Anamnese PWA</h1>
                    <p className="text-slate-300 text-sm font-medium">Ecossistema Clínico Privado</p>
                </div>

                <div className="p-8 space-y-6">
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-slate-800 mb-1">Acesse seu Perfil</h2>
                        <p className="text-slate-500 text-sm">Gerencie seus relatórios com segurança.</p>
                    </div>

                    {errorMsg && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center font-medium">
                            {errorMsg}
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">E-mail</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full border border-slate-300 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                                placeholder="seu@email.com"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Senha</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full border border-slate-300 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full p-4 rounded-xl font-bold text-white transition-all ${isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg'}`}
                        >
                            {isLoading ? 'Aguarde...' : 'Entrar na Plataforma'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
