'use client';

import { useState, useEffect } from 'react';
import { getClinicalInsights } from '@/app/actions/insights.actions';
import { useTranslations } from 'next-intl';

interface InsightsPreviewModalProps {
    isOpen: boolean;
    formData: Record<string, string>;
    templateSchema: { fields: { id: string; label: string; type: string }[] } | null;
    templateId: string;
    patientName: string;
    consultDate: string;
    onExport: (mode: 'compact' | 'full', enrichedData: Record<string, string>) => void;
    onEmail: (enrichedData: Record<string, string>) => void;
    onClose: () => void;
}

export default function InsightsPreviewModal({
    isOpen, formData, templateSchema, templateId, patientName, consultDate, onExport, onEmail, onClose
}: InsightsPreviewModalProps) {
    const t = useTranslations('InsightsModal');

    const [isLoading, setIsLoading] = useState(false);
    const [hipotese, setHipotese] = useState('');
    const [conduta, setConduta] = useState('');
    const [cidList, setCidList] = useState<string[]>([]);
    const [observacoes, setObservacoes] = useState(formData['observacoes_gerais'] || '');

    useEffect(() => {
        if (isOpen) {
            setHipotese(formData['hipotese_diagnostica'] || '');
            setConduta(formData['conduta_sugerida'] || '');
            setObservacoes(formData['observacoes_gerais'] || '');
            const existingCid = formData['cid_sugerido'];
            if (existingCid) {
                setCidList(typeof existingCid === 'string' ? existingCid.split(', ').filter(Boolean) : []);
            } else {
                setCidList([]);
            }
            fetchInsights();
        }
    }, [isOpen]);

    const fetchInsights = async () => {
        setIsLoading(true);
        const result = await getClinicalInsights({ formData, templateId });
        setIsLoading(false);

        if (result.success && result.data) {
            if (result.data.hipotese_diagnostica) setHipotese(result.data.hipotese_diagnostica);
            if (result.data.conduta_sugerida) setConduta(result.data.conduta_sugerida);
            if (result.data.cid_sugerido?.length) setCidList(result.data.cid_sugerido);
        }
    };

    const getEnrichedData = (): Record<string, string> => ({
        ...formData,
        hipotese_diagnostica: hipotese,
        conduta_sugerida: conduta,
        cid_sugerido: cidList.join(', '),
        observacoes_gerais: observacoes,
    });

    if (!isOpen) return null;

    const fields = templateSchema?.fields || [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">

                {/* Header */}
                <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-emerald-50/30 flex justify-between items-center flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            {t('title')}
                        </h2>
                        <p className="text-sm text-slate-500 mt-0.5">{patientName} — {new Date(consultDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Lado Esquerdo: Dados Preenchidos */}
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{t('filledData')}</h3>
                            <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                                {fields.map(field => {
                                    const val = formData[field.id];
                                    if (!val) return null;
                                    return (
                                        <div key={field.id} className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                                            <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">{field.label || field.id}</div>
                                            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{val}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Lado Direito: AI Insights */}
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                {t('aiInsights')}
                            </h3>

                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
                                    <svg className="animate-spin h-8 w-8 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    <span className="text-sm font-medium">{t('generating')}</span>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* CID-10 Tags */}
                                    <div>
                                        <label className="text-xs font-bold text-blue-700 mb-1.5 block">{t('cidLabel')}</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {cidList.length > 0 ? cidList.map((cid, i) => (
                                                <span key={i} className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold rounded-md">{cid}</span>
                                            )) : (
                                                <span className="text-xs text-slate-400 italic">{t('noCid')}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Hipótese */}
                                    <div>
                                        <label className="text-xs font-bold text-purple-700 mb-1 block flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                            {t('hypothesisLabel')}
                                        </label>
                                        <textarea
                                            value={hipotese}
                                            onChange={e => setHipotese(e.target.value)}
                                            className="w-full border border-purple-200 rounded-lg p-3 text-sm text-slate-800 focus:ring-2 focus:ring-purple-400 outline-none h-20 resize-none bg-purple-50/40"
                                            placeholder={t('hypothesisPlaceholder')}
                                        />
                                    </div>

                                    {/* Conduta */}
                                    <div>
                                        <label className="text-xs font-bold text-indigo-700 mb-1 block flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                            {t('conductLabel')}
                                        </label>
                                        <textarea
                                            value={conduta}
                                            onChange={e => setConduta(e.target.value)}
                                            className="w-full border border-indigo-200 rounded-lg p-3 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-400 outline-none h-20 resize-none bg-indigo-50/40"
                                            placeholder={t('conductPlaceholder')}
                                        />
                                    </div>

                                    {/* Observações */}
                                    <div>
                                        <label className="text-xs font-bold text-emerald-700 mb-1 block">{t('obsLabel')}</label>
                                        <textarea
                                            value={observacoes}
                                            onChange={e => setObservacoes(e.target.value)}
                                            className="w-full border border-emerald-200 rounded-lg p-3 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-400 outline-none h-16 resize-none bg-emerald-50/40"
                                            placeholder={t('obsPlaceholder')}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-3 flex-shrink-0">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition">
                        {t('cancel')}
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onEmail(getEnrichedData())}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition flex items-center gap-1.5"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            {t('email')}
                        </button>
                        <button
                            onClick={() => onExport('compact', getEnrichedData())}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-bold text-white bg-slate-700 hover:bg-slate-800 rounded-lg transition flex items-center gap-1.5 disabled:opacity-50"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            {t('pdfCompact')}
                        </button>
                        <button
                            onClick={() => onExport('full', getEnrichedData())}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition flex items-center gap-1.5 disabled:opacity-50"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            {t('pdfFull')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
