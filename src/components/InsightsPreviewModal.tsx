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
    const [prescricao, setPrescricao] = useState('');
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
            setPrescricao(formData['prescricao_medica'] || '');
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
            if (result.data.prescricao) setPrescricao(result.data.prescricao);
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
            prescricao_medica: prescricao,
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden border border-white/50">

                {/* Header Premium */}
                <div className="p-8 pb-6 flex justify-between items-start flex-shrink-0 relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="bg-primary/10 p-2 rounded-2xl">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t('title')}</h2>
                        </div>
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest pl-11">{patientName} <span className="mx-2 text-slate-200">|</span> {new Date(consultDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <button onClick={onClose} className="bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition p-3 rounded-2xl active:scale-90">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 min-h-0 bg-white">
                    <div className="grid grid-cols-1 lg:grid-cols-2 h-full gap-0 divide-x divide-slate-100">

                        {/* Coluna Esquerda: Dados Preenchidos */}
                        <div className="flex flex-col bg-slate-50/30 border-r border-slate-100 max-h-[68vh] xl:max-h-[72vh] overflow-y-auto p-8 pt-2 custom-scrollbar relative">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 sticky top-0 bg-white/80 backdrop-blur-sm pt-4 pb-2 z-10 flex items-center gap-2">
                                {t('filledData')}
                            </h3>
                            
                            <div className="space-y-4 pb-8">
                                {fields.length > 0 ? fields.map(field => {
                                    const val = formData[field.id];
                                    if (!val) return null;
                                    return (
                                        <div key={field.id} className="bg-white/60 backdrop-blur-sm border border-slate-100 rounded-2xl p-5 shadow-sm group hover:border-primary/20 hover:bg-white transition-all">
                                            <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-2 opacity-80 group-hover:opacity-100">
                                                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                                                {field.label || field.id}
                                            </div>
                                            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-medium">{val}</p>
                                        </div>
                                    );
                                }) : (
                                    <div className="text-center py-20 text-slate-300">
                                        <p className="text-sm font-black uppercase tracking-widest italic opacity-50">Nenhum dado clínico para exibir</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Coluna Direita: Insights da IA */}
                        <div className="flex flex-col h-full max-h-[68vh] xl:max-h-[72vh] overflow-y-auto p-8 pt-2 custom-scrollbar bg-slate-50/10 relative">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 sticky top-0 bg-white/80 backdrop-blur-sm pt-4 pb-2 z-10 flex items-center gap-2">
                                <div className="w-3.5 h-3.5 bg-primary/20 rounded-full flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
                                </div>
                                {t('aiInsights')}
                            </h3>

                            {/* VitalSigns/IMC Card */}
                            {(() => {
                                const imc = calcIMC();
                                if (!imc) return null;
                                return (
                                    <div className="bg-primary/5 border border-primary/10 rounded-3xl p-5 mb-8 flex items-center justify-between shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary/10 transition-all"></div>
                                        <div className="flex items-center gap-4 relative z-10">
                                            <div className="bg-white p-3 rounded-[1.5rem] shadow-sm text-primary">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-1">Índice Clínica (IMC)</div>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-3xl font-black text-slate-900 tracking-tighter">{imc.value.toFixed(1)}</span>
                                                    <span className={`text-[10px] font-black px-3 py-1 rounded-xl uppercase tracking-widest border ${imc.color}`}>
                                                        {imc.label}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center h-full gap-6 opacity-0 animate-in fade-in duration-1000 fill-mode-forwards">
                                    <div className="relative w-16 h-16">
                                        <div className="absolute inset-0 border-4 border-primary/10 rounded-full"></div>
                                        <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-2 h-2 bg-primary rounded-full animate-ping"></div>
                                        </div>
                                    </div>
                                    <div className="text-center px-8">
                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-primary animate-pulse">{t('generating')}</span>
                                        <p className="text-[10px] text-slate-400 max-w-[240px] mt-2 font-bold uppercase tracking-widest leading-relaxed">Cruzando dados clínicos com o histórico do paciente...</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-8 pb-12">
                                    {/* CID Tags */}
                                    <div className="bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6 group focus-within:border-primary/30 transition-all">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                                            {t('cidLabel')}
                                        </label>
                                        <div className="flex flex-wrap gap-2 mb-4 min-h-[44px]">
                                            {cidList.length > 0 ? cidList.map((cid, i) => (
                                                <span key={i} className="px-5 py-2.5 bg-slate-900 text-white text-[11px] font-black rounded-2xl flex items-center gap-2 shadow-xl shadow-slate-300 active:scale-95 group/tag transition-all border border-white/10">
                                                    <span className="text-primary mr-1">●</span>
                                                    {cid}
                                                    <button onClick={() => removeCid(cid)} className="text-white/40 hover:text-red-400 transition">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </span>
                                            )) : (
                                                <div className="w-full text-center py-4 text-[9px] font-bold text-slate-300 uppercase tracking-widest border-2 border-dashed border-slate-100 rounded-2xl">Aguardando sugestão...</div>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newCid}
                                                onChange={e => setNewCid(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCid())}
                                                className="flex-1 border border-slate-200 rounded-2xl px-5 py-3 text-sm text-slate-900 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none bg-white transition-all font-medium placeholder:text-slate-300"
                                                placeholder="Adicione CID Manual..."
                                            />
                                            <button onClick={addCid} className="w-12 h-12 flex items-center justify-center bg-slate-900 text-primary hover:bg-slate-800 rounded-2xl transition shadow-xl active:scale-90 font-black text-xl">+</button>
                                        </div>
                                    </div>

                                    {/* Hipótese Diagnóstica */}
                                    <div className="flex flex-col">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                                            {t('hypothesisLabel')}
                                        </label>
                                        <textarea
                                            value={hipotese}
                                            onChange={e => setHipotese(e.target.value)}
                                            className="w-full border-2 border-slate-200 shadow-sm rounded-[2rem] p-6 text-sm text-slate-800 bg-white focus:ring-8 focus:ring-primary/5 focus:border-primary outline-none h-40 resize-none transition-all font-semibold leading-relaxed"
                                            placeholder={t('hypothesisPlaceholder')}
                                        />
                                    </div>

                                    {/* Conduta Sugerida */}
                                    <div className="flex flex-col">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                                            {t('conductLabel')}
                                        </label>
                                        <textarea
                                            value={conduta}
                                            onChange={e => setConduta(e.target.value)}
                                            className="w-full border border-slate-200 rounded-[2rem] p-6 text-sm text-slate-700 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none h-36 resize-none transition-all font-medium leading-relaxed"
                                            placeholder={t('conductPlaceholder')}
                                        />
                                    </div>

                                    {/* Prescrição Médica */}
                                    <div className="flex flex-col">
                                        <div className="flex items-center justify-between mb-3 px-1">
                                            <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                                💊 Prescrição Médica
                                            </label>
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(prescricao);
                                                }}
                                                className="text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 bg-emerald-100/50 hover:bg-emerald-100 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
                                                title="Copiar para Área de Transferência"
                                                aria-label="Copiar prescrição médica"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                Copiar
                                            </button>
                                        </div>
                                        <textarea
                                            value={prescricao}
                                            onChange={e => setPrescricao(e.target.value)}
                                            className="w-full border border-emerald-100 rounded-[2rem] p-6 text-sm text-emerald-900 bg-emerald-50/30 focus:bg-emerald-50 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 outline-none h-40 resize-none transition-all font-medium leading-relaxed shadow-inner placeholder:text-emerald-300"
                                            placeholder="Ex: 1. Dipirona 500mg - 1cp 6/6h se dor..."
                                        />
                                    </div>

                                    {/* Exames Sugeridos */}
                                    {examesSugeridos.length > 0 && (
                                        <div className="bg-slate-900 rounded-[2rem] p-6 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
                                            <label className="text-[10px] font-black text-primary uppercase tracking-widest mb-4 block">{t('suggestedExamsLabel')}</label>
                                            <div className="flex flex-wrap gap-2">
                                                {examesSugeridos.map((exam, i) => (
                                                    <span key={i} className="px-4 py-2 bg-white/10 text-white text-[10px] font-black rounded-xl border border-white/10 uppercase tracking-tighter">
                                                        {exam}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Observações */}
                                    <div className="flex flex-col transition-opacity">
                                        <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-2 px-1">{t('obsLabel')}</label>
                                        <textarea
                                            value={observacoes}
                                            onChange={e => setObservacoes(e.target.value)}
                                            className="w-full border border-slate-100 rounded-2xl p-4 text-xs text-slate-800 italic bg-slate-50 outline-none min-h-[100px] resize-none font-medium placeholder:text-slate-400"
                                            placeholder={t('obsPlaceholder')}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Premium */}
                <div className="p-8 border-t border-slate-100 bg-white/80 backdrop-blur-md sticky bottom-0 z-20 flex flex-col sm:flex-row justify-between items-center gap-6 flex-shrink-0 shadow-[0_-15px_30px_-15px_rgba(0,0,0,0.1)]">
                    <button onClick={onClose} className="px-8 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-[1.5rem] transition-all active:scale-95">
                        {t('cancel')}
                    </button>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button
                            onClick={() => onEmail(getEnrichedData())}
                            className="flex-1 sm:flex-none px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-[1.5rem] transition-all flex items-center justify-center gap-3 active:scale-95 min-h-[44px]"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            {t('email')}
                        </button>
                        
                        <div className="flex bg-slate-900 rounded-[1.5rem] p-1.5 shadow-2xl shadow-slate-200">
                            <button
                                type="button"
                                onClick={(e) => handleDownloadPDF(e, 'compact')}
                                disabled={isLoading || isExporting}
                                className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-all flex items-center justify-center gap-2 border-r border-white/5 disabled:opacity-50"
                            >
                                {t('pdfCompact')}
                            </button>
                            <button
                                type="button"
                                onClick={(e) => handleDownloadPDF(e, 'full')}
                                disabled={isLoading || isExporting}
                                className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 min-h-[44px]"
                            >
                                {isExporting ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                                {isExporting ? t('generating') : t('pdfFull')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
