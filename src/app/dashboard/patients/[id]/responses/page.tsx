import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = "force-dynamic";

export default async function PatientResponsePage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;

    const record = await prisma.patientRecord.findUnique({
        where: { id },
        include: { template: true }
    });

    if (!record) return notFound();

    let answers: Record<string, string> = {};
    try {
        answers = typeof record.data === 'string' ? JSON.parse(record.data) : record.data;
    } catch { }

    const templateSchema = record.template?.schema as any;
    const fields = templateSchema?.fields || [];

    // Combine questions and answers
    const rows = fields.map((field: any, index: number) => ({
        order: index + 1,
        question: field.label || field.id,
        category: field.type || 'text',
        answer: answers[field.id] || 'Não respondido'
    }));

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto min-h-screen space-y-8 animate-in fade-in">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <Link href="/" className="inline-flex items-center text-sm text-emerald-600 hover:text-emerald-700 font-medium mb-3 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Voltar ao Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Respostas da Anamnese</h1>
                    <p className="text-slate-500 mt-1">Paciente: <strong className="text-slate-700">{record.patientName}</strong> • Data: {new Date(record.date).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg text-sm border border-slate-200">
                    Template: {record.template?.name || 'Geral'}
                </div>
            </header>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-700 font-semibold text-xs uppercase tracking-wider border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 w-16 text-center">Ordem</th>
                                <th className="px-6 py-4 w-1/3">Pergunta</th>
                                <th className="px-6 py-4 w-32">Categoria</th>
                                <th className="px-6 py-4">Resposta do Paciente</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rows.map((row: any) => (
                                <tr key={row.order} className="even:bg-slate-50/50 hover:bg-emerald-50/30 transition-colors group">
                                    <td className="px-6 py-4 text-center font-medium text-slate-400 group-hover:text-emerald-600">{row.order}</td>
                                    <td className="px-6 py-4 text-slate-900 font-medium">{row.question}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 uppercase">
                                            {row.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-800 whitespace-pre-wrap">{row.answer}</td>
                                </tr>
                            ))}
                            {rows.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">Nenhuma resposta registrada.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
