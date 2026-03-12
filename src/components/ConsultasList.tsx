'use client';

import { useEffect, useState } from 'react';
import { getHistory, deleteRecord, toggleReadStatus, updateRecordStatus } from '@/app/actions/history.actions';
import { getDoctorProfile } from '@/app/actions/profile.actions';
import Modal from '@/components/ui/Modal';
import { exportAnamneseToPDF } from '@/lib/exportPdf';
import { useTranslations } from 'next-intl';

export default function ConsultasList({ refreshTrigger = 0 }: { refreshTrigger?: number }) {
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

    const viewDetails = (record: any) => {
        const fieldLabels: Record<string, string> = {};
        if (record.template?.schema?.fields) {
            record.template.schema.fields.forEach((field: any) => {
                fieldLabels[field.id] = field.label || field.id;
            });
        }

        const handleExportFromModal = async (mode: 'compact' | 'full') => {
            const profile = await getDoctorProfile();
            exportAnamneseToPDF(record, profile, mode);
        };

        const detailsJSX = (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 mt-4 custom-scrollbar text-left w-full">
                {Object.entries(record.data).map(([k, v]) => {
                    const label = fieldLabels[k] || k.replace(/_/g, ' ');
                    return (
                        <div key={k} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0 bg-slate-50 border border-slate-100 p-4 rounded-xl shadow-sm">
                            <h4 className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {label}
                            </h4>
                            <p className="text-slate-700 font-medium text-sm leading-relaxed whitespace-pre-wrap pl-5 border-l-2 border-slate-200">
                                {Array.isArray(v) ? v.join(', ') : String(v)}
                            </p>
                        </div>
                    );
                })}

                {/* Export Buttons inside modal */}
                <div className="pt-3 border-t border-slate-200 flex gap-2">
                    <button
                        onClick={() => handleExportFromModal('compact')}
                        className="flex-1 px-4 py-2.5 text-xs font-bold text-white bg-slate-700 hover:bg-slate-800 rounded-lg transition flex items-center justify-center gap-1.5"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        PDF Compacto
                    </button>
                    <button
                        onClick={() => handleExportFromModal('full')}
                        className="flex-1 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition flex items-center justify-center gap-1.5"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        PDF Completo
                    </button>
                </div>
            </div>
        );

        if (!record.isRead) {
            toggleReadStatus(record.id).then(() => {
                setRecords(prev => prev.map(r => r.id === record.id ? { ...r, isRead: true } : r));
            });
        }

        setSelectedRecord(record);
        setModalConfig({
            isOpen: true,
            title: `${t('anamneseOf')}: ${record.patientName}`,
            message: '',
            children: detailsJSX,
            type: 'info'
        });
    };

    if (loading && records.length === 0) {
        return <div className="animate-pulse flex space-x-4 p-4"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-slate-200 rounded w-3/4"></div></div></div>;
    }

    if (records.length === 0) {
        return <div className="text-sm text-slate-500 text-center py-6">{t('noRecords')}</div>;
    }

    return (
        <div className="w-full space-y-3">
            {records.map(record => (
                <div key={record.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 transition-colors">
                    <div className="flex-1 mb-3 sm:mb-0 relative">
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-800">{record.patientName}</h4>
                            {!record.isRead && (
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                            )}
                        </div>
                        <div className="flex gap-3 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                {record.template?.name || "Padrão"}
                            </span>
                            <span className="flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {new Date(record.date || record.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                        </div>
                        
                        {/* Progress Bar Amarelo -> Verde */}
                        <div className="mt-3 flex items-center gap-2 cursor-pointer group" onClick={() => {
                            const newStatus = record.status === 'COMPLETED' ? 'PENDING' : record.status === 'PENDING' ? 'OPENED' : 'COMPLETED';
                            updateRecordStatus(record.id, newStatus).then(() => {
                                setRecords(prev => prev.map(r => r.id === record.id ? { ...r, status: newStatus } : r));
                            });
                        }}>
                            <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden flex">
                                <div className={`h-full transition-all duration-500 ease-out ${record.status === 'COMPLETED' ? 'w-full bg-emerald-500' : record.status === 'OPENED' ? 'w-2/3 bg-yellow-400' : 'w-1/3 bg-slate-400'}`}></div>
                            </div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-slate-600 transition">
                                {record.status === 'COMPLETED' ? 'Finalizado' : record.status === 'OPENED' ? 'Visualizado' : 'Pendente'}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button 
                            onClick={() => viewDetails(record)} 
                            className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition text-center flex items-center justify-center gap-1.5 shadow-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            Revisar e Exportar
                        </button>
                        <button onClick={() => confirmDelete(record.id)} className="flex-1 sm:flex-none px-3 py-2 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition text-center">
                            {t('delete')}
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
