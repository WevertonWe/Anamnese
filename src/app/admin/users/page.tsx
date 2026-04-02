import { Metadata } from 'next';
import DoctorsTable from '@/components/admin/DoctorsTable';

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: 'Gestão de Usuários | Admin',
};

export default function UsersPage() {
    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] animate-in fade-in duration-300">
            <header className="flex-none">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestão de Usuários</h1>
                <p className="text-slate-500 mt-1">Gerenciamento de médicos, assinaturas e perfis bloqueados.</p>
            </header>

            <div className="mt-8 flex flex-col flex-1 min-h-0">
                <DoctorsTable />
            </div>
        </div>
    );
}
