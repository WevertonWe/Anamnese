'use client';

import { useState } from 'react';
import Image from 'next/image';
import { createDoctorWithBranding } from '@/app/actions/admin.actions';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';

export default function DoctorForm() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successModal, setSuccessModal] = useState<{isOpen: boolean, password?: string, copyStatus?: string}>({ isOpen: false });
    const [errorMsg, setErrorMsg] = useState('');

    const [form, setForm] = useState({
        fullName: '',
        crm: '',
        specialty: '',
        email: '',
        subscriptionValue: 0,
        subscriptionExpiresAt: '',
        plan: 'NORMAL' as 'NORMAL' | 'PREMIUM'
    });

    const [logoBase64, setLogoBase64] = useState<string | null>(null);
    const [signatureBase64, setSignatureBase64] = useState<string | null>(null);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'signature') => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            if (type === 'logo') setLogoBase64(reader.result as string);
            if (type === 'signature') setSignatureBase64(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, type: 'logo' | 'signature') => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            if (type === 'logo') setLogoBase64(reader.result as string);
            if (type === 'signature') setSignatureBase64(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setIsSubmitting(true);

        const res = await createDoctorWithBranding({
            ...form,
            subscriptionExpiresAt: form.subscriptionExpiresAt ? new Date(form.subscriptionExpiresAt) : null,
            logoBase64,
            signatureBase64
        });

        setIsSubmitting(false);

        if (res.success) {
            setSuccessModal({ isOpen: true, password: res.password });
        } else {
            setErrorMsg(res.error || 'Erro desconhecido');
        }
    };

    const handleCopyToWhatsApp = () => {
        if (!successModal.password) return;
        const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://sua-app.com';
        const text = `Olá, Dr(a)! Boas-vindas à Anamnese PWA. 🩺🔐\n🔗 Acesso: ${appUrl}\n📧 Login: ${form.email}\n🔑 Senha: ${successModal.password}`;
        
        navigator.clipboard.writeText(text).then(() => {
            setSuccessModal(prev => ({...prev, copyStatus: '✅ Copiado!'}));
            setTimeout(() => setSuccessModal(prev => ({...prev, copyStatus: undefined})), 3000);
        });
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-8">
                
                {errorMsg && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm font-medium border border-red-200">
                        {errorMsg}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Nome Completo</label>
                        <input required type="text" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Dr. Nome Sobrenome" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">CRM</label>
                        <input required type="text" value={form.crm} onChange={e => setForm({...form, crm: e.target.value})} className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="CRM-SP 00000" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Especialidade</label>
                        <input required type="text" value={form.specialty} onChange={e => setForm({...form, specialty: e.target.value})} className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Cardiologia" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">E-mail de Acesso</label>
                        <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="medico@clinica.com" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Valor da Mensalidade (R$)</label>
                        <input required type="number" step="0.01" min="0" value={form.subscriptionValue} onChange={e => setForm({...form, subscriptionValue: parseFloat(e.target.value)})} className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="199.90" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Data de Vencimento</label>
                        <input type="date" value={form.subscriptionExpiresAt} onChange={e => setForm({...form, subscriptionExpiresAt: e.target.value})} className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Plano Inicial</label>
                        <select 
                            value={form.plan} 
                            onChange={e => setForm({...form, plan: e.target.value as any})} 
                            className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
                        >
                            <option value="NORMAL">Normal</option>
                            <option value="PREMIUM">Premium</option>
                        </select>
                    </div>
                </div>

                <hr className="border-slate-100" />

                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-800">Branding & Identidade</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Box Logo */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Logotipo da Clínica</label>
                            <div 
                                onDragOver={e => e.preventDefault()} 
                                onDrop={e => handleDrop(e, 'logo')}
                                className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition relative overflow-hidden"
                            >
                                {logoBase64 ? (
                                    <div className="flex flex-col items-center">
                                        <Image src={logoBase64} alt="Logo" width={160} height={80} className="h-20 w-auto object-contain mb-4" />
                                        <button type="button" onClick={() => setLogoBase64(null)} className="text-xs text-red-600 font-bold hover:underline">Remover Logotipo</button>
                                    </div>
                                ) : (
                                    <>
                                        <svg className="mx-auto h-10 w-10 text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        <p className="text-sm text-slate-500 mb-1">Arraste a logo aqui ou clique</p>
                                        <input type="file" accept="image/*" onChange={e => handleFile(e, 'logo')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Box Signature with Checkerboard */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Assinatura Transparente (PNG)</label>
                            <div 
                                onDragOver={e => e.preventDefault()} 
                                onDrop={e => handleDrop(e, 'signature')}
                                className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center transition relative overflow-hidden group"
                                style={{
                                    backgroundImage: signatureBase64 ? 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h10v10H0V0zm10 10h10v10H10V10z\' fill=\'%23f1f5f9\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")' : 'none',
                                    backgroundColor: signatureBase64 ? 'white' : 'transparent'
                                }}
                            >
                                {signatureBase64 ? (
                                    <div className="flex flex-col items-center">
                                        <Image src={signatureBase64} alt="Signature" width={160} height={80} className="h-20 w-auto object-contain mb-4 drop-shadow-sm" />
                                        <button type="button" onClick={() => setSignatureBase64(null)} className="text-xs text-red-600 font-bold hover:underline bg-white px-2 py-1 rounded shadow-sm">Remover Assinatura</button>
                                    </div>
                                ) : (
                                    <div className="group-hover:bg-slate-50 h-full rounded-xl flex flex-col items-center justify-center">
                                        <svg className="mx-auto h-10 w-10 text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        <p className="text-sm text-slate-500 mb-1">Arraste a assinatura em .png transparente</p>
                                        <input type="file" accept="image/png" onChange={e => handleFile(e, 'signature')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl transition shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Processando e Criando...' : 'Cadastrar Médico'}
                    </button>
                </div>
            </form>

            <Modal
                isOpen={successModal.isOpen}
                title="✅ Cadastro Realizado com Sucesso!"
                message={`O perfil médico foi criado e o branding foi armazenado na AWS. A senha gerada dinamicamente para o primeiro acesso é:`}
                type="success"
                onClose={() => {
                    setSuccessModal({ isOpen: false });
                    router.push('/admin');
                }}
            >
                <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <span className="block text-sm text-slate-500 mb-1">Senha Temporária:</span>
                    <span className="text-2xl font-mono font-bold text-emerald-700 tracking-wider select-all cursor-pointer" onClick={() => {
                        navigator.clipboard.writeText(successModal.password || '');
                    }} title="Copiar apenas a senha">{successModal.password}</span>
                </div>
                
                <div className="mt-6 flex flex-col sm:flex-row justify-center sm:justify-end gap-3">
                    <button 
                        onClick={handleCopyToWhatsApp} 
                        className="bg-[#25D366] hover:bg-[#128C7E] flex items-center justify-center gap-2 text-white font-bold py-2 px-6 rounded-lg transition"
                        title="Copia uma mensagem pronta para enviar ao médico."
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                        </svg>
                        {successModal.copyStatus || 'Copiar Tudo'}
                    </button>
                    <button 
                        onClick={() => {
                            setSuccessModal({ isOpen: false });
                            router.push('/admin');
                        }} 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-lg transition"
                    >
                        Dashboard
                    </button>
                </div>
            </Modal>
        </div>
    );
}
