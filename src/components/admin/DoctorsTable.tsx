'use client';

import { useState, useEffect } from 'react';
import { getDoctorsList, updateDoctorStatus, updateDoctorSubscription, archiveDoctorProfile, permanentDeleteDoctor, updateUserPlan, updateUserRole, toggleUserStatus } from '@/app/actions/admin.actions';
import Link from 'next/link';
import UnifiedModal, { useUnifiedModal } from '@/components/ui/unified-modal';

export default function DoctorsTable() {
    const [doctors, setDoctors] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'ATIVOS' | 'EXCLUIDOS'>('ATIVOS');

    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const showToast = (message: string) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const [editingDoctor, setEditingDoctor] = useState<any | null>(null);
    const [editValue, setEditValue] = useState("");
    const [editDate, setEditDate] = useState("");
    
    // Estados para Exclusão Permanente
    const [deletingDoctor, setDeletingDoctor] = useState<any | null>(null);
    const [confirmDeleteText, setConfirmDeleteText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    // Unified Modal
    const { modalState, showModal, hideModal } = useUnifiedModal();

    // Archive confirm state
    const [archiveTarget, setArchiveTarget] = useState<{ id: string; isRestore: boolean } | null>(null);

    const loadDoctors = async () => {
        setIsLoading(true);
        try {
            const data = await getDoctorsList(search, statusFilter);
            setDoctors(data);
        } catch (e) {
            console.error(e);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadDoctors();
    }, [search, statusFilter]);

    const toggleStatus = async (id: string, currentStatus: string) => {
        const res = await toggleUserStatus(id);
        if (res.error) {
            showModal({ title: 'Erro', message: res.error, variant: 'danger' });
        } else {
            showToast(`Status de acesso alterado com sucesso!`);
            loadDoctors();
        }
    };

    const handlePlanChange = async (doc: any, plan: 'NORMAL' | 'PREMIUM' | 'ADMIN') => {
        const res = await updateUserPlan(doc.id, plan);
        if (res.success) {
            showToast(`Plano de ${doc.fullName} atualizado para ${plan} com sucesso!`);
            loadDoctors();
        } else {
            showModal({ title: 'Erro', message: res.error || 'Erro', variant: 'danger' });
        }
    };

    const handleRoleChange = async (doc: any, role: 'DOCTOR' | 'ADMIN') => {
        const res = await updateUserRole(doc.id, role);
        if (res.success) {
            showToast(`Acesso de ${doc.fullName} atualizado para ${role} com sucesso!`);
            loadDoctors();
        } else {
            showModal({ title: 'Erro', message: res.error || 'Erro', variant: 'danger' });
        }
    };

    const handleArchive = async (id: string, isRestore: boolean) => {
        setArchiveTarget({ id, isRestore });
        showModal({
            title: isRestore ? 'Restaurar Usuário' : 'Arquivar Usuário',
            message: isRestore ? 'Deseja restaurar este usuário excluído?' : 'Deseja realmente arquivar este usuário? Ele perderá o acesso imediatamente.',
            variant: 'confirm',
            onConfirm: async () => {
                hideModal();
                await archiveDoctorProfile(id, isRestore);
                loadDoctors();
                setArchiveTarget(null);
            }
        });
    };

    const handleSaveSubscription = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingDoctor) return;
        
        const numValue = editValue ? parseFloat(editValue) : 0;
        // Evitando timezone offset bug usando T12:00:00
        const dateObj = editDate ? new Date(`${editDate}T12:00:00`) : null;
        
        await updateDoctorSubscription(editingDoctor.id, numValue, dateObj);
        setEditingDoctor(null);
        showToast(`Mensalidade de ${editingDoctor.fullName} atualizada com sucesso!`);
        loadDoctors();
    };

    const handlePermanentDelete = async () => {
        if (!deletingDoctor || confirmDeleteText !== 'EXCLUIR') return;
        setIsDeleting(true);
        const res = await permanentDeleteDoctor(deletingDoctor.id);
        setIsDeleting(false);
        if (res.success) {
            showModal({ title: 'Excluído', message: `Médico removido e ${res.filesDeleted} arquivos apagados.`, variant: 'success' });
            setDeletingDoctor(null);
            setConfirmDeleteText("");
            loadDoctors();
        } else {
            showModal({ title: 'Erro', message: 'Erro ao excluir: ' + res.error, variant: 'danger' });
        }
    };

    const deletedDoctors = doctors.filter(d => d.deletedAt);
    const visibleDoctors = doctors.filter(d => activeTab === 'EXCLUIDOS' ? d.deletedAt : !d.deletedAt);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col flex-1 h-full min-h-0">
            {/* Nav Tabs */}
            {deletedDoctors.length > 0 && (
                <div className="flex border-b border-slate-100 bg-slate-50/50">
                    <button 
                        onClick={() => setActiveTab('ATIVOS')}
                        className={`px-6 py-3 text-sm font-bold transition-all ${activeTab === 'ATIVOS' ? 'border-b-2 border-emerald-500 text-emerald-700 bg-white' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Base de Usuários
                    </button>
                    <button 
                        onClick={() => setActiveTab('EXCLUIDOS')}
                        className={`px-6 py-3 text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'EXCLUIDOS' ? 'border-b-2 border-red-500 text-red-700 bg-white' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Excluídos
                        <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-bold">{deletedDoctors.length}</span>
                    </button>
                </div>
            )}

            {/* Toolbar */}
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50">
                <div className="flex flex-1 flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <input 
                        type="text" 
                        placeholder="Buscar por Nome, Email ou CRM..." 
                        className="w-full sm:w-2/3 p-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {activeTab === 'ATIVOS' && (
                        <select 
                            className="w-full sm:w-1/3 p-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="ALL">Todos os Status</option>
                            <option value="ACTIVE">Apenas Ativos</option>
                            <option value="BLOCKED">Apenas Bloqueados</option>
                        </select>
                    )}
                </div>
                
                <Link 
                    href="/admin/users/new" 
                    className="w-full md:w-auto text-center px-4 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors whitespace-nowrap"
                >
                    + Novo Médico
                </Link>
            </div>

            {/* Table */}
            <div className="overflow-x-auto overflow-y-auto flex-1 min-h-[500px] bg-white">
                <table className="w-full text-left border-collapse bg-white">
                    <thead className="sticky top-0 z-10 shadow-sm border-b border-slate-200">
                        <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
                            <th className="pl-4 pr-4 py-4 font-semibold border-b border-slate-100 w-1/4">Médico</th>
                            <th className="py-4 font-semibold border-b border-slate-100 w-[12%]">Plano</th>
                            <th className="py-4 font-semibold border-b border-slate-100 w-[13%]">Status</th>
                            {activeTab === 'ATIVOS' ? (
                                <>
                                    <th className="p-4 font-semibold border-b border-slate-100 w-[15%]">Assinatura</th>
                                    <th className="p-4 font-semibold border-b border-slate-100 w-[15%]">Último Acesso</th>
                                </>
                            ) : (
                                <th className="p-4 font-semibold border-b border-slate-100 w-[30%]">Lixeira (Countdown)</th>
                            )}
                            <th className="pl-2 pr-4 py-4 font-semibold border-b border-slate-100 w-[20%] text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-500">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                                </td>
                            </tr>
                        )}
                        {!isLoading && visibleDoctors.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-500">Nenhum médico nesta categoria.</td>
                            </tr>
                        )}
                        {!isLoading && visibleDoctors.map(doc => {
                            const isExpired = doc.subscriptionExpiresAt && new Date(doc.subscriptionExpiresAt) < new Date();
                            
                            let daysLeft = 0;
                            if (doc.deletedAt) {
                                const deletedDate = new Date(doc.deletedAt);
                                const expiryDate = new Date(deletedDate.getTime() + (60 * 24 * 60 * 60 * 1000));
                                const diffTime = Math.max(0, expiryDate.getTime() - new Date().getTime());
                                daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            }

                            return (
                                <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="pl-4 pr-4 py-3">
                                        <div className="font-bold text-slate-800 whitespace-nowrap">{doc.fullName}</div>
                                        <div className="text-sm text-slate-500 break-words">{doc.email}</div>
                                        <div className="text-xs text-slate-400 mt-1">CRM: {doc.crm || 'N/A'}</div>
                                    </td>
                                    <td className="py-3 align-middle">
                                        {(doc.role === 'ADMIN' || doc.email === 'wevwilson1@hotmail.com') ? (
                                            <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">ADMIN</span>
                                        ) : doc.plan === 'PREMIUM' ? (
                                            <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">PREMIUM</span>
                                        ) : (
                                            <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">NORMAL</span>
                                        )}
                                    </td>
                                    <td className="py-3 align-middle">
                                        {doc.deletedAt ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                                                ARQUIVADO
                                            </span>
                                        ) : (
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${doc.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'}`}>
                                                {doc.status === 'ACTIVE' ? 'ATIVO' : 'BLOQUEADO'}
                                            </span>
                                        )}
                                    </td>
                                    
                                    {activeTab === 'ATIVOS' ? (
                                        <>
                                            <td className="px-4 py-3">
                                                <div className="text-sm font-medium text-slate-800">
                                                    {doc.subscriptionValue ? `R$ ${Number(doc.subscriptionValue).toFixed(2)}` : 'R$ 0.00'}
                                                </div>
                                                <div className={`text-xs mt-1 font-medium ${isExpired ? 'text-orange-600 bg-orange-100 px-2 py-0.5 rounded inline-block' : 'text-slate-500'}`}>
                                                    Vence: {doc.subscriptionExpiresAt ? new Date(doc.subscriptionExpiresAt).toLocaleDateString('pt-BR') : 'Sem validade'}
                                                    {isExpired && ' (VENCIDA)'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm text-slate-600">
                                                    {doc.lastLoginAt ? new Date(doc.lastLoginAt).toLocaleString('pt-BR') : 'Nunca acessou'}
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-medium text-red-600 flex items-center gap-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                Remoção em {daysLeft} dias
                                            </div>
                                            <div className="text-xs text-slate-400 mt-1">Excluído em {new Date(doc.deletedAt).toLocaleDateString('pt-BR')}</div>
                                        </td>
                                    )}

                                    <td className="pl-2 pr-4 py-3">
                                        <div className="flex flex-col xl:flex-row gap-2 justify-end">
                                            {activeTab === 'EXCLUIDOS' ? (
                                                <>
                                                    <button 
                                                        onClick={() => handleArchive(doc.id, true)}
                                                        className="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors border border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                                    >
                                                        Restaurar Acesso
                                                    </button>
                                                    <button 
                                                        onClick={() => { setDeletingDoctor(doc); setConfirmDeleteText(""); }}
                                                        className="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors border border-red-200 text-red-600 hover:bg-red-50 flex items-center justify-center"
                                                        title="Excluir Definitivamente"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button 
                                                        onClick={() => toggleStatus(doc.id, doc.status)}
                                                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors border ${doc.status === 'ACTIVE' ? 'border-orange-200 text-orange-600 hover:bg-orange-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}
                                                    >
                                                        {doc.status === 'ACTIVE' ? 'Bloquear' : 'Desbloquear'}
                                                    </button>
                                                    <div className="relative group">
                                                        <button className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1">
                                                            Gerenciar Plano ▼
                                                        </button>
                                                        <div className="absolute top-full right-0 mt-1 hidden group-hover:flex flex-col bg-white border border-slate-200 rounded-lg shadow-xl z-[100] p-1 min-w-[170px]">
                                                            <button 
                                                                onClick={() => handlePlanChange(doc, 'NORMAL')}
                                                                className="text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded"
                                                            >Plano Normal</button>
                                                            <button 
                                                                onClick={() => handlePlanChange(doc, 'PREMIUM')}
                                                                className="text-left px-3 py-2 text-xs font-bold text-amber-600 hover:bg-amber-50 rounded"
                                                            >Plano Premium</button>
                                                            <div className="h-px bg-slate-100 my-1"></div>
                                                            <button 
                                                                onClick={() => handleRoleChange(doc, 'ADMIN')}
                                                                className="text-left px-3 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded"
                                                            >Tornar Administrador</button>
                                                            <button 
                                                                onClick={() => handleRoleChange(doc, 'DOCTOR')}
                                                                className="text-left px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded"
                                                            >Tornar Médico (Padrão)</button>
                                                            <div className="h-px bg-slate-100 my-1"></div>
                                                            <button 
                                                                onClick={() => {
                                                                    setEditingDoctor(doc);
                                                                    setEditValue(doc.subscriptionValue ? Number(doc.subscriptionValue).toString() : "0");
                                                                    setEditDate(doc.subscriptionExpiresAt ? new Date(doc.subscriptionExpiresAt).toISOString().split('T')[0] : "");
                                                                }}
                                                                className="text-left px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded"
                                                            >Editar Mensalidade</button>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleArchive(doc.id, false)}
                                                        className="text-xs font-bold px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                                                    >
                                                        Arquivar
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {editingDoctor && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-100">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Editar Assinatura</h3>
                        <p className="text-sm text-slate-500 mb-4">Atualize o plano financeiro do Dr. {editingDoctor.fullName}.</p>
                        
                        <form onSubmit={handleSaveSubscription} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Valor da Mensalidade (R$)</label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    value={editValue}
                                    onChange={e => setEditValue(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 border-emerald-500 text-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Data de Vencimento</label>
                                <input 
                                    type="date" 
                                    value={editDate}
                                    onChange={e => setEditDate(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 border-emerald-500 text-slate-800"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button 
                                    type="button" 
                                    onClick={() => setEditingDoctor(null)}
                                    className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
                                >
                                    Salvar Alterações
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Permanent Delete Modal */}
            {deletingDoctor && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-red-100">
                        <h3 className="text-xl font-bold text-red-600 mb-2 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            Exclusão Permanente
                        </h3>
                        <p className="text-sm text-slate-600 mb-4">
                            Deseja excluir definitivamente o Dr(a). <strong>{deletingDoctor.fullName}</strong>? Todos os arquivos associados serão removidos.
                        </p>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Digite EXCLUIR para confirmar</label>
                                <input 
                                    type="text" 
                                    value={confirmDeleteText}
                                    onChange={e => setConfirmDeleteText(e.target.value)}
                                    placeholder="EXCLUIR"
                                    className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 border-red-500 text-slate-800"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button 
                                    type="button" 
                                    onClick={() => { setDeletingDoctor(null); setConfirmDeleteText(""); }}
                                    className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handlePermanentDelete}
                                    disabled={confirmDeleteText !== 'EXCLUIR' || isDeleting}
                                    className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                                >
                                    {isDeleting ? 'Excluindo...' : 'Excluir Agora'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <UnifiedModal
                isOpen={modalState.isOpen}
                title={modalState.title}
                message={modalState.message}
                variant={modalState.variant}
                onConfirm={modalState.onConfirm}
                onClose={hideModal}
            />

            {toastMessage && (
                <div className="fixed bottom-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl font-bold z-[100] border-2 border-emerald-400">
                    {toastMessage}
                </div>
            )}
        </div>
    );
}
