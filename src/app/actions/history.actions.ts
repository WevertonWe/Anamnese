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

export async function saveRecord(data: { patientName: string; templateId: string; data: any }) {
    try {
        const newRecord = await prisma.patientRecord.create({
            data: {
                patientName: data.patientName || "Paciente Não Identificado",
                templateId: data.templateId,
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
