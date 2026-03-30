'use client';

import { useState, useEffect } from 'react';
import { getUserRole } from '@/app/actions/auth.actions';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import UnifiedModal, { useUnifiedModal } from '@/components/ui/unified-modal';

export default function TemplateSelector({ onSelect, onEdit, initialTemplates }: { onSelect?: (id: string) => void, onEdit?: (id: string) => void, initialTemplates?: any[] }) {
    const t = useTranslations('TemplateSelector');
    const { modalState, showModal, hideModal } = useUnifiedModal();
    const router = useRouter();
    const [templates, setTemplates] = useState<Record<string, any>[]>(initialTemplates || []);
    const [loading, setLoading] = useState(!initialTemplates);
    const [selectedId, setSelectedId] = useState<string | null>(initialTemplates && initialTemplates.length > 0 ? String(initialTemplates[0].id) : null);
    const [role, setRole] = useState('DOCTOR');

    const loadData = async () => {
        const { getTemplates } = await import('@/app/actions/template.actions');
        const data = await getTemplates();
        setTemplates(data);
        if (data.length > 0 && !selectedId) {
            const firstId = String(data[0].id);
            setSelectedId(firstId);
            if (onSelect) onSelect(firstId);
        } else if (data.length === 0) {
            setSelectedId(null);
            if (onSelect) onSelect('');
        }
        setLoading(false);
    };

    useEffect(() => {
        if (!initialTemplates) {
            loadData();
        } else {
            setLoading(false);
        }
        getUserRole().then(r => {
            if (r) setRole(r);
        });
    }, [initialTemplates]);

    const confirmDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        showModal({
            title: 'Excluir Template',
            message: 'Tem certeza que deseja excluir permanentemente este template de anamnese?',
            variant: 'danger',
            onConfirm: async () => {
                const { deleteTemplate } = await import('@/app/actions/template.actions');
                setLoading(true);
                await deleteTemplate(id);
                if (selectedId === id) setSelectedId(null);
                await loadData();
                hideModal();
            }
        });
    };

    if (loading) {
        return <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-100 animate-pulse h-32 w-full"></div>;
    }

    return (
        <div className="w-full flex justify-center mt-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 w-full max-w-md mx-auto">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center justify-between px-1">
                    <span>{t('available')}</span>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">{templates.length}</span>
                </h3>

                <div className="flex flex-col gap-3">
                    {/* Botão de Criação Fixado no Topo */}
                    <button
                        onClick={() => router.push('/dashboard/templates/new')}
                        className="w-full p-4 mb-2 border-2 border-dashed border-emerald-300 rounded-xl bg-emerald-50/30 hover:bg-emerald-50 cursor-pointer flex flex-col items-center justify-center gap-1 transition-all group"
                    >
                        <div className="bg-emerald-100 p-1.5 rounded-full text-emerald-600 group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <span className="text-sm font-bold text-emerald-700">Criar Novo Template</span>
                    </button>

                    {/* Lista de Templates */}
                    {templates.map(tpl => {
                        const isSelected = selectedId === String(tpl.id);
                        const isUserTemplate = Boolean(tpl.doctorId);

                        return (
                            <div
                                key={String(tpl.id)}
                                onClick={() => {
                                    const id = String(tpl.id);
                                    setSelectedId(id);
                                    if (onSelect) onSelect(id);
                                }}
                                className={`flex flex-col p-4 rounded-xl border relative cursor-pointer transition-all group ${isSelected 
                                    ? 'border-emerald-500 bg-emerald-50 shadow-md ring-1 ring-emerald-500' 
                                    : 'border-slate-100 hover:border-emerald-200 hover:bg-slate-50'
                                }`}
                            >
                                <div className="flex justify-between items-start mr-12">
                                    <span className={`font-bold transition-colors ${isSelected ? 'text-emerald-800' : 'text-slate-700 group-hover:text-emerald-700'}`}>
                                        {String(tpl.name)}
                                    </span>
                                </div>

                                {/* Ações Rápidas (Editar/Excluir) */}
                                {isUserTemplate && (
                                    <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (onEdit) onEdit(String(tpl.id));
                                            }}
                                            className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-emerald-600 hover:border-emerald-200 shadow-sm transition"
                                            title="Editar"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </button>
                                        <button
                                            onClick={(e) => confirmDelete(e, String(tpl.id))}
                                            className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-red-500 hover:border-red-100 shadow-sm transition"
                                            title="Excluir"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                )}

                                <span className="text-xs text-slate-500 mt-1 line-clamp-1">{String(tpl.description)}</span>
                                <div className="mt-3 flex gap-1 flex-wrap">
                                    {Boolean(tpl.isDefault) && <span className="text-[9px] font-black bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded uppercase mr-1">Padrão</span>}
                                    {(tpl.schema as any)?.fields?.slice(0, 3).map((field: Record<string, any>) => (
                                        <span key={String(field.id)} className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200/50">
                                            {String(field.label || field.id)}
                                        </span>
                                    ))}
                                    {(tpl.schema as any)?.fields?.length > 3 && <span className="text-[9px] text-slate-400 font-bold ml-1">+{ (tpl.schema as any)?.fields?.length - 3 }</span>}
                                </div>
                            </div >
                        );
                    })}

                </div >
            </div >

            <UnifiedModal
                isOpen={modalState.isOpen}
                title={modalState.title}
                message={modalState.message}
                variant={modalState.variant}
                onClose={hideModal}
                onConfirm={modalState.onConfirm}
            />
        </div>
    );
}
