'use server';

import prisma from '@/lib/prisma';

export async function getTemplates() {
    try {
        const dbTemplates = await prisma.template.findMany({
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
        const payload: any = {
            name: data.name,
            description: data.description,
            schema: JSON.stringify({ fields: data.fields }),
            isDefault: false
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
        const template = await prisma.template.findUnique({ where: { id } });
        if (!template) return { success: false, error: "Template não encontrado." };
        if (template.isDefault) return { success: false, error: "Templates padrão não podem ser deletados." };

        await prisma.template.delete({ where: { id } });
        return { success: true };
    } catch (err) {
        console.error("Erro ao deletar template:", err);
        return { success: false, error: "Falha ao excluir template." };
    }
}
