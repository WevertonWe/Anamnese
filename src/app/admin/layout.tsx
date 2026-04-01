import { ReactNode } from 'react';
import Link from 'next/link';
import { getLoggedUserId, getUserRole } from '@/app/actions/auth.actions';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

export default async function AdminLayout({ children }: { children: ReactNode }) {
    const userId = await getLoggedUserId();
    if (!userId) redirect('/login');

    const profile = await prisma.doctorProfile.findUnique({ where: { id: userId } });
    if (!profile || profile.role !== 'ADMIN') {
        redirect('/');
    }

    let userEmail = profile.email;
    // O email já foi extraído acima

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            {/* Admin Sidebar */}
            <aside className="w-64 bg-slate-900 flex-shrink-0 text-slate-100 flex flex-col">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-xl font-bold text-white tracking-tight">SaaS Admin</h1>
                    <p className="text-xs text-slate-400 mt-1">Anamnese Inteligente</p>
                </div>
                
                <div className="p-4 border-b border-slate-800">
                    <Link href="/" className="px-4 py-2.5 rounded-lg text-slate-400 font-medium hover:text-white hover:bg-slate-800 transition flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Voltar ao App
                    </Link>
                </div>

                <nav className="flex-1 p-4 flex flex-col gap-2">
                    <Link href="/admin" className="px-4 py-2.5 rounded-lg bg-slate-800 text-emerald-400 font-medium hover:bg-slate-700 transition">
                        Dashboard
                    </Link>
                    <Link href="/admin/users" className="px-4 py-2.5 rounded-lg text-slate-300 font-medium hover:bg-slate-800 hover:text-white transition">
                        Gestão de Usuários
                    </Link>
                    <Link href="/admin/financial" className="px-4 py-2.5 rounded-lg text-slate-300 font-medium hover:bg-slate-800 hover:text-white transition">
                        Financeiro (SaaS)
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8">
                <div className="w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
