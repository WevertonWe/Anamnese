'use client';

import { useEffect, useState } from 'react';
import { getHistory, deleteRecord, toggleReadStatus, updateRecordStatus } from '@/app/actions/history.actions';
import { getDoctorProfile } from '@/app/actions/profile.actions';
import Modal from '@/components/ui/Modal';
import { exportAnamneseToPDF } from '@/lib/exportPdf';
import { useTranslations } from 'next-intl';

export default function ConsultasList({ refreshTrigger = 0, onReview }: { refreshTrigger?: number, onReview?: (record: any) => void }) {
    const t = useTranslations('ConsultasList');
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalConfig, setModalConfig] = useState<{ isOpen: boolean, title: string, message: string, children?: React.ReactNode, type: 'success' | 'error' | 'confirm' | 'info', onConfirm?: () => void }>({
        isOpen: false, title: '', message: '', type: 'info'
    });
    const [selectedRecord, setSelectedRecord] = useState<any>(null);

    const fetchHistory = async () => {
        setLoading(true);
        const data = await getHistory();
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

    const handleReview = (record: any) => {
        if (!record.isRead) {
            toggleReadStatus(record.id).then(() => {
                setRecords(prev => prev.map(r => r.id === record.id ? { ...r, isRead: true } : r));
            });
        }
        if (onReview) onReview(record);
    };

    if (loading && records.length === 0) {
        return <div className="animate-pulse flex space-x-4 p-4"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-slate-200 rounded w-3/4"></div></div></div>;
    }

    if (records.length === 0) {
        return <div className="text-sm text-slate-500 text-center py-6">{t('noRecords')}</div>;
    }

    return (
        <div className="w-full space-y-4">
            {records.map(record => (
                <div key={record.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-white/40 backdrop-blur-sm border border-white/60 rounded-[2rem] shadow-sm hover:shadow-md hover:bg-white/80 transition-all group border-slate-100">
                    <div className="flex-1 mb-4 sm:mb-0 relative pr-4">
                        <div className="flex items-center gap-3">
                            <h4 className="font-black text-slate-900 tracking-tight text-base">{record.patientName}</h4>
                            {!record.isRead && (
                                <span className="flex h-2.5 w-2.5 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                </span>
                            )}
                        </div>
                        <div className="flex gap-4 text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest">
                            <span className="flex items-center gap-1.5 bg-slate-100/50 px-2.5 py-1 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                {record.template?.name || "Padrão"}
                            </span>
                            <span className="flex items-center gap-1.5 bg-slate-100/50 px-2.5 py-1 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {new Date(record.date || record.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                        </div>
                        
                        {/* Status Switcher Premium */}
                        <div className="mt-4 flex items-center gap-3 cursor-pointer group/status select-none" onClick={() => {
                            const newStatus = record.status === 'COMPLETED' ? 'PENDING' : record.status === 'PENDING' ? 'OPENED' : 'COMPLETED';
                            updateRecordStatus(record.id, newStatus).then(() => {
                                setRecords(prev => prev.map(r => r.id === record.id ? { ...r, status: newStatus } : r));
                            });
                        }}>
                            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                                <div className={`h-full transition-all duration-700 ease-in-out shadow-[0_0_8px] shadow-current ${record.status === 'COMPLETED' ? 'w-full bg-primary text-primary/30' : record.status === 'OPENED' ? 'w-2/3 bg-blue-400 text-blue-400/30' : 'w-1/3 bg-slate-300 text-slate-300/30'}`}></div>
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-tighter transition-colors ${record.status === 'COMPLETED' ? 'text-primary' : record.status === 'OPENED' ? 'text-blue-500' : 'text-slate-400'}`}>
                                {record.status === 'COMPLETED' ? 'Finalizado' : record.status === 'OPENED' ? 'Em Análise' : 'Pendente'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button 
                            onClick={() => handleReview(record)} 
                            className="flex-1 sm:flex-none px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white bg-slate-900 hover:bg-slate-800 rounded-2xl transition-all text-center flex items-center justify-center gap-2 shadow-xl shadow-slate-200 active:scale-95"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            Revisar
                        </button>
                        <button 
                            onClick={() => confirmDelete(record.id)} 
                            className="flex-1 sm:flex-none p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all active:scale-90"
                            title={t('delete')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                </div>
            ))}

            <Modal
                isOpen={modalConfig.isOpen}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onConfirm={modalConfig.onConfirm}
            >
                {modalConfig.children}
            </Modal>
        </div>
    );
}
