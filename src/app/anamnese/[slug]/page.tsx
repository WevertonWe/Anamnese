'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { getRemoteFormDetails, submitRemoteForm } from '@/app/actions/history.actions';
import UnifiedModal from '@/components/ui/unified-modal';

export default function AnamneseRemotePage() {
    const params = useParams();
    const slug = params?.slug as string;
    
    const [loading, setLoading] = useState(true);
    const [record, setRecord] = useState<any>(null);
    const [invalid, setInvalid] = useState(false);
    
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modal state
    const [modal, setModal] = useState<{ isOpen: boolean; title: string; message: string; variant: 'success' | 'danger' | 'info' }>({
        isOpen: false, title: '', message: '', variant: 'info'
    });
    
    useEffect(() => {
        if (slug) {
            getRemoteFormDetails(slug).then(data => {
                if (!data) {
                    setInvalid(true);
                } else {
                    setRecord(data);
                }
                setLoading(false);
            });
        }
    }, [slug]);

    const handleChange = (id: string, value: string) => {
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    // Parse fields once
    let fields: any[] = [];
    if (record) {
        try {
            const schemaObj = typeof record.template?.schema === 'string' ? JSON.parse(record.template.schema) : record.template?.schema;
            fields = schemaObj?.fields || [];
        } catch(e) { /* silent */ }
    }

    // Validation: check all text/textarea fields are filled
    const isFormValid = useMemo(() => {
        if (fields.length === 0) return false;
        return fields.every((field: any) => {
            const value = formData[field.id];
            if (field.type === 'checkbox') return true; // Optional
            return value && value.trim().length > 0;
        });
    }, [formData, fields]);

    const handleSubmit = async () => {
        if (!isFormValid) return;
        setIsSubmitting(true);
        try {
            const res = await submitRemoteForm(slug, formData);
            setIsSubmitting(false);
            if (res.success) {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#34d399', '#10b981', '#059669']
                });
                setRecord((prev: any) => ({ ...prev, isActive: false }));
            } else {
                setModal({ isOpen: true, title: 'Erro no Envio', message: res.error || 'Erro ao enviar. Tente novamente.', variant: 'danger' });
            }
        } catch {
            setIsSubmitting(false);
            setModal({ isOpen: true, title: 'Erro', message: 'Falha de comunicação. Tente novamente.', variant: 'danger' });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center text-slate-400">
                <svg className="animate-spin h-8 w-8 text-emerald-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            </div>
        );
    }

    if (invalid) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-sm border border-red-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Link Inválido</h2>
                <p className="text-slate-500 max-w-sm">Este questionário não existe ou a URL está incorreta.</p>
            </div>
        );
    }

    if (!record.isActive) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Informações Enviadas!</h2>
                <p className="text-slate-500 max-w-sm">Este formulário já foi enviado com sucesso. Obrigado!</p>
            </div>
        );
    }

    const translations = record.template?.translations ? JSON.parse(record.template.translations) : {};

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-8 font-[family-name:var(--font-geist-sans)]">
            <main className="w-full max-w-2xl mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
                <header className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500"></div>
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">Pré-Consulta</p>
                    <h1 className="text-2xl font-black text-slate-900 mb-1">{record.doctor?.name ? `Dr(a). ${record.doctor.name}` : 'Sua Consulta'}</h1>
                    <p className="text-slate-500 text-sm">Olá, <strong>{record.patientName}</strong>. Por favor, preencha o formulário abaixo com atenção para antecipar informações vitais ao seu médico.</p>
                </header>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
                    {fields.length === 0 ? (
                        <div className="text-center text-slate-500 py-10 font-medium animate-pulse">
                            Carregando formulário...
                        </div>
                    ) : fields.map((field: any) => {
                        const translatedLabel = translations[field.id] || field.label || field.id;
                        const hasValue = !!(formData[field.id] && formData[field.id].trim());
                        
                        return (
                            <div key={field.id} className="flex flex-col">
                                <label className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-1">
                                    {translatedLabel}
                                    {field.type !== 'checkbox' && <span className="text-red-400">*</span>}
                                </label>
                                
                                {field.type === 'textarea' ? (
                                    <textarea
                                        required
                                        value={formData[field.id] || ''}
                                        onChange={e => handleChange(field.id, e.target.value)}
                                        className={`w-full border rounded-xl p-3 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none h-24 resize-none transition ${hasValue ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-300'}`}
                                        placeholder="Digite aqui..."
                                    />
                                ) : field.type === 'radio' ? (
                                    <div className="flex flex-col gap-2">
                                        {(field.options || []).map((opt: string, i: number) => {
                                            const optLabel = translations[`${field.id}_options`] ? translations[`${field.id}_options`].split(',')[i] : opt;
                                            return (
                                                <label key={i} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                                                    <input
                                                        type="radio"
                                                        name={field.id}
                                                        value={opt}
                                                        required
                                                        checked={formData[field.id] === opt}
                                                        onChange={e => handleChange(field.id, e.target.value)}
                                                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                                                    />
                                                    <span className="text-sm text-slate-700 font-medium">{optLabel?.trim() || opt}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                ) : field.type === 'checkbox' ? (
                                    <div className="flex flex-col gap-2">
                                        {(field.options || []).map((opt: string, i: number) => {
                                            const optLabel = translations[`${field.id}_options`] ? translations[`${field.id}_options`].split(',')[i] : opt;
                                            const isChecked = (formData[field.id] || '').includes(opt);
                                            return (
                                                <label key={i} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                                                    <input
                                                        type="checkbox"
                                                        value={opt}
                                                        checked={isChecked}
                                                        onChange={e => {
                                                            const current = (formData[field.id] || '').split(',').filter(Boolean);
                                                            if (e.target.checked) current.push(opt);
                                                            else {
                                                                const idx = current.indexOf(opt);
                                                                if (idx > -1) current.splice(idx, 1);
                                                            }
                                                            handleChange(field.id, current.join(','));
                                                        }}
                                                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                                                    />
                                                    <span className="text-sm text-slate-700 font-medium">{optLabel?.trim() || opt}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <input
                                        type={field.type === 'date' ? 'date' : 'text'}
                                        required
                                        value={formData[field.id] || ''}
                                        onChange={e => handleChange(field.id, e.target.value)}
                                        className={`w-full border rounded-xl p-3 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition ${hasValue ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-300'}`}
                                        placeholder="Digite aqui..."
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Submit — static container, not fixed */}
                <div className="bg-white/90 backdrop-blur-md p-4 border border-slate-200 rounded-2xl shadow-lg flex justify-center sticky bottom-4 z-10">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !isFormValid}
                        className="w-full max-w-2xl py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition transform hover:-translate-y-0.5 disabled:bg-slate-300 disabled:shadow-none disabled:transform-none flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Enviando...
                            </>
                        ) : (
                            <>
                                {isFormValid ? 'Emitir Anamnese' : 'Preencha todos os campos'}
                                {isFormValid && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>}
                            </>
                        )}
                    </button>
                </div>
            </main>

            <UnifiedModal
                isOpen={modal.isOpen}
                title={modal.title}
                message={modal.message}
                variant={modal.variant}
                onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}
