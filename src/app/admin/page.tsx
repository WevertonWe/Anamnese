import { Metadata } from 'next';
import { getAdminDashStats } from '@/app/actions/admin.actions';
import DoctorsTable from '@/components/admin/DoctorsTable';

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

            <div className="mt-8">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Gerenciamento de Médicos</h2>
                <DoctorsTable />
            </div>
        </div>
    );
}
