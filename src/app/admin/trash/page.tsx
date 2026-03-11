'use client';

import { useState } from 'react';
import { permanentDeleteDoctor } from '@/app/actions/admin.actions';
import { useTranslations } from 'next-intl';

export default function AdminTrashPage() {
    const [doctorId, setDoctorId] = useState('');
    const [confirmText, setConfirmText] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const handleDelete = async () => {
        if (confirmText !== 'EXCLUIR') return;
        setLoading(true);
        const res = await permanentDeleteDoctor(doctorId);
        setLoading(false);

        if (res.success) {
            setToast({ message: `Sucesso! Médico removido e ${res.filesDeleted} arquivos apagados do Storage`, type: 'success' });
            setDoctorId('');
            setConfirmText('');
        } else {
            setToast({ message: res.error || 'Erro ao excluir.', type: 'error' });
        }
    };

    return (
        <div className="max-w-xl mx-auto mt-12 p-6 bg-white border border-red-200 rounded-2xl shadow-sm">
            <h1 className="text-2xl font-bold text-red-600 mb-6 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Lixeira do Administrador
            </h1>

            <p className="text-sm text-slate-600 mb-6">Esta ação removerá permanentemente o médico e purgará todos os seus arquivos de branding (loga e assinatura) do Storage.</p>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">ID do Médico a excluir</label>
                    <input type="text" value={doctorId} onChange={e => setDoctorId(e.target.value)} className="w-full border border-slate-300 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-red-500 outline-none" placeholder="ID do Médico..." />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Digite EXCLUIR para confirmar</label>
                    <input type="text" value={confirmText} onChange={e => setConfirmText(e.target.value)} className="w-full border border-slate-300 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-red-500 outline-none" placeholder="EXCLUIR" />
                </div>

                <button 
                    onClick={handleDelete} 
                    disabled={loading || confirmText !== 'EXCLUIR' || !doctorId} 
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition disabled:opacity-50"
                >
                    {loading ? 'Processando...' : 'Remover Definitivamente'}
                </button>
            </div>

            {toast && (
                <div className={`mt-6 p-4 rounded-lg text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {toast.message}
                </div>
            )}
        </div>
    );
}
