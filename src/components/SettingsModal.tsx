'use client';

import { useState, useEffect } from 'react';
import { getDoctorProfile, saveDoctorProfile } from '@/app/actions/profile.actions';
import Modal from '@/components/ui/Modal';

export default function SettingsModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const [fullName, setFullName] = useState('');
    const [crm, setCrm] = useState('');
    const [specialty, setSpecialty] = useState('');
    const [signatureAlign, setSignatureAlign] = useState('center');
    const [showLogoText, setShowLogoText] = useState(true);
    const [role, setRole] = useState('doctor');
    const [aiModel, setAiModel] = useState('gemini-1.5-flash');
    const [isSaving, setIsSaving] = useState(false);

    const [modalConfig, setModalConfig] = useState<{ isOpen: boolean, title: string, message: string, type: 'success' | 'error' | 'info' }>({
        isOpen: false, title: '', message: '', type: 'info'
    });

    useEffect(() => {
        if (isOpen) {
            getDoctorProfile().then(profile => {
                if (profile) {
                    setFullName(profile.fullName || '');
                    setCrm(profile.crm || '');
                    setSpecialty(profile.specialty || '');
                    setSignatureAlign(profile.signatureAlign || 'center');
                    setShowLogoText(profile.showLogoText ?? true);
                    setRole(profile.role || 'doctor');
                    setAiModel(profile.aiModel || 'gemini-1.5-flash');
                }
            });
        }
    }, [isOpen]);

    const handleSave = async () => {
        setIsSaving(true);
        const res = await saveDoctorProfile({ fullName, crm, specialty, signatureAlign, showLogoText, role, aiModel });
        setIsSaving(false);
        if (res.success) {
            setModalConfig({ isOpen: true, title: 'Sucesso', message: 'Configurações do profissional salvas.', type: 'success' });
            setTimeout(() => {
                setModalConfig(m => ({ ...m, isOpen: false }));
                onClose();
            }, 1000);
        } else {
            setModalConfig({ isOpen: true, title: 'Erro', message: res.error || 'Erro ao salvar', type: 'error' });
        }
    };

    if (!isOpen) return null;

    // Calculo do preview
    const alignClass = signatureAlign === 'left' ? 'text-left' : signatureAlign === 'right' ? 'text-right' : 'text-center';

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col md:flex-row max-h-[90vh]">

                {/* Lado Esquerdo: Formulário */}
                <div className="flex-1 overflow-y-auto w-full">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            Perfil e Preferências
                        </h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition md:hidden">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Identidade</h3>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Perfil de Uso</label>
                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                    <button
                                        onClick={() => setRole('doctor')}
                                        className={`flex-1 text-sm py-1.5 rounded-md font-medium transition ${role === 'doctor' ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Médico Profissional
                                    </button>
                                    <button
                                        onClick={() => setRole('patient')}
                                        className={`flex-1 text-sm py-1.5 rounded-md font-medium transition ${role === 'patient' ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Paciente / Pessoal
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo</label>
                                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ex: Dr. João Silva" />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Registro Médico</label>
                                    <input type="text" value={crm} onChange={e => setCrm(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ex: CRM-SP 123456" />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Especialidade</label>
                                    <input type="text" value={specialty} onChange={e => setSpecialty(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ex: Cardiologia" />
                                </div>
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Impressão PDF</h3>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={showLogoText} onChange={e => setShowLogoText(e.target.checked)} className="w-4 h-4 text-emerald-600 rounded cursor-pointer" />
                                <span className="text-sm font-medium text-slate-700">Imprimir "Anamnese Inteligente PWA" no cabeçalho</span>
                            </label>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Alinhamento da Assinatura</label>
                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                    {['left', 'center', 'right'].map((align) => (
                                        <button
                                            key={align}
                                            onClick={() => setSignatureAlign(align)}
                                            className={`flex-1 text-sm py-1.5 rounded-md font-medium transition ${signatureAlign === align ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            {align === 'left' ? 'Esquerda' : align === 'center' ? 'Centro' : 'Direita'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 z-10 w-full">
                        <button onClick={onClose} className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition">Cancelar</button>
                        <button onClick={handleSave} disabled={isSaving} className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition sm:w-auto w-full">
                            {isSaving ? 'Salvando...' : 'Salvar Dados'}
                        </button>
                    </div>
                </div>

                {/* Lado Direito: Preview */}
                <div className="hidden md:flex flex-col w-[300px] bg-slate-100 border-l border-slate-200 p-6 flex-shrink-0">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            Preview A4
                        </h3>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <div className="flex-1 bg-white shadow-sm border border-slate-200 aspect-[1/1.4] w-full p-4 flex flex-col justify-between text-[10px] leading-tight text-slate-800 relative">
                        <div className="text-center">
                            {showLogoText && <div className="text-[6px] text-slate-400 absolute top-2 right-2 uppercase">Anamnese Inteligente PWA</div>}
                            <div className="font-bold text-[11px] mb-1">RELATÓRIO CLÍNICO</div>
                            {fullName && <div className="font-medium">{fullName}</div>}
                            {(specialty || crm) && <div className="text-slate-500">{specialty} {specialty && crm ? '|' : ''} {crm ? `CRM: ${crm}` : ''}</div>}
                            <div className="h-px bg-slate-300 w-full my-2"></div>
                            <div className="text-left text-slate-600">
                                <div>Paciente: Maria Santos</div>
                                <div>Data: 28/02/2026</div>
                            </div>
                            <div className="mt-4 bg-slate-100 border border-slate-300 rounded-[2px] h-16 w-full flex items-center justify-center text-slate-400 italic">Estrutura da Anamnese...</div>
                        </div>

                        <div className={`mt-auto ${alignClass}`}>
                            <div className={`w-24 border-t border-slate-800 inline-block mt-4 mb-1 ${signatureAlign === 'center' ? 'mx-auto' : signatureAlign === 'right' ? 'ml-auto' : ''}`}></div>
                            <div className="font-bold">{fullName || 'Nome do Médico'}</div>
                            {crm && <div className="text-[8px] text-slate-500">CRM: {crm}</div>}
                        </div>
                    </div>
                </div>
            </div>

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
