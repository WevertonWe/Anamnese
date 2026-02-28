'use client';

import { useState, useEffect } from 'react';
import { getTemplates } from '@/app/actions/template.actions';
import { getDoctorProfile } from '@/app/actions/profile.actions';
import { getUserRole } from '@/app/actions/auth.actions';
import { saveRecord } from '@/app/actions/history.actions';
import { exportAnamneseToPDF } from '@/lib/exportPdf';
import AudioRecorder from './AudioRecorder';

export default function TemplateForm({ templateId, onSaved }: { templateId: string, onSaved?: () => void }) {
    const [template, setTemplate] = useState<any>(null);
    const [role, setRole] = useState('doctor');
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);

    useEffect(() => {
        async function fetchTemplate() {
            const templates = await getTemplates();
            const selected = templates.find((t: any) => String(t.id) === templateId);
            setTemplate(selected);
            setFormData({});
        }
        if (templateId) fetchTemplate();
    }, [templateId]);

    useEffect(() => {
        getUserRole().then(r => {
            if (r) setRole(r);
        });
    }, []);

    const handleChange = (id: string, value: string) => {
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleAiResult = (data: any) => {
        // AI returns data matching the schema keys
        if (data && typeof data === 'object') {
            const merged = { ...formData };
            for (const key of Object.keys(data)) {
                // If it's an array like cid_sugerido, join it
                if (Array.isArray(data[key])) {
                    merged[key] = data[key].join(', ');
                } else if (typeof data[key] === 'string') {
                    merged[key] = data[key];
                }
            }
            setFormData(merged);
        }
    };

    const handleSaveAndExport = async (mode: 'compact' | 'full') => {
        setIsSaving(true);
        try {
            const patientName = formData.nome || formData.paciente || formData.identificacao || "Paciente Sem Nome";
            const res = await saveRecord({
                patientName,
                templateId,
                data: formData
            });

            if (res.success && res.data) {
                if (onSaved) onSaved();
                const profile = await getDoctorProfile();
                exportAnamneseToPDF(res.data, profile, mode);
            } else {
                console.error("Erro ao salvar", res.error);
                alert("Falha ao salvar o prontuário.");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
            setShowExportMenu(false);
        }
    };

    const handleEmail = () => {
        const bodyText = Object.entries(formData).map(([k, v]) => `${k.toUpperCase()}:\n${v}`).join('\n\n');
        window.location.href = `mailto:?subject=Relatório Clínico - ${template?.name}&body=${encodeURIComponent(bodyText)}`;
    };

    if (!template) {
        return (
            <div className="w-full h-full flex items-center justify-center p-8 text-slate-400">
                Selecione um template ao lado para iniciar
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

            <div className="flex-1 overflow-y-auto space-y-4 pb-12 pr-2">
                {fields.map((field: any) => (
                    <div key={field.id} className="flex flex-col">
                        <label className="text-sm font-bold text-slate-700 mb-1">{field.label || field.id}</label>
                        {field.type === 'textarea' ? (
                            <textarea
                                value={formData[field.id] || ''}
                                onChange={e => handleChange(field.id, e.target.value)}
                                className="w-full border border-slate-300 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none h-24 resize-none"
                                placeholder={`Descreva ${field.label || field.id}...`}
                            />
                        ) : (
                            <input
                                type={field.type === 'number' ? 'number' : 'text'}
                                value={formData[field.id] || ''}
                                onChange={e => handleChange(field.id, e.target.value)}
                                className="w-full border border-slate-300 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                                placeholder={`Informe ${field.label || field.id}...`}
                            />
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                    onClick={() => setFormData({})}
                    className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition"
                >
                    Limpar
                </button>
                <div className="relative">
                    <button
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        disabled={isSaving}
                        className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition shadow-sm flex items-center gap-2"
                    >
                        {isSaving ? 'Processando...' : 'Salvar / Exportar'}
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>

                    {showExportMenu && (
                        <div className="absolute right-0 bottom-full mb-2 w-48 bg-white border border-slate-100 shadow-xl rounded-xl overflow-hidden z-20 animate-in fade-in slide-in-from-bottom-2">
                            <button onClick={() => handleSaveAndExport('compact')} className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                Exportar PDF Resumo
                            </button>
                            <button onClick={() => handleSaveAndExport('full')} className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                Exportar PDF Completo
                            </button>
                            <button onClick={handleEmail} className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                Enviar por E-mail
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
