'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getHistory() {
    try {
        const records = await prisma.patientRecord.findMany({
            orderBy: { createdAt: 'desc' },
            include: { template: true }
        });

        return records.map(r => ({
            ...r,
            data: typeof r.data === 'string' ? JSON.parse(r.data) : r.data
        }));
    } catch (err) {
        console.error("Erro ao puxar histórico do banco:", err);
        return [];
    }
}

export async function deleteRecord(id: string) {
    try {
        await prisma.patientRecord.delete({ where: { id } });
        revalidatePath('/');
        return { success: true };
    } catch (err) {
        console.error("Erro ao excluir registro:", err);
        return { success: false, error: "Falha ao excluir." };
    }
}

export async function saveRecord(data: { patientName: string; templateId: string; date?: string; data: any }) {
    try {
        const { getLoggedUserId } = await import('@/app/actions/auth.actions');
        const doctorId = await getLoggedUserId();

        const newRecord = await (prisma.patientRecord as any).create({
            data: {
                patientName: data.patientName || "Paciente Não Identificado",
                templateId: data.templateId,
                doctorId: doctorId || undefined,
                date: data.date ? new Date(data.date) : new Date(),
                data: JSON.stringify(data.data)
            },
            include: { template: true }
        });

        revalidatePath('/');

        return {
            success: true,
            data: {
                ...newRecord,
                data: JSON.parse(newRecord.data) // Return parsed
            }
        };
    } catch (err) {
        console.error("Erro ao salvar registro manual:", err);
        return { success: false, error: "Falha ao salvar prontuário." };
    }
}

export async function getRecentPatientHistory(patientName: string) {
    if (!patientName || patientName.trim() === '') return null;

    try {
        const records = await prisma.patientRecord.findMany({
            where: { patientName: { equals: patientName } },
            orderBy: { createdAt: 'desc' },
            take: 2,
            include: { template: true }
        });

        if (records.length === 0) return null;

        return records.map(r => {
            const date = new Date(r.date || r.createdAt).toLocaleDateString('pt-BR');
            let parsedData = r.data;
            if (typeof parsedData === 'string') {
                try { parsedData = JSON.parse(parsedData); } catch { }
            }

            const hipotese = (parsedData as any)?.hipotese_diagnostica || '';
            const conduta = (parsedData as any)?.conduta_sugerida || '';
            const queixa = (parsedData as any)?.queixa_principal || '';

            return `Consulta em ${date} (Formato: ${r.template?.name || 'Geral'}):
Queixa Relatada: ${queixa}
Hipótese Anterior: ${hipotese}
Conduta Anterior: ${conduta}`;
        }).join('\n\n---\n\n');
    } catch (err) {
        console.error("Erro ao puxar histórico recente:", err);
        return null;
    }
}
