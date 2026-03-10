import { ReactNode } from 'react';
import Link from 'next/link';
import { getLoggedUserId, getUserRole } from '@/app/actions/auth.actions';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }: { children: ReactNode }) {
    const role = await getUserRole();
    if (role !== 'ADMIN') {
        redirect('/');
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            {/* Admin Sidebar */}
            <aside className="w-full md:w-64 bg-slate-900 text-slate-100 flex flex-col">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-xl font-bold text-white tracking-tight">SaaS Admin</h1>
                    <p className="text-xs text-slate-400 mt-1">Anamnese Inteligente</p>
                </div>
                
                <div className="p-4 border-b border-slate-800">
                    <Link href="/" className="px-4 py-2.5 rounded-lg text-slate-400 font-medium hover:text-white hover:bg-slate-800 transition flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        ← Voltar ao App
                    </Link>
                </div>

                <nav className="flex-1 p-4 flex flex-col gap-2">
                    <Link href="/admin" className="px-4 py-2.5 rounded-lg bg-slate-800 text-emerald-400 font-medium hover:bg-slate-700 transition">
                        Dashboard
                    </Link>
                    <Link href="/admin/users" className="px-4 py-2.5 rounded-lg text-slate-300 font-medium hover:bg-slate-800 hover:text-white transition">
                        Gestão de Usuários
                    </Link>
                    <Link href="/admin/finance" className="px-4 py-2.5 rounded-lg text-slate-300 font-medium hover:bg-slate-800 hover:text-white transition">
                        Financeiro (SaaS)
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-10 overflow-y-auto">
                <div className="max-w-5xl mx-auto space-y-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
