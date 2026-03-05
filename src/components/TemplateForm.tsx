'use client';

import { useState, useEffect } from 'react';
import { getTemplates } from '@/app/actions/template.actions';
import { getDoctorProfile } from '@/app/actions/profile.actions';
import { getUserRole } from '@/app/actions/auth.actions';
import { saveRecord } from '@/app/actions/history.actions';
import { exportAnamneseToPDF } from '@/lib/exportPdf';
import AudioRecorder from './AudioRecorder';
import InsightsPreviewModal from './InsightsPreviewModal';
import { useTranslations, useLocale } from 'next-intl';

export default function TemplateForm({ templateId, onSaved }: { templateId: string, onSaved?: () => void }) {
    const t = useTranslations('TemplateForm');
    const locale = useLocale();
    const [template, setTemplate] = useState<any>(null);
    const [role, setRole] = useState('doctor');
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [patientName, setPatientName] = useState('');
    const [consultDate, setConsultDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [isSaving, setIsSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    // Translation Cache Stats
    const [translations, setTranslations] = useState<Record<string, string>>({});
    const [isTranslating, setIsTranslating] = useState(false);

    useEffect(() => {
        async function fetchTemplate() {
            setTranslations({});
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
            if (data.patient_name_extracted) setPatientName(data.patient_name_extracted);
            if (data.consult_date_extracted) {
                const d = new Date(data.consult_date_extracted);
                if (!isNaN(d.getTime())) setConsultDate(data.consult_date_extracted);
            }
            for (const key of Object.keys(data)) {
                if (key === 'patient_name_extracted' || key === 'consult_date_extracted') continue;
                if (Array.isArray(data[key])) {
                    merged[key] = data[key].join(', ');
                } else if (typeof data[key] === 'string') {
                    merged[key] = data[key];
                }
            }
            setFormData(merged);
        }
    };

    const handleExport = async (mode: 'compact' | 'full', enrichedData: Record<string, string>) => {
        setIsSaving(true);
        setShowPreview(false);
        try {
            const finalPatientName = patientName || enrichedData.nome || enrichedData.paciente || enrichedData.identificacao || "Paciente Sem Nome";
            const res = await saveRecord({
                patientName: finalPatientName,
                templateId,
                date: consultDate,
                data: enrichedData
            });

            if (res.success && res.data) {
                if (onSaved) onSaved();
                const profile = await getDoctorProfile();
                exportAnamneseToPDF(res.data, profile, mode, locale, translations);
            } else {
                console.error("Erro ao salvar", res.error);
                alert("Falha ao salvar o prontuário.");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEmail = (enrichedData: Record<string, string>) => {
        setShowPreview(false);
        const bodyText = Object.entries(enrichedData).map(([k, v]) => `${k.toUpperCase()}:\n${v}`).join('\n\n');
        window.location.href = `mailto:?subject=Relatório Clínico - ${template?.name}&body=${encodeURIComponent(bodyText)}`;
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
        <div className="flex flex-col h-full w-full relative bg-white">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">{template.name}</h2>
                    <p className="text-sm text-slate-500">{template.description}</p>
                </div>
            </div>

            {role === 'doctor' && (
                <div className="mb-6 bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <AudioRecorder templateId={templateId} onResult={handleAiResult} minimal={true} />
                </div>
            )}

            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                    <label className="text-sm font-bold text-slate-700 mb-1">{t('patientName')}</label>
                    <input
                        type="text"
                        value={patientName}
                        onChange={e => setPatientName(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="Ex: Carlos Augusto..."
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-bold text-slate-700 mb-1">{t('consultDate')}</label>
                    <input
                        type="date"
                        value={consultDate}
                        onChange={e => setConsultDate(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pb-12 pr-2">
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
                            <label className="text-sm font-bold text-slate-700 mb-1">
                                {translatedLabel} {isTranslating && <span className="text-[10px] text-slate-400 font-normal animate-pulse">(...)</span>}
                            </label>
                            {field.type === 'textarea' ? (
                                <textarea
                                    value={formData[field.id] || ''}
                                    onChange={e => handleChange(field.id, e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none h-24 resize-none"
                                    placeholder={`${t('describe')} ${translatedLabel}...`}
                                />
                            ) : field.type === 'radio' && field.options ? (
                                <div className="flex gap-4 flex-wrap mt-1">
                                    {field.options.map((opt: string, idx: number) => {
                                        const trOpt = getTranslatedOption(idx, opt);
                                        return (
                                            <label key={opt} className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-100 transition">
                                                <input type="radio" name={field.id} value={opt} checked={formData[field.id] === opt} onChange={e => handleChange(field.id, e.target.value)} className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300" />
                                                <span className="text-sm font-medium text-slate-700">{trOpt}</span>
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
                                            <label key={opt} className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-100 transition">
                                                <input type="checkbox" value={opt} checked={isChecked} onChange={e => {
                                                    if (e.target.checked) {
                                                        handleChange(field.id, [...currentValues, opt].filter(Boolean).join(', '));
                                                    } else {
                                                        handleChange(field.id, currentValues.filter(v => v !== opt).join(', '));
                                                    }
                                                }} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300" />
                                                <span className="text-sm font-medium text-slate-700">{trOpt}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            ) : field.type === 'date' ? (
                                <input
                                    type="date"
                                    value={formData[field.id] || ''}
                                    onChange={e => handleChange(field.id, e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            ) : (
                                <input
                                    type={field.type === 'number' ? 'number' : 'text'}
                                    value={formData[field.id] || ''}
                                    onChange={e => handleChange(field.id, e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                                    placeholder={`${t('inform')} ${translatedLabel}...`}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                    onClick={() => {
                        setFormData({});
                        setPatientName('');
                        setConsultDate(new Date().toISOString().split('T')[0]);
                    }}
                    className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition"
                >
                    {t('clear')}
                </button>
                <button
                    onClick={() => setShowPreview(true)}
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition shadow-sm flex items-center gap-2"
                >
                    {isSaving ? t('processing') : t('reviewExport')}
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </button>
            </div>

            <InsightsPreviewModal
                isOpen={showPreview}
                formData={formData}
                templateSchema={template.schema}
                templateId={templateId}
                patientName={patientName || "Paciente"}
                consultDate={consultDate}
                onExport={handleExport}
                onEmail={handleEmail}
                onClose={() => setShowPreview(false)}
            />
        </div>
    );
}
