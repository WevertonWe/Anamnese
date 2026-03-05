'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createTemplate } from '@/app/actions/template.actions';
import { generateTemplateStructure } from '@/app/actions/aiTemplate.actions';
import Modal from '@/components/ui/Modal';
import AudioRecorder from '@/components/AudioRecorder';
import { useTranslations } from 'next-intl';

export default function TemplateEditor() {
    const t = useTranslations('TemplatePage');
    const [templateName, setTemplateName] = useState('');
    const [description, setDescription] = useState('');
    const [fields, setFields] = useState([{ id: 'qd', label: 'Queixa Principal', type: 'textarea' }]);

    const addField = () => {
        setFields([...fields, { id: `field_${Date.now()}`, label: '', type: 'text' }]);
    };

    const updateField = (index: number, key: string, value: string) => {
        const newFields = [...fields];
        newFields[index] = { ...newFields[index], [key]: value };
        setFields(newFields);
    };

    const removeField = (index: number) => {
        setFields(fields.filter((_, i) => i !== index));
    };

    const [translations, setTranslations] = useState<any>(null);

    const [isSaving, setIsSaving] = useState(false);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [specialtyInput, setSpecialtyInput] = useState('');
    const [modalConfig, setModalConfig] = useState<{ isOpen: boolean, title: string, message: string, type: 'success' | 'error' | 'info' }>({
        isOpen: false, title: '', message: '', type: 'info'
    });

    const handleGenerateAI = async (text: string) => {
        if (!text) return;
        setIsGeneratingAI(true);
        const result = await generateTemplateStructure({ specialty: text });
        setIsGeneratingAI(false);

        if (result.success && result.data) {
            setTemplateName(result.data.templateName || '');
            setDescription(result.data.description || '');
            setFields(result.data.fields || []);
            setTranslations(result.data.translations || null);
        } else {
            setModalConfig({ isOpen: true, title: 'Erro na IA', message: result.error || 'Falha na geração', type: 'error' });
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        const result = await createTemplate({
            name: templateName,
            description,
            fields,
            translations
        });

        if (result.success) {
            setModalConfig({ isOpen: true, title: 'Sucesso', message: 'Template Salvo com Sucesso no banco local!', type: 'success' });
            setTemplateName('');
            setDescription('');
        } else {
            setModalConfig({ isOpen: true, title: 'Erro de Salvamento', message: result.error || 'Erro', type: 'error' });
        }
        setIsSaving(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-8 font-[family-name:var(--font-geist-sans)]">
            <main className="w-full max-w-2xl mx-auto flex flex-col gap-6">
                <header className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('title')}</h1>
                        <p className="text-slate-500 text-sm">{t('subtitle')}</p>
                    </div>
                    <Link href="/" className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100">
                        {t('back')}
                    </Link>
                </header>

                {/* AI Template Generator */}
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <svg className="w-24 h-24 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <div className="relative z-10 flex flex-col gap-3">
                        <div>
                            <h2 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                                {t('aiTitle')}
                            </h2>
                            <p className="text-sm text-emerald-700">{t('aiSubtitle')}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 mt-2">
                            <input
                                type="text"
                                placeholder={t('templateNamePlaceholder')}
                                value={specialtyInput}
                                onChange={e => setSpecialtyInput(e.target.value)}
                                className="flex-1 px-4 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
                            />
                            <div className="w-full sm:w-auto h-10 flex items-center bg-white rounded-lg px-2 border border-emerald-200">
                                <AudioRecorder
                                    templateId="system"
                                    minimal={true}
                                    onResult={(data: any) => handleGenerateAI(data.texto_bruto || 'Clínico Geral')}
                                />
                            </div>
                            <button
                                onClick={() => handleGenerateAI(specialtyInput)}
                                disabled={isGeneratingAI || !specialtyInput}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-bold transition shadow-sm disabled:bg-emerald-300 flex items-center justify-center gap-2"
                            >
                                {isGeneratingAI ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        {t('generating')}
                                    </>
                                ) : t('generate')}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">{t('templateName')}</label>
                        <input
                            type="text"
                            className="w-full border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder={t('templateNamePlaceholder')}
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">{t('description')}</label>
                        <input
                            type="text"
                            className="w-full border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                            placeholder={t('descriptionPlaceholder')}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-slate-800">{t('fieldsTitle')}</h2>
                        <button onClick={addField} className="text-sm bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-200">{t('addField')}</button>
                    </div>

                    <div className="space-y-4">
                        {fields.map((field: any, index: number) => (
                            <div key={index} className="flex flex-col p-4 border border-dashed border-slate-200 rounded-lg bg-slate-50 relative group">
                                <button onClick={() => removeField(index)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 p-1 opacity-50 hover:opacity-100 bg-white rounded-md shadow-sm border border-slate-100">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>

                                <div className="flex flex-col sm:flex-row gap-3 items-end w-full pr-8">
                                    <div className="flex-[0.8] w-full">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('fieldId')}</label>
                                        <input
                                            type="text"
                                            value={field.id}
                                            onChange={(e) => updateField(index, 'id', e.target.value)}
                                            className="w-full border border-slate-300 rounded p-1.5 text-slate-800 text-sm font-mono"
                                        />
                                    </div>
                                    <div className="flex-[1.2] w-full">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('fieldLabel')}</label>
                                        <input
                                            type="text"
                                            value={field.label}
                                            onChange={(e) => updateField(index, 'label', e.target.value)}
                                            className="w-full border border-slate-300 rounded p-1.5 text-slate-800 text-sm"
                                            placeholder={t('fieldLabelPlaceholder')}
                                        />
                                    </div>
                                    <div className="flex-[0.8] w-full">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo</label>
                                        <select
                                            value={field.type}
                                            onChange={(e) => updateField(index, 'type', e.target.value)}
                                            className="w-full border border-slate-300 rounded p-1.5 text-slate-800 text-sm bg-white"
                                        >
                                            <option value="text">Texto Curto</option>
                                            <option value="textarea">Área de Texto</option>
                                            <option value="radio">Seleção Única (Radio)</option>
                                            <option value="checkbox">Multi-Seleção (Check)</option>
                                            <option value="date">Data</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Opções Extra se Radio ou Checkbox */}
                                {(field.type === 'radio' || field.type === 'checkbox') && (
                                    <div className="mt-3 bg-white p-3 rounded border border-slate-200 w-full pr-8">
                                        <label className="block text-[10px] font-bold text-emerald-600 uppercase mb-1">Opções (Separadas por vírgula)</label>
                                        <input
                                            type="text"
                                            value={Array.isArray(field.options) ? field.options.join(', ') : (field.options || '')}
                                            onChange={(e) => {
                                                const opts = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                                updateField(index, 'options', opts as any);
                                            }}
                                            className="w-full border border-emerald-200 rounded p-1.5 text-slate-800 text-sm focus:ring-1 focus:ring-emerald-500"
                                            placeholder="Ex: Sim, Não, Às vezes"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving || !templateName}
                    className="w-full bg-slate-900 text-white rounded-xl py-4 font-bold hover:bg-slate-800 disabled:bg-slate-300 transition"
                >
                    {isSaving ? t('saving') : t('saveBtn')}
                </button>
            </main>

            <Modal
                isOpen={modalConfig.isOpen}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
            />
        </div>
    );
}
