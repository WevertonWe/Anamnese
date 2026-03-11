import { Metadata } from 'next';
import DoctorsTable from '@/components/admin/DoctorsTable';

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: 'Gestão de Usuários | Admin',
};

export default function UsersPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <header>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestão de Usuários</h1>
                <p className="text-slate-500 mt-1">Gerenciamento de médicos, assinaturas e perfis bloqueados.</p>
            </header>

            <div className="mt-8">
                <DoctorsTable />
            </div>
        </div>
    );
}
