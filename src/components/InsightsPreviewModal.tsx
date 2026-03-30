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
    onExport: (mode: 'compact' | 'full', enrichedData: Record<string, string>) => void | Promise<void>;
    onEmail: (enrichedData: Record<string, string>) => void;
    onClose: () => void;
}

export default function InsightsPreviewModal({
    isOpen, formData, templateSchema, templateId, patientName, consultDate, onExport, onEmail, onClose
}: InsightsPreviewModalProps) {
    const t = useTranslations('InsightsModal');

    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [hipotese, setHipotese] = useState('');
    const [conduta, setConduta] = useState('');
    const [cidList, setCidList] = useState<string[]>([]);
    const [newCid, setNewCid] = useState('');
    const [examesSugeridos, setExamesSugeridos] = useState<string[]>([]);
    const [observacoes, setObservacoes] = useState(formData['observacoes_gerais'] || '');

    // Helper to find values using regex in formData labels or IDs
    const findValue = (regex: RegExp): string | null => {
        // First, check if there's a field in templateSchema that matches the label
        const targetFieldId = fields.find(f => regex.test(f.label || '') || regex.test(f.id))?.id;
        if (targetFieldId && formData[targetFieldId]) return formData[targetFieldId];

        // Fallback: search directly in formData keys (useful for unstructured data)
        const entries = Object.entries(formData);
        const match = entries.find(([key]) => regex.test(key));
        return match ? match[1] : null;
    };

    // IMC Calculation with refined normalization
    const calcIMC = (): { value: number; label: string; color: string } | null => {
        const pesoRaw = findValue(/peso/i) || findValue(/weight/i) || '';
        const alturaRaw = findValue(/altura/i) || findValue(/height/i) || '';
        
        // Clean and parse
        const cleanNumber = (val: string) => {
            if (!val) return 0;
            const cleaned = val.replace(/kg/i, '').replace(/cm/i, '').replace(/m/gi, '').replace(',', '.').trim();
            return parseFloat(cleaned);
        };

        const peso = cleanNumber(pesoRaw);
        const alturaVal = cleanNumber(alturaRaw);

        if (isOpen) {
            console.log("Valores detectados para IMC:", { peso, altura: alturaVal, pesoRaw, alturaRaw });
        }

        if (!peso || !alturaVal || peso <= 0 || alturaVal <= 0) return null;
        
        // Normalização: altura > 100 assume cm, senão metros (também trata valores entre 3 e 100 como metros se for mais razoável, mas o limite 100 é comum para cm)
        // Se > 100, definitivamente cm. Se entre 3 e 100, provavelmente cm também (ex: 175cm vs 1.75m)
        const h = alturaVal > 3 ? alturaVal / 100 : alturaVal;
        const imcValue = peso / (h * h);
        
        console.log("IMC Calculado:", { imc: imcValue.toFixed(2), h });

        if (imcValue < 18.5) return { value: imcValue, label: 'Abaixo do peso', color: 'text-blue-700 bg-blue-50 border-blue-200' };
        if (imcValue < 25) return { value: imcValue, label: 'Normal', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
        if (imcValue < 30) return { value: imcValue, label: 'Sobrepeso', color: 'text-orange-700 bg-orange-50 border-orange-200' };
        if (imcValue < 35) return { value: imcValue, label: 'Obesidade I', color: 'text-red-600 bg-red-50 border-red-200' };
        if (imcValue < 40) return { value: imcValue, label: 'Obesidade II', color: 'text-red-700 bg-red-50 border-red-200' };
        return { value: imcValue, label: 'Obesidade III', color: 'text-red-800 bg-red-100 border-red-300' };
    };

    const addCid = () => {
        const trimmed = newCid.trim().toUpperCase();
        if (trimmed && !cidList.includes(trimmed)) {
            setCidList(prev => [...prev, trimmed]);
            setNewCid('');
        }
    };

    const removeCid = (cid: string) => {
        setCidList(prev => prev.filter(c => c !== cid));
    };

    useEffect(() => {
        if (isOpen) {
            const rawHipotese = formData['hipotese_diagnostica'] || '';
            // Limpeza preventiva: remove prefixoes de IMC se existirem (ex: de versões antigas)
            const cleanHipotese = rawHipotese.replace(/^(IMC|IMC Calculado):\s*[\d.]+\s*-\s*[^.]+\.?\s*/i, '');
            setHipotese(cleanHipotese);
            
            setConduta(formData['conduta_sugerida'] || '');
            setObservacoes(formData['observacoes_gerais'] || '');
            const existingCid = formData['cid_sugerido'];
            if (existingCid) {
                setCidList(typeof existingCid === 'string' ? existingCid.split(', ').filter(Boolean) : []);
            } else {
                setCidList([]);
            }
            const existingExames = formData['exames_sugeridos'];
            if (existingExames) {
                setExamesSugeridos(typeof existingExames === 'string' ? existingExames.split(', ').filter(Boolean) : []);
            } else {
                setExamesSugeridos([]);
            }

            fetchInsights();
        }
    }, [isOpen]);

    const fetchInsights = async () => {
        setIsLoading(true);
        const { getRecentPatientHistory } = await import('@/app/actions/history.actions');
        const patientHistory = await getRecentPatientHistory(patientName);

        const result = await getClinicalInsights({ formData, templateId, patientHistory: patientHistory || undefined });
        setIsLoading(false);

        if (result.success && result.data) {
            if (result.data.hipotese_diagnostica) setHipotese(result.data.hipotese_diagnostica);
            if (result.data.conduta_sugerida) setConduta(result.data.conduta_sugerida);
            if (result.data.cid_sugerido?.length) setCidList(result.data.cid_sugerido);
            if (result.data.exames_sugeridos?.length) setExamesSugeridos(result.data.exames_sugeridos);
        }
    };

    const getEnrichedData = (): Record<string, string> => {
        const imcData = calcIMC();
        return {
            ...formData,
            hipotese_diagnostica: hipotese,
            conduta_sugerida: conduta,
            cid_sugerido: cidList.join(', '),
            observacoes_gerais: observacoes,
            ...(imcData ? { imc_calculado: `${imcData.value.toFixed(1)} - ${imcData.label}` } : {}),
        };
    };

    const handleDownloadPDF = async (e: React.MouseEvent, mode: 'compact' | 'full') => {
        e.preventDefault();
        e.stopPropagation();
        setIsExporting(true);
        try {
            await onExport(mode, getEnrichedData());
        } finally {
            setIsExporting(false);
        }
    };

    if (!isOpen) return null;

    let fields: { id: string; label: string; type: string }[] = [];
    if (templateSchema) {
        if (typeof templateSchema === 'string') {
            try {
                const parsed = JSON.parse(templateSchema);
                fields = parsed.fields || [];
            } catch (e) {
                console.error("Erro ao parsear templateSchema string:", e);
            }
        } else {
            fields = (templateSchema as any).fields || [];
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">

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

                {/* Body - Removido overflow-hidden excessivo para evitar conflitos de scroll */}
                <div className="flex-1 min-h-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 h-full">

                        {/* Coluna Esquerda: Dados Preenchidos (Scroll Independente) */}
                        <div className="flex flex-col h-[calc(80vh-120px)] bg-slate-50/50 border-r border-slate-100 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">


                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">{t('filledData')}</h3>
                            
                            <div className="space-y-4">

                                {fields.length > 0 ? fields.map(field => {
                                    const val = formData[field.id];
                                    if (!val) return null;
                                    return (
                                        <div key={field.id} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm group hover:border-emerald-200 transition-colors">
                                            <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 opacity-80 group-hover:opacity-100">
                                                <div className="w-1 h-3 bg-emerald-500 rounded-full"></div>
                                                {field.label || field.id}
                                            </div>
                                            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed pl-2.5">{val}</p>
                                        </div>
                                    );
                                }) : (
                                    <div className="text-center py-10 text-slate-400">
                                        <p className="text-sm italic">Nenhum dado clínico para exibir.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Coluna Direita: Insights da IA (Editáveis e Scroll Independente) */}
                        <div className="flex flex-col h-[calc(80vh-120px)] overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">

                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                {t('aiInsights')}
                            </h3>

                            {/* VitalSignsCard - Barra Horizontal Compacta */}
                            {(() => {
                                const imc = calcIMC();
                                if (!imc) return null;
                                return (
                                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 mb-6 flex items-center justify-between shadow-sm animate-in slide-in-from-top-2 duration-500">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white p-2 rounded-lg shadow-inner text-emerald-500">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                            </div>
                                            <div>
                                                <div className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">IMC</div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl font-black text-emerald-700 leading-none">{imc.value.toFixed(1)}</span>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md uppercase tracking-wider">
                                                        {imc.label}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}


                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
                                    <div className="relative">
                                        <svg className="animate-spin h-10 w-10 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold animate-pulse text-emerald-600">{t('generating')}</span>
                                    <p className="text-xs text-slate-400 max-w-[200px] text-center">Nossa IA está analisando os dados e cruzando com o histórico do paciente...</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* CID-10 Editável */}
                                    <div className="bg-blue-50/30 border border-blue-100 rounded-2xl p-4">
                                        <label className="text-xs font-bold text-blue-700 mb-2.5 block flex items-center gap-1.5">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                                            {t('cidLabel')}
                                        </label>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {cidList.length > 0 ? cidList.map((cid, i) => (
                                                <span key={i} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-black rounded-lg flex items-center gap-1.5 shadow-sm">
                                                    {cid}
                                                    <button onClick={() => removeCid(cid)} className="hover:text-red-200 transition p-0.5">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </span>
                                            )) : (
                                                <div className="w-full text-center py-2 text-xs text-slate-400 border border-dashed border-blue-200 rounded-lg">Aguardando sugestão de CID...</div>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newCid}
                                                onChange={e => setNewCid(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCid())}
                                                className="flex-1 border border-blue-200 rounded-xl px-4 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-400 outline-none bg-white shadow-inner"
                                                placeholder="Adicionar CID manualmente (ex: G44.1)"
                                            />
                                            <button onClick={addCid} className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-md">+</button>
                                        </div>
                                    </div>

                                    {/* Hipótese */}
                                    <div className="group">
                                        <label className="text-xs font-bold text-emerald-700 mb-2 block flex items-center gap-1.5">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                            {t('hypothesisLabel')}
                                        </label>
                                        <textarea
                                            value={hipotese}
                                            onChange={e => setHipotese(e.target.value)}
                                            className="w-full border border-slate-200 rounded-2xl p-4 text-sm text-slate-700 focus:ring-2 focus:ring-emerald-400 outline-none h-28 resize-none bg-white shadow-sm hover:border-emerald-200 transition-all font-medium leading-relaxed"
                                            placeholder={t('hypothesisPlaceholder')}
                                        />
                                    </div>

                                    {/* Conduta */}
                                    <div className="group">
                                        <label className="text-xs font-bold text-indigo-700 mb-2 block flex items-center gap-1.5">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            {t('conductLabel')}
                                        </label>
                                        <textarea
                                            value={conduta}
                                            onChange={e => setConduta(e.target.value)}
                                            className="w-full border border-slate-200 rounded-2xl p-4 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-400 outline-none h-28 resize-none bg-white shadow-sm hover:border-indigo-200 transition-all font-medium leading-relaxed"
                                            placeholder={t('conductPlaceholder')}
                                        />
                                    </div>

                                    {/* Exames Sugeridos */}
                                    {examesSugeridos.length > 0 && (
                                        <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-4">
                                            <label className="text-[10px] font-black text-orange-700 mb-2.5 block uppercase tracking-widest">{t('suggestedExamsLabel')}</label>
                                            <div className="flex flex-wrap gap-2">
                                                {examesSugeridos.map((exam, i) => (
                                                    <span key={i} className="px-3 py-1 bg-white border border-orange-200 text-orange-700 text-[11px] font-bold rounded-full shadow-sm">
                                                        {exam}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Observações */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-2 block">{t('obsLabel')}</label>
                                        <textarea
                                            value={observacoes}
                                            onChange={e => setObservacoes(e.target.value)}
                                            className="w-full border border-slate-200 rounded-xl p-3 text-xs text-slate-600 focus:ring-2 focus:ring-slate-400 outline-none h-16 resize-none bg-slate-50 shadow-inner"
                                            placeholder={t('obsPlaceholder')}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer - Fixado e Sticky */}
                <div className="p-5 border-t border-slate-200 bg-white sticky bottom-0 z-10 flex flex-col sm:flex-row justify-between items-center gap-4 flex-shrink-0 shadow-[0_-10px_20px_-15px_rgba(0,0,0,0.05)]">


                    <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition">
                        {t('cancel')}
                    </button>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button
                            onClick={() => onEmail(getEnrichedData())}
                            className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition flex items-center justify-center gap-2 shadow-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            {t('email')}
                        </button>
                        <button
                            type="button"
                            onClick={(e) => handleDownloadPDF(e, 'compact')}
                            disabled={isLoading || isExporting}
                            className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                        >
                            {isExporting ? (
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            )}
                            {isExporting ? t('generating') : t('pdfCompact')}
                        </button>
                        <button
                            type="button"
                            onClick={(e) => handleDownloadPDF(e, 'full')}
                            disabled={isLoading || isExporting}
                            className="flex-1 sm:flex-none px-8 py-2.5 text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition flex items-center justify-center gap-2 shadow-emerald-200 shadow-xl disabled:opacity-50"
                        >
                            {isExporting ? (
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            )}
                            {isExporting ? t('generating') : t('pdfFull')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
