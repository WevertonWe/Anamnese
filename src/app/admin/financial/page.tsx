import { Metadata } from 'next';
import prisma from '@/lib/prisma';

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: 'SaaS Financeiro | Anamnese Pro',
};

async function getMRR() {
    const activeDoctors = await prisma.doctorProfile.findMany({
        where: { status: 'ACTIVE', deletedAt: null }
    });
    
    let mrr = 0;
    for (const doc of activeDoctors) {
        if (doc.subscriptionValue) {
            mrr += Number(doc.subscriptionValue);
        }
    }
    return mrr;
}

export default async function FinancialPage() {
    const mrr = await getMRR();

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <header>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Financeiro (SaaS)</h1>
                <p className="text-slate-500 mt-1">Visão geral do faturamento e métricas financeiras.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                    <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Receita Mensal Recorrente (MRR)
                    </span>
                    <span className="text-4xl font-bold text-slate-800">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(mrr)}
                    </span>
                </div>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 mt-8 text-center flex flex-col items-center justify-center">
                 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-400">
                     <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                 </div>
                 <h3 className="text-lg font-bold text-slate-800">Mais métricas em breve</h3>
                 <p className="text-slate-500 mt-1 max-w-sm">Integração com gateway de pagamento (Stripe/Pagar.me) estará disponível em futuras atualizações.</p>
            </div>
        </div>
    );
}
