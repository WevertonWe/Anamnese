'use client';

import { useEffect, useState, useRef } from 'react';
import { getHistory, deleteRecord } from '@/app/actions/history.actions';
import { getDoctorProfile } from '@/app/actions/profile.actions';
import Modal from '@/components/ui/Modal';
import { exportAnamneseToPDF } from '@/lib/exportPdf';

export default function ConsultasList({ refreshTrigger = 0 }: { refreshTrigger?: number }) {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalConfig, setModalConfig] = useState<{ isOpen: boolean, title: string, message: string, children?: React.ReactNode, type: 'success' | 'error' | 'confirm' | 'info', onConfirm?: () => void }>({
        isOpen: false, title: '', message: '', type: 'info'
    });
    const [selectedRecord, setSelectedRecord] = useState<any>(null);
    const [exportMenuOpenId, setExportMenuOpenId] = useState<string | null>(null);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    // Fechar menu de exportação ao clicar fora
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setExportMenuOpenId(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchHistory = async () => {
        setLoading(true);
        const data = await getHistory();
        setRecords(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchHistory();
        // Um event listener para recarregar se necessário, ou usar hooks avançados.
        // Simulando refresh a cada 10s para este MVP de PWA offline
        const interval = setInterval(fetchHistory, 10000);
        return () => clearInterval(interval);
    }, [refreshTrigger]);

    const confirmDelete = (id: string) => {
        setModalConfig({
            isOpen: true,
            title: 'Excluir Anamnese',
            message: 'Tem certeza que deseja apagar este histórico? Esta ação é irreversível.',
            type: 'confirm',
            onConfirm: async () => {
                setModalConfig({ ...modalConfig, isOpen: false });
                const res = await deleteRecord(id);
                if (res.success) {
                    setRecords(records.filter(r => r.id !== id));
                    setModalConfig({ isOpen: true, title: 'Excluído', message: 'Registro removido.', type: 'success' });
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
            </div>
        );

        setSelectedRecord(record);
        setModalConfig({
            isOpen: true,
            title: `Anamnese: ${record.patientName}`,
            message: '',
            children: detailsJSX,
            type: 'info'
        });
    };

    if (loading && records.length === 0) {
        return <div className="animate-pulse flex space-x-4 p-4"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-slate-200 rounded w-3/4"></div></div></div>;
    }

    if (records.length === 0) {
        return <div className="text-sm text-slate-500 text-center py-6">Nenhuma anamnese registrada ainda.</div>;
    }

    return (
        <div className="w-full space-y-3">
            {records.map(record => (
                <div key={record.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 transition-colors">
                    <div className="flex-1 mb-3 sm:mb-0">
                        <h4 className="font-bold text-slate-800">{record.patientName}</h4>
                        <div className="flex gap-3 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                {record.template?.name || "Padrão"}
                            </span>
                            <span className="flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {new Date(record.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto relative">
                        <div className="relative">
                            <button onClick={() => setExportMenuOpenId(exportMenuOpenId === record.id ? null : record.id)} className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition text-center flex items-center justify-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                Exportar
                            </button>
                            {exportMenuOpenId === record.id && (
                                <div ref={exportMenuRef} className="absolute bottom-full right-0 sm:left-0 mb-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-10 overflow-hidden text-left animate-in fade-in slide-in-from-bottom-2 duration-200">
                                    <button
                                        onClick={async () => {
                                            setExportMenuOpenId(null);
                                            const profile = await getDoctorProfile();
                                            exportAnamneseToPDF(record, profile, 'compact');
                                        }}
                                        className="w-full px-4 py-3 text-xs font-medium text-slate-700 hover:bg-slate-50 border-b border-slate-100 flex flex-col items-start"
                                    >
                                        <span className="font-bold text-slate-800">Relatório Compacto</span>
                                        <span className="text-[10px] text-slate-500 font-normal mt-0.5">Texto consolidado em grid limpo</span>
                                    </button>
                                    <button
                                        onClick={async () => {
                                            setExportMenuOpenId(null);
                                            const profile = await getDoctorProfile();
                                            exportAnamneseToPDF(record, profile, 'full');
                                        }}
                                        className="w-full px-4 py-3 text-xs font-medium text-slate-700 hover:bg-slate-50 flex flex-col items-start"
                                    >
                                        <span className="font-bold text-slate-800">Relatório Completo</span>
                                        <span className="text-[10px] text-slate-500 font-normal mt-0.5">Tabela detalhada e zebrada</span>
                                    </button>
                                </div>
                            )}
                        </div>
                        <button onClick={() => viewDetails(record)} className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition text-center">
                            Detalhes
                        </button>
                        <button onClick={() => confirmDelete(record.id)} className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition text-center">
                            Excluir
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
