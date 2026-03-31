'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getHistory() {
    try {
        const { getLoggedUserId } = await import('@/app/actions/auth.actions');
        const doctorId = await getLoggedUserId();

        const records = await prisma.patientRecord.findMany({
            where: doctorId ? { doctorId } : {},
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
        const { getLoggedUserId } = await import('@/app/actions/auth.actions');
        const doctorId = await getLoggedUserId();

        const record = await prisma.patientRecord.findUnique({ where: { id } });
        if (!record) return { success: false, error: "Registro não encontrado." };
        if (record.doctorId && record.doctorId !== doctorId) {
            return { success: false, error: "Não autorizado." };
        }

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
            const peso = (parsedData as any)?.peso || '';
            const altura = (parsedData as any)?.altura || '';

            return `Consulta em ${date} (Formato: ${r.template?.name || 'Geral'}):
Queixa Relatada: ${queixa}
Hipótese Anterior: ${hipotese}
Conduta Anterior: ${conduta}
Peso: ${peso}
Altura: ${altura}`;
        }).join('\n\n---\n\n');
    } catch (err) {
        console.error("Erro ao puxar histórico recente:", err);
        return null;
    }
}

export async function toggleReadStatus(id: string) {
    try {
        const record = await prisma.patientRecord.findUnique({ where: { id }, select: { isRead: true } });
        await prisma.patientRecord.update({
            where: { id },
            data: { isRead: !(record?.isRead || false) }
        });
        revalidatePath('/');
        return { success: true };
    } catch (err) {
        return { success: false };
    }
}

export async function generateRemoteLink(patientName: string, templateId: string) {
    try {
        const { getLoggedUserId } = await import('@/app/actions/auth.actions');
        const doctorId = await getLoggedUserId();

        const newRecord = await prisma.patientRecord.create({
            data: {
                patientName: patientName || "Não Identificado",
                templateId,
                doctorId: doctorId || undefined,
                status: 'PENDING',
                data: "{}"
            }
        });

        revalidatePath('/');
        const link = `http://localhost:3000/anamnese/${newRecord.id}`;
        console.log(`[HistoryAction] Link Remoto Gerado: patient=${patientName}, link=${link}`);
        // Ideal is to use env var for URL, using localhost for request
        return { success: true, link };
    } catch(e) {
        console.error(`[HistoryAction] Erro ao gerar link:`, e);
        return { success: false, error: 'Falha ao gerar link remoto' };
    }
}

export async function getRemoteFormDetails(slug: string) {
    try {
        const record = await prisma.patientRecord.findUnique({
            where: { id: slug },
            include: { template: true, doctor: true }
        });
        if (!record) return null;
        
        if (record.status === 'PENDING') {
            await prisma.patientRecord.update({
                where: { id: slug },
                data: { status: 'OPENED' }
            });
        }
        
        return JSON.parse(JSON.stringify(record));
    } catch(e) { return null; }
}

export async function submitRemoteForm(slug: string, data: any) {
    try {
       await prisma.patientRecord.update({
           where: { id: slug },
           data: {
               data: JSON.stringify(data),
               status: 'COMPLETED'
           }
       });
       return { success: true };
    } catch(e) { return { success: false, error: 'Erro ao enviar questionário' }; }
}

export async function updateRecordStatus(id: string, status: string) {
    try {
        await (prisma.patientRecord as any).update({
            where: { id },
            data: { status }
        });
        revalidatePath('/');
        return { success: true };
    } catch (err) {
        return { success: false };
    }
}

export async function updatePatientRecord(id: string, data: any) {
    try {
        const { getLoggedUserId } = await import('@/app/actions/auth.actions');
        const doctorId = await getLoggedUserId();

        const record = await prisma.patientRecord.findUnique({ where: { id } });
        if (!record || (record.doctorId && record.doctorId !== doctorId)) {
            return { success: false, error: "Não autorizado." };
        }

        const updated = await (prisma.patientRecord as any).update({
            where: { id },
            data: { data: JSON.stringify(data) },
            include: { template: true }
        });
        
        revalidatePath('/');
        return { success: true, data: { ...updated, data: JSON.parse(updated.data) } };
    } catch (err) {
        console.error("Erro ao atualizar prontuário:", err);
        return { success: false, error: "Falha ao atualizar prontuário." };
    }
}
