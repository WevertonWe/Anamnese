'use client';

import { useEffect, useState } from 'react';
import { getHistory, deleteRecord } from '@/app/actions/history.actions';
import Modal from '@/components/ui/Modal';
import { useTranslations } from 'next-intl';

export default function RemoteLinksList({ refreshTrigger = 0, privacyMode = false }: { refreshTrigger?: number, privacyMode?: boolean }) {
    const t = useTranslations('ConsultasList');
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalConfig, setModalConfig] = useState<{ isOpen: boolean, title: string, message: string, type: 'success' | 'error' | 'confirm' | 'info', onConfirm?: () => void }>({
        isOpen: false, title: '', message: '', type: 'info'
    });

    const fetchHistory = async () => {
        setLoading(true);
        const data = await getHistory();
        // Assume remote links are the ones that have a status, or just show all for now since all have status.
        // We'll filter the ones that haven't been completed yet or show all of them.
        setRecords(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchHistory();
        const interval = setInterval(fetchHistory, 10000);
        return () => clearInterval(interval);
    }, [refreshTrigger]);

    const confirmDelete = (id: string) => {
        setModalConfig({
            isOpen: true,
            title: t('deleteTitle'),
            message: t('deleteMessage'),
            type: 'confirm',
            onConfirm: async () => {
                setModalConfig({ ...modalConfig, isOpen: false });
                const res = await deleteRecord(id);
                if (res.success) {
                    setRecords(records.filter(r => r.id !== id));
                    setModalConfig({ isOpen: true, title: t('deleted'), message: t('deletedMsg'), type: 'success' });
                } else {
                    setModalConfig({ isOpen: true, title: 'Erro', message: res.error || 'Erro ao deletar', type: 'error' });
                }
            }
        });
    };

    const copyLink = (id: string, patientName: string) => {
        const origin = window.location.origin.includes('localhost') 
            ? window.location.origin 
            : window.location.origin.replace('http:', 'https:');
            
        const generatedLink = `${origin}/a/${id}`;
        const text = `Olá, ${patientName}! Boas-vindas à consulta.\n\nPor favor, preencha sua pré-anamnese pelo link abaixo:\n🔗 ${generatedLink}\n\nObrigado!`;
        navigator.clipboard.writeText(text);
        setModalConfig({ isOpen: true, title: "Copiado!", message: "Link copiado para a área de transferência.", type: 'success' });
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return { badge: 'bg-emerald-100 text-emerald-800', text: 'Finalizado' };
            case 'OPENED':
                return { badge: 'bg-yellow-100 text-yellow-800', text: 'Paciente Lendo' };
            case 'PENDING':
            default:
                return { badge: 'bg-slate-100 text-slate-800', text: 'Aguardando' };
        }
    };

    if (loading && records.length === 0) {
        return <div className="animate-pulse flex space-x-4 p-4"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-slate-200 rounded w-full"></div></div></div>;
    }

    if (records.length === 0) {
        return <div className="text-sm text-slate-500 text-center py-6">{t('noRecords')}</div>;
    }

    return (
        <div className="w-full space-y-3 bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                        <th className="px-6 py-4">Nome do Paciente</th>
                        <th className="px-6 py-4">Template</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Criado em</th>
                        <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {records.map(record => {
                        const statusUI = getStatusStyle(record.status);
                        return (
                            <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                                <td className={`px-6 py-4 font-bold text-slate-800 ${privacyMode ? 'blur-sm select-none' : ''}`}>
                                    {record.patientName}
                                </td>
                                <td className="px-6 py-4 text-slate-600">
                                    {record.template?.name || "Padrão"}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${statusUI.badge}`}>
                                        {statusUI.text}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-500">
                                    {new Date(record.date || record.createdAt).toLocaleDateString('pt-BR')}
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button 
                                        onClick={() => copyLink(record.id, record.patientName)} 
                                        className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                                    >
                                        Copiar Link
                                    </button>
                                    <button 
                                        onClick={() => confirmDelete(record.id)} 
                                        className="px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition"
                                    >
                                        Excluir
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <Modal
                isOpen={modalConfig.isOpen}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onConfirm={modalConfig.onConfirm}
            />
        </div>
    );
}
