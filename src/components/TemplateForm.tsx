'use client';

import { useState, useEffect } from 'react';
import { getUserRole } from '@/app/actions/auth.actions';
import { saveRecord } from '@/app/actions/history.actions';
import { exportAnamneseToPDF } from '@/lib/exportPdf';
import AudioRecorder from './AudioRecorder';
import InsightsPreviewModal from './InsightsPreviewModal';
import Modal from '@/components/ui/Modal';
import UnifiedModal, { useUnifiedModal } from '@/components/ui/unified-modal';
import { generateRemoteLink } from '@/app/actions/history.actions';
import { useTranslations, useLocale } from 'next-intl';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Funções utílitarias para o IMC
const parsePeso = (str: string) => {
    if (!str) return null;
    const match = str.replace(',', '.').match(/[\d.]+/);
    return match ? parseFloat(match[0]) : null;
};
const parseAltura = (str: string) => {
    if (!str) return null;
    let match = str.replace(',', '.').match(/[\d.]+/);
    if (!match) return null;
    let val = parseFloat(match[0]);
    if (val > 3) val = val / 100; // cm to m
    return val;
};
const calcularIMC = (peso: number | null, altura: number | null) => {
    if (!peso || !altura) return null;
    return (peso / (altura * altura)).toFixed(1);
};

