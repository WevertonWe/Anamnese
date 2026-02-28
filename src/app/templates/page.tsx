'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createTemplate } from '@/app/actions/template.actions';
import Modal from '@/components/ui/Modal';

export default function TemplateEditor() {
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

    const [isSaving, setIsSaving] = useState(false);
    const [modalConfig, setModalConfig] = useState<{ isOpen: boolean, title: string, message: string, type: 'success' | 'error' | 'info' }>({
        isOpen: false, title: '', message: '', type: 'info'
    });

    const handleSave = async () => {
        setIsSaving(true);
        const result = await createTemplate({
            name: templateName,
            description,
            fields
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
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Novo Template</h1>
                        <p className="text-slate-500 text-sm">Crie uma avaliação clínica personalizada.</p>
                    </div>
                    <Link href="/" className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100">
                        Voltar
                    </Link>
                </header>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Nome do Template</label>
                        <input
                            type="text"
                            className="w-full border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="Ex: Cardiologia - Primeira Vez"
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Descrição Breve</label>
                        <input
                            type="text"
                            className="w-full border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                            placeholder="Ex: Foco nos hábitos de vida e hipertensão"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-slate-800">Campos da Anamnese (JSONB)</h2>
                        <button onClick={addField} className="text-sm bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-200">+ Campo</button>
                    </div>

                    <div className="space-y-4">
                        {fields.map((field, index) => (
                            <div key={index} className="flex flex-col sm:flex-row gap-3 items-end p-4 border border-dashed border-slate-200 rounded-lg bg-slate-50 relative group">
                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">ID Clínico (Para IA)</label>
                                    <input
                                        type="text"
                                        value={field.id}
                                        onChange={(e) => updateField(index, 'id', e.target.value)}
                                        className="w-full border border-slate-300 rounded md p-1.5 text-slate-800 text-sm"
                                    />
                                </div>
                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Título Visual (UI)</label>
                                    <input
                                        type="text"
                                        value={field.label}
                                        onChange={(e) => updateField(index, 'label', e.target.value)}
                                        className="w-full border border-slate-300 rounded md p-1.5 text-slate-800 text-sm"
                                        placeholder="Ex: História Patológica"
                                    />
                                </div>
                                <button onClick={() => removeField(index)} className="text-red-400 hover:text-red-600 p-2 opacity-50 hover:opacity-100">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving || !templateName}
                    className="w-full bg-slate-900 text-white rounded-xl py-4 font-bold hover:bg-slate-800 disabled:bg-slate-300 transition"
                >
                    {isSaving ? "Salvando localmente..." : "Salvar Template Estruturado"}
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
