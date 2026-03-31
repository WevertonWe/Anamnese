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

export default function TemplateForm({ templateId, incomingAiData, editId, onSaved, onReviewRequest }: { templateId: string, incomingAiData?: any, editId?: string, onSaved?: () => void, onReviewRequest?: (data: any) => void }) {
    const t = useTranslations('TemplateForm');
    const locale = useLocale();
    const [template, setTemplate] = useState<any>(null);
    const [role, setRole] = useState('DOCTOR');
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [patientName, setPatientName] = useState('');
    const [consultDate, setConsultDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [isSaving, setIsSaving] = useState(false);

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
                <div className="flex flex-col">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{t('patientName')}</label>
                    <input
                        type="text"
                        value={patientName}
                        onChange={e => setPatientName(e.target.value)}
                        className="w-full border border-slate-200 rounded-2xl p-4 text-slate-900 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-300 font-medium"
                        placeholder="Ex: Carlos Augusto..."
                    />
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

            <div className="flex-1 overflow-y-auto space-y-6 pb-12 pr-2 scrollbar-thin scrollbar-thumb-slate-200">
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
