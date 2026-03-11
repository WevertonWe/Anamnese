import { Metadata } from 'next';
import { getAdminDashStats } from '@/app/actions/admin.actions';
import DoctorsTable from '@/components/admin/DoctorsTable';

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: 'Painel Admin | Anamnese Pro',
    description: 'Gestão de usuários, assinaturas e faturamento SaaS',
    openGraph: {
        title: 'Painel Admin | Anamnese Pro',
        description: 'Gestão de usuários SaaS do Anamnese Pro',
    }
};

export default async function AdminDashboard() {
    let stats = { totalDoctors: 0, activeSubs: 0, expiredSubs: 0 };
    try {
        stats = await getAdminDashStats();
    } catch (e) {
        console.error("Erro ao carregar stats do Admin:", e);
    }

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Visão Geral</h1>
                <p className="text-slate-500 mt-1">Gestão de assinaturas, inadimplência e perfis médicos.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                    <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Total de Médicos</span>
                    <span className="text-4xl font-bold text-emerald-600">{stats.totalDoctors}</span>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                    <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Assinaturas Ativas</span>
                    <span className="text-4xl font-bold text-emerald-600">{stats.activeSubs}</span>
                </div>
                <div className={`p-6 rounded-2xl shadow-sm border flex flex-col ${stats.expiredSubs > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100'}`}>
                    <span className={`text-sm font-semibold uppercase tracking-wider mb-2 ${stats.expiredSubs > 0 ? 'text-red-600' : 'text-slate-500'}`}>Mensalidades Vencidas</span>
                    <span className={`text-4xl font-bold ${stats.expiredSubs > 0 ? 'text-red-700' : 'text-slate-400'}`}>{stats.expiredSubs}</span>
                </div>
            </div>

            <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Crescimento de Médicos (Adesão SaaS)</h3>
                <div className="flex items-end gap-3 h-40 w-full mb-2">
                    {[10, 25, 40, 65, 85, 100].map((val, i) => (
                        <div key={i} className="flex-1 bg-emerald-50 rounded-t border-b border-emerald-100 relative group h-full flex flex-col justify-end">
                            <div className="w-full bg-emerald-500 rounded-t opacity-90 transition-all duration-700 hover:opacity-100 shadow-[inset_0_-4px_10px_rgba(0,0,0,0.1)]" style={{ height: `${val}%` }}></div>
                            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded transition whitespace-nowrap z-10">{val}% Ativos</div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400 font-medium px-2">
                    <span>Ago</span><span>Set</span><span>Out</span><span>Nov</span><span>Dez</span><span>Jan</span>
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Acesso Rápido</h2>
                <div className="flex gap-4">
                    <a href="/admin/users" className="px-5 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-md transition font-bold text-sm">
                        Ir para Gestão de Usuários
                    </a>
                </div>
            </div>
        </div>
    );
}