export default function TemplateForm({ templateId, incomingAiData, editId, onSaved, onReviewRequest }: { templateId: string, incomingAiData?: any, editId?: string, onSaved?: () => void, onReviewRequest?: (data: any) => void }) {
    const t = useTranslations('TemplateForm');
    const locale = useLocale();
    const [template, setTemplate] = useState<any>(null);
    const [role, setRole] = useState('DOCTOR');
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [patientName, setPatientName] = useState('');
    const [consultDate, setConsultDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [isSaving, setIsSaving] = useState(false);

    // Patient History States
    const [patientHistory, setPatientHistory] = useState<any>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [lastSearchedName, setLastSearchedName] = useState('');

    // Remote Link States
    const [isGeneratingLink, setIsGeneratingLink] = useState(false);
    const [generatedLink, setGeneratedLink] = useState('');
    const [isRemoteModalOpen, setIsRemoteModalOpen] = useState(false);

    // Unified Modal
    const { modalState, showModal, hideModal } = useUnifiedModal();

    // Translation Cache Stats
    const [translations, setTranslations] = useState<Record<string, string>>({});
    const [isTranslating, setIsTranslating] = useState(false);

    useEffect(() => {
        async function fetchTemplate() {
            setTranslations({});
            const { getTemplates } = await import('@/app/actions/template.actions');
            const templates = await getTemplates();
            const selected = templates.find((t: any) => String(t.id) === templateId);
            setTemplate(selected);
            setFormData({});
            setPatientName('');
            setConsultDate(new Date().toISOString().split('T')[0]);

            if (selected && locale !== 'pt') {
                setIsTranslating(true);
                const { translateTemplateSchema } = await import('@/app/actions/translate.actions');
                const res = await translateTemplateSchema(templateId, locale);
                if (res.success && res.translations) {
                    setTranslations(res.translations);
                }
                setIsTranslating(false);
            }
        }
        if (templateId) fetchTemplate();
    }, [templateId, locale]);

    useEffect(() => {
        if (incomingAiData) {
            handleAiResult(incomingAiData);
        }
    }, [incomingAiData]);

    useEffect(() => {
        getUserRole().then(r => {
            if (r) setRole(r);
        });
    }, []);

    const handleChange = (id: string, value: string) => {
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleAiResult = (data: any) => {
        if (data && typeof data === 'object') {
            const merged = { ...formData };
            if (data.patient_name_extracted && !patientName) setPatientName(data.patient_name_extracted);
            
            if (data.consult_date_extracted) {
                const currentDateStr = new Date().toISOString().split('T')[0];
                if (consultDate === currentDateStr || !consultDate) {
                    const d = new Date(data.consult_date_extracted);
                    if (!isNaN(d.getTime())) setConsultDate(data.consult_date_extracted);
                }
            }
            
            for (const key of Object.keys(data)) {
                if (key === 'patient_name_extracted' || key === 'consult_date_extracted') continue;
                
                const incomingValue = Array.isArray(data[key]) ? data[key].filter(Boolean).join(', ') : (typeof data[key] === 'string' ? data[key].trim() : '');
                
                if (incomingValue) {
                    if (merged[key]) {
                        if (!merged[key].includes(incomingValue)) {
                            // Merge manual e IA
                            merged[key] = merged[key] + '\n' + incomingValue;
                        }
                    } else {
                        merged[key] = incomingValue;
                    }
                }
            }
            setFormData(merged);
        }
    };

    const handleOpenReview = () => {
        if (onReviewRequest) {
            onReviewRequest({
                formData,
                templateSchema: template?.schema || {},
                patientName,
                consultDate
            });
        }
    };

    const handleEmail = (enrichedData: Record<string, string>) => {
        const bodyText = Object.entries(enrichedData).map(([k, v]) => `${k.toUpperCase()}:\n${v}`).join('\n\n');
        window.location.href = `mailto:?subject=Relatório Clínico - ${template?.name}&body=${encodeURIComponent(bodyText)}`;
    };

    const handleGenerateLink = async () => {
        if (!patientName) {
            showModal({ title: 'Campo Obrigatório', message: 'Preencha o Nome do Paciente antes de gerar o link remoto.', variant: 'info' });
            return;
        }
        setIsGeneratingLink(true);
        try {
            const res = await generateRemoteLink(patientName, templateId);
            if (res.success && res.link) {
                // Shortlink mount & HTTPS enforcement on Prod
                const origin = window.location.origin.includes('localhost')
                    ? window.location.origin
                    : window.location.origin.replace('http:', 'https:');

                const shortUrl = `${origin}/a/${res.link.split('/').pop()}`;
                setGeneratedLink(shortUrl);
            } else {
                showModal({ title: 'Erro', message: res.error || 'Erro na geração do formulário. Tente novamente mais tarde.', variant: 'danger' });
            }
        } catch (err) {
            console.error("Remote Link Gen Error:", err);
            showModal({ title: 'Erro', message: 'Sistema ocupado ou erro inesperado. Por favor, tente novamente.', variant: 'danger' });
        } finally {
            setIsGeneratingLink(false);
        }
    };

    const handleCopyLink = () => {
        const text = `Olá, ${patientName}! Boas-vindas à consulta.\n\nPor favor, preencha sua pré-anamnese pelo link abaixo:\n🔗 ${generatedLink}\n\nObrigado!`;
        navigator.clipboard.writeText(text);
        showModal({ title: 'Copiado!', message: 'Mensagem copiada para a área de transferência!', variant: 'success' });
        setIsRemoteModalOpen(false);
        setGeneratedLink('');
    };

    const fetchPatientHistory = async (name: string) => {
        if (!name || name.length < 3 || name === lastSearchedName) return;
        
        setIsLoadingHistory(true);
        setLastSearchedName(name);
        try {
            const { getRecentPatientHistory } = await import('@/app/actions/history.actions');
            const history = await getRecentPatientHistory(name);
            setPatientHistory(history);
        } catch (err) {
            console.error("Erro ao buscar histórico:", err);
            setPatientHistory(null);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handlePatientNameBlur = () => {
        fetchPatientHistory(patientName);
    };

    // Auto-search history when name is long enough and typing stops for 1s
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (patientName && patientName.length >= 3) {
                fetchPatientHistory(patientName);
            }
        }, 1000);
        return () => clearTimeout(timeoutId);
    }, [patientName]);

    const importLastData = async () => {
        if (!patientName) return;
        try {
            const { getHistory } = await import('@/app/actions/history.actions');
            const allRecords = await getHistory();
            const lastRecord = allRecords.find((r: any) => r.patientName.toLowerCase() === patientName.toLowerCase());
            
            if (lastRecord && lastRecord.data) {
                const dataToImport = typeof lastRecord.data === 'string' ? JSON.parse(lastRecord.data) : lastRecord.data;
                const merged = { ...formData };
                
                // Campos fixos que geralmente passam de uma consulta pra outra
                const importableKeys = ['alergias', 'medicamentos_em_uso', 'comorbidades', 'hpp', 'habitos'];
                
                let importedCount = 0;
                importableKeys.forEach(k => {
                    const foundKey = Object.keys(dataToImport).find(key => key.toLowerCase().includes(k) || k.includes(key.toLowerCase()));
                    if (foundKey && dataToImport[foundKey]) {
                        merged[foundKey] = dataToImport[foundKey];
                        importedCount++;
                    }
                });

                if (importedCount > 0) {
                    setFormData(merged);
                    showModal({ title: 'Sucesso', message: `${importedCount} campos (Alergias, HPP, Meds) importados da última consulta!`, variant: 'success' });
                } else {
                    showModal({ title: 'Aviso', message: 'Nenhum campo crônico (Alergias, HPP, etc) encontrado na última consulta.', variant: 'info' });
                }
            }
        } catch(e) {
            console.error("Erro ao importar base:", e);
        }
    };

    if (!template) {
        return (
            <div className="w-full h-full flex items-center justify-center p-8 text-slate-400">
                {t('selectTemplate')}
            </div>
        );
    }

    const fields = template.schema?.fields || [];

    return (
        <div className="flex flex-col h-full w-full relative">
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{template.name}</h2>
                    <p className="text-sm text-slate-500 font-medium">{template.description}</p>
                </div>
            </div>

            <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col relative">
                    <div className="flex justify-between items-end mb-2 px-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('patientName')}</label>
                        {patientHistory && (
                            <button onClick={importLastData} className="text-[9px] text-emerald-600 bg-emerald-50 hover:bg-emerald-100 font-black uppercase tracking-widest border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1 transition-colors active:scale-95">
                                ⚡ Puxar Dados Base
                            </button>
                        )}
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            value={patientName}
                            onChange={e => setPatientName(e.target.value)}
                            onBlur={handlePatientNameBlur}
                            className={`w-full border ${patientHistory ? 'border-emerald-300 ring-2 ring-emerald-50' : 'border-slate-200'} rounded-2xl p-4 text-slate-900 bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-300 font-medium`}
                            placeholder="Ex: Carlos Augusto..."
                        />
                        {isLoadingHistory && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-slate-200 border-t-primary rounded-full animate-spin"></div>
                        )}
                        {patientHistory && !isLoadingHistory && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" title="Paciente Recorrente Encontrado!"></div>
                        )}
                    </div>
                </div>
                <div className="flex flex-col">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{t('consultDate')}</label>
                    <input
                        type="date"
                        value={consultDate}
                        onChange={e => setConsultDate(e.target.value)}
                        className="w-full border border-slate-200 rounded-2xl p-4 text-slate-900 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
                    />
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Lateral Esquerda (Timeline), visível só se houver histórico */}
                {patientHistory && (
                    <div className="hidden lg:flex flex-col w-64 pr-6 mr-6 border-r border-slate-100 overflow-y-auto custom-scrollbar">
                        <div className="sticky top-0 bg-white pt-2 pb-4 z-10">
                            <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Histórico Recorrente
                            </h4>
                        </div>
                        <div className="relative border-l-2 border-emerald-100 ml-2 mt-2 space-y-6 pb-6">
                            {patientHistory.split('---').map((entry: string, idx: number) => {
                                const lines = entry.trim().split('\n');
                                const titleLine = lines[0] || '';
                                const matchDate = titleLine.match(/Consulta em (.*?)\s*\(/);
                                const date = matchDate ? matchDate[1] : 'Data N/A';
                                
                                const contentLines = lines.slice(1).join('\n');
                                const queixa = contentLines.match(/Queixa Relatada: (.*)/)?.[1] || '';
                                const hd = contentLines.match(/Hipótese.*?: (.*)/)?.[1] || '';

                                if (!titleLine) return null;

                                return (
                                    <div key={idx} className="relative pl-6">
                                        <div className="absolute -left-[5px] top-1 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white shadow-sm ring-2 ring-emerald-100"></div>
                                        <p className="text-[10px] font-black text-slate-400 mb-1">{date}</p>
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-sm">
                                            {hd && <p className="text-xs font-bold text-slate-700 line-clamp-2 leading-tight mb-1">{hd}</p>}
                                            {queixa ? <p className="text-xs text-slate-500 italic line-clamp-2 leading-tight">"{queixa}"</p> : <p className="text-xs text-slate-400">Sem queixa registrada</p>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        {/* Gráfico de Evolução (Peso / IMC) */}
                        {(() => {
                            const entries = patientHistory.split('---').map((e: string) => e.trim()).filter(Boolean);
                            const chartData = entries.map((entry: string) => {
                                const lines = entry.split('\n');
                                const titleLine = lines[0] || '';
                                const matchDate = titleLine.match(/Consulta em (.*?)\s*\(/);
                                const date = matchDate ? matchDate[1] : '';
                                
                                const pRow = lines.find((l: string) => l.startsWith('Peso:'));
                                const aRow = lines.find((l: string) => l.startsWith('Altura:'));
                                const pesoStr = pRow ? pRow.replace('Peso:', '').trim() : '';
                                const alturaStr = aRow ? aRow.replace('Altura:', '').trim() : '';
                                
                                const pesoNum = parsePeso(pesoStr);
                                const alturaNum = parseAltura(alturaStr);
                                const imcNum = calcularIMC(pesoNum, alturaNum);

                                return {
                                    date,
                                    peso: pesoNum,
                                    imc: imcNum
                                };
                            }).filter((d: any) => d.peso !== null).reverse(); // Oldest to newest

                            if (chartData.length < 2) return null;

                            return (
                                <div className="mt-8 ml-2 pr-4">
                                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Evolução Ponderal</h4>
                                    <div className="h-24 w-full bg-slate-50 border border-slate-100 rounded-xl p-2 pb-0 pt-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={chartData}>
                                                <defs>
                                                    <linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="date" hide />
                                                <Tooltip 
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            const data = payload[0].payload;
                                                            return (
                                                                <div className="bg-slate-900 text-white text-[10px] p-2 rounded-lg font-bold shadow-xl border border-white/20">
                                                                    <p className="text-slate-400 mb-1">{data.date}</p>
                                                                    <p>Peso: {data.peso} kg</p>
                                                                    {data.imc && <p className="text-emerald-400 mt-0.5">IMC: {data.imc}</p>}
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                                <Area type="monotone" dataKey="peso" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorPeso)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            );
                        })()}

                    </div>
                )}

                {/* Container Principal do Formulário */}
                <div className="flex-1 overflow-y-auto space-y-6 pb-12 pr-2 scrollbar-thin scrollbar-thumb-slate-200 relative">
                {fields.map((field: any) => {
                    const translatedLabel = translations[field.id] || field.label || field.id;
                    const getTranslatedOption = (optIndex: number, defaultOpt: string) => {
                        if (translations[`${field.id}-options`]) {
                            const parts = translations[`${field.id}-options`].split(',');
                            if (parts[optIndex]) return parts[optIndex].trim();
                        }
                        if (translations[`${field.id}_options`]) {
                            const parts = translations[`${field.id}_options`].split(',');
                            if (parts[optIndex]) return parts[optIndex].trim();
                        }
                        return translations[defaultOpt] || defaultOpt;
                    };

                    return (
                        <div key={field.id} className="flex flex-col">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                                {translatedLabel} {isTranslating && <span className="text-[8px] text-primary/50 font-black animate-pulse ml-2">(TRADUZINDO)</span>}
                            </label>
                            {field.type === 'textarea' ? (
                                <textarea
                                    value={formData[field.id] || ''}
                                    onChange={e => handleChange(field.id, e.target.value)}
                                    className="w-full border border-slate-200 rounded-2xl p-4 text-slate-900 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all h-32 resize-none font-medium placeholder:text-slate-300"
                                    placeholder={`${t('describe')} ${translatedLabel.toLowerCase()}...`}
                                />
                            ) : field.type === 'radio' && field.options ? (
                                <div className="flex gap-3 flex-wrap mt-1">
                                    {field.options.map((opt: string, idx: number) => {
                                        const trOpt = getTranslatedOption(idx, opt);
                                        const isChecked = formData[field.id] === opt;
                                        return (
                                            <label key={opt} className={`flex items-center gap-2 cursor-pointer px-4 py-3 rounded-2xl border transition-all ${isChecked ? 'bg-primary/10 border-primary text-primary shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                                                <input type="radio" name={field.id} value={opt} checked={isChecked} onChange={e => handleChange(field.id, e.target.value)} className="hidden" />
                                                <span className="text-xs font-black uppercase tracking-wider">{trOpt}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            ) : field.type === 'checkbox' && field.options ? (
                                <div className="flex gap-3 flex-wrap mt-1">
                                    {field.options.map((opt: string, idx: number) => {
                                        const trOpt = getTranslatedOption(idx, opt);
                                        const currentValues = formData[field.id] ? formData[field.id].split(',').map(s => s.trim()) : [];
                                        const isChecked = currentValues.includes(opt);
                                        return (
                                            <label key={opt} className={`flex items-center gap-2 cursor-pointer px-4 py-3 rounded-2xl border transition-all ${isChecked ? 'bg-primary/10 border-primary text-primary shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                                                <input type="checkbox" value={opt} checked={isChecked} onChange={e => {
                                                    if (e.target.checked) {
                                                        handleChange(field.id, [...currentValues, opt].filter(Boolean).join(', '));
                                                    } else {
                                                        handleChange(field.id, currentValues.filter(v => v !== opt).join(', '));
                                                    }
                                                }} className="hidden" />
                                                <span className="text-xs font-black uppercase tracking-wider">{trOpt}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            ) : field.type === 'date' ? (
                                <input
                                    type="date"
                                    value={formData[field.id] || ''}
                                    onChange={e => handleChange(field.id, e.target.value)}
                                    className="w-full border border-slate-200 rounded-2xl p-4 text-slate-900 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
                                />
                            ) : (
                                <input
                                    type={field.type === 'number' ? 'number' : 'text'}
                                    value={formData[field.id] || ''}
                                    onChange={e => handleChange(field.id, e.target.value)}
                                    className="w-full border border-slate-200 rounded-2xl p-4 text-slate-900 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium placeholder:text-slate-300"
                                    placeholder={`${t('inform')} ${translatedLabel.toLowerCase()}...`}
                                />
                            )}
                        </div>
                    );
                })}
                </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-100 flex-wrap">
                <button
                    onClick={() => {
                        setFormData({});
                        setPatientName('');
                        setConsultDate(new Date().toISOString().split('T')[0]);
                    }}
                    className="px-6 py-3 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                >
                    {t('clear')}
                </button>
                <button
                    onClick={() => setIsRemoteModalOpen(true)}
                    className="px-6 py-3 text-primary bg-primary/10 border border-primary/20 font-black uppercase tracking-widest text-[10px] hover:bg-primary hover:text-white rounded-2xl transition-all shadow-sm active:scale-95"
                >
                    Gerar Link Remoto
                </button>
                <button
                    onClick={handleOpenReview}
                    disabled={isSaving}
                    className="px-8 py-4 bg-slate-900 text-white font-black uppercase tracking-widest text-[11px] rounded-2xl hover:bg-slate-800 transition-all shadow-xl flex items-center gap-3 active:scale-95 disabled:bg-slate-200"
                >
                    {isSaving ? t('processing') : editId ? 'Atualizar Template' : t('reviewExport')}
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </button>
            </div>

            <Modal
                isOpen={isRemoteModalOpen}
                title="Link Remoto Seguro"
                message="Aumente a agilidade do atendimento permitindo que o paciente preencha dados previamente."
                type="info"
                onClose={() => setIsRemoteModalOpen(false)}
            >
                <div className="space-y-6 py-2">
                    {!generatedLink ? (
                        <>
                            <div className="flex flex-col text-left">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Nome do Paciente</label>
                                <input
                                    type="text"
                                    value={patientName}
                                    onChange={e => setPatientName(e.target.value)}
                                    className="w-full border border-slate-200 rounded-2xl p-4 text-slate-900 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-300 font-medium"
                                    placeholder="Ex: Maria Antonieta..."
                                />
                            </div>
                            <button
                                onClick={handleGenerateLink}
                                disabled={isGeneratingLink || !patientName}
                                className="w-full bg-primary hover:bg-emerald-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 disabled:bg-slate-200 shadow-lg shadow-primary/20 transition-all active:scale-95"
                            >
                                {isGeneratingLink ? (
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                        Gerar Link Único
                                    </>
                                )}
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col gap-4 text-left">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                <p className="text-[10px] text-slate-400 font-black mb-2 uppercase tracking-widest">Link Ativo</p>
                                <a href={generatedLink} target="_blank" rel="noreferrer" className="text-primary font-bold break-all text-sm hover:underline">
                                    {generatedLink}
                                </a>
                            </div>
                            <button
                                onClick={handleCopyLink}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                Copiar Mensagem
                            </button>
                        </div>
                    )}
                </div>
            </Modal>

            <UnifiedModal
                isOpen={modalState.isOpen}
                title={modalState.title}
                message={modalState.message}
                variant={modalState.variant}
                onClose={hideModal}
            />
        </div>
    );
}
