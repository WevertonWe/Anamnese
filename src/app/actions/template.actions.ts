'use server';

import prisma from '@/lib/prisma';

export async function getTemplates() {
    try {
        const { getLoggedUserId } = await import('@/app/actions/auth.actions');
        const doctorId = await getLoggedUserId();

        const dbTemplates = await prisma.template.findMany({
            where: {
                OR: [
                    { isDefault: true },
                    ...(doctorId ? [{ doctorId }] : [])
                ]
            },
            orderBy: { createdAt: 'desc' }
        });

        // Parse the SQLite String back into a JSON Object
        return dbTemplates.map(t => ({
            ...t,
            schema: typeof t.schema === 'string' ? JSON.parse(t.schema) : t.schema
        }));
    } catch (err) {
        console.error("Erro ao puxar templates do banco:", err);
        return [];
    }
}

export async function createTemplate(data: { name: string, description: string, fields: any[], translations?: any }) {
    try {
        const { getLoggedUserId } = await import('@/app/actions/auth.actions');
        const doctorId = await getLoggedUserId();

        const payload: any = {
            name: data.name,
            description: data.description,
            schema: JSON.stringify({ fields: data.fields }),
            isDefault: false,
            doctorId: doctorId || undefined
        };

        if (data.translations) {
            payload.translations = JSON.stringify(data.translations);
        }

        const newTemplate = await prisma.template.create({
            data: payload
        });
        return { success: true, data: newTemplate };
    } catch (err) {
        console.error("Erro ao criar template:", err);
        return { success: false, error: "Falha ao gravar template no banco." };
    }
}

export async function deleteTemplate(id: string) {
    try {
        const { getLoggedUserId } = await import('@/app/actions/auth.actions');
        const doctorId = await getLoggedUserId();

        const template = await prisma.template.findUnique({ where: { id } });
        if (!template) return { success: false, error: "Template não encontrado." };

        // Guarda de segurança: impedir exclusão de template de outro médico
        if (template.doctorId && template.doctorId !== doctorId) {
            return { success: false, error: "Não autorizado." };
        }

        await prisma.template.delete({ where: { id } });
        return { success: true };
    } catch (err) {
        console.error("Erro ao deletar template:", err);
        return { success: false, error: "Falha ao excluir template." };
    }
}
