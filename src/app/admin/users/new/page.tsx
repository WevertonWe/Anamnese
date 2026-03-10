import { Metadata } from 'next';
import DoctorForm from '@/components/admin/DoctorForm';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Novo Cadastro de Médico | Admin',
    description: 'Adição de usuário SaaS com customização de Branding'
};

export default function NewDoctorPage() {
    return (
        <div className="space-y-6">
            <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Cadastrar Novo Médico</h1>
                    <p className="text-slate-500 mt-1">Insira os dados cadastrais e faça o primeiro upload de Branding.</p>
                </div>
                <Link href="/admin" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition">
                    &larr; Voltar ao Dashboard
                </Link>
            </header>

            <DoctorForm />
        </div>
    );
}
