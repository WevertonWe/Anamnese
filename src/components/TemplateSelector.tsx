'use client';

import { useState, useEffect } from 'react';
import { getTemplates, deleteTemplate } from '@/app/actions/template.actions';
import { getUserRole } from '@/app/actions/auth.actions';
import { useRouter } from 'next/navigation';

export default function TemplateSelector({ onSelect }: { onSelect?: (id: string) => void }) {
    const router = useRouter();
    const [templates, setTemplates] = useState<Record<string, unknown>[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [role, setRole] = useState('doctor');

    const loadData = async () => {
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
        loadData();
        getUserRole().then(r => {
            if (r) setRole(r);
        });
    }, []);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("Tem certeza que deseja excluir permanentemente este template?")) {
            setLoading(true);
            await deleteTemplate(id);
            if (selectedId === id) setSelectedId(null);
            await loadData();
        }
    };

    if (loading) {
        return <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-100 animate-pulse h-32 w-full"></div>;
    }

    return (
        <div className="w-full flex justify-center mt-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 w-full max-w-md mx-auto">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center justify-between">
                    <span>Templates Disponíveis</span>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">{templates.length}</span>
                </h3>

                <div className="flex flex-col gap-3">
                    {templates.map(tpl => {
                        const isSelected = selectedId === String(tpl.id);
                        return (
                            <div
                                key={String(tpl.id)}
                                onClick={() => {
                                    const id = String(tpl.id);
                                    setSelectedId(id);
                                    if (onSelect) onSelect(id);
                                }}
                                className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-all group ${isSelected ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' : 'border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/50'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <span className="font-medium text-slate-700 group-hover:text-emerald-700">{String(tpl.name)}</span>
                                    <div className="flex items-center gap-2">
                                        {role === 'doctor' && !Boolean(tpl.isDefault) && (
                                            <button
                                                onClick={(e) => handleDelete(e, String(tpl.id))}
                                                className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                                title="Excluir template"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        )}
                                        {Boolean(tpl.isDefault) && <span className="text-[10px] font-bold text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded uppercase">Padrão</span>}
                                        {isSelected && (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-600 bg-emerald-100 rounded-full p-0.5 animate-in zoom-in" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                </div>
                                <span className="text-xs text-slate-500 mt-1 line-clamp-1">{String(tpl.description)}</span>
                                <div className="mt-3 flex gap-1 flex-wrap">
                                    {(tpl.schema as any)?.fields?.map((field: Record<string, unknown>) => (
                                        <span key={String(field.id)} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                            {String(field.label || field.id)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {role === 'doctor' && (
                        <button
                            onClick={() => router.push('/templates')}
                            className="mt-2 w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-slate-300 text-slate-500 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="text-sm font-medium">Criar novo template personalizado</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
