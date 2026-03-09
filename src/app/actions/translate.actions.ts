'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from '@/lib/prisma';

export async function translateTemplateSchema(templateId: string, targetLanguage: string) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("A chave GEMINI_API_KEY não foi configurada.");
        }

        const template = await prisma.template.findUnique({
            where: { id: templateId }
        });

        if (!template) {
            throw new Error("Template não encontrado.");
        }

        // Se a tradução já existir no cache (translations), retorna
        let translationsCache: any = {};
        if ((template as any).translations) {
            try {
                translationsCache = JSON.parse((template as any).translations);
            } catch (e) { }
        }

        if (translationsCache[targetLanguage]) {
            return { success: true, translations: translationsCache[targetLanguage] };
        }

        const schema = JSON.parse(template.schema);

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
Você é um tradutor médico especializado. 
Traduza os labels e options (se houver) deste schema de formulário clínico para o idioma: ${targetLanguage === 'en' ? 'Inglês' : targetLanguage === 'es' ? 'Espanhol' : targetLanguage}.

Schema original:
${JSON.stringify(schema, null, 2)}

RETORNE APENAS UM JSON VÁLIDO no seguinte formato de dicionário, onde a chave é o ID do campo e o valor é o label traduzido. Se o campo tiver options, retorne as traduções na mesma ordem separadas por vírgula.
Exemplo:
{
  "queixa-principal": "Chief Complaint",
  "dor": "Pain Level",
  "dor-options": "Mild, Moderate, Severe"
}

Não use markdown como \`\`\`json. Retorne APENAS as chaves.
`;

        const result = await model.generateContent(prompt);
        let responseText = result.response.text().trim();

        // Remove delimitadores de markdown se houver
        if (responseText.startsWith("```json")) {
            responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        } else if (responseText.startsWith("```")) {
            responseText = responseText.replace(/```/g, "").trim();
        }

        const translatedDict = JSON.parse(responseText || "{}");

        // Atualiza o cache no banco de dados
        translationsCache[targetLanguage] = translatedDict;
        await prisma.template.update({
            where: { id: templateId },
            data: { translations: JSON.stringify(translationsCache) } as any
        });

        return { success: true, translations: translatedDict };

    } catch (error: any) {
        console.error("Erro na tradução do template:", error);
        return { success: false, error: error.message };
    }
}
