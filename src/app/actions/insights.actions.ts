'use server';

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import prisma from '@/lib/prisma';

interface InsightsRequest {
    formData: Record<string, string>;
    templateId: string;
}

export async function getClinicalInsights(data: InsightsRequest) {
    try {
        const { formData, templateId } = data;

        if (!process.env.GEMINI_API_KEY) {
            throw new Error("A chave GEMINI_API_KEY não foi configurada.");
        }

        const template = await prisma.template.findUnique({ where: { id: templateId } });
        const templateName = template?.name || 'Geral';

        // Build a clinical summary from form data
        const clinicalSummary = Object.entries(formData)
            .filter(([k]) => !['patient_name_extracted', 'consult_date_extracted', 'cid_sugerido', 'hipotese_diagnostica', 'conduta_sugerida', 'observacoes_gerais'].includes(k))
            .map(([k, v]) => `${k}: ${v}`)
            .join('\n');

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const fallbackModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash-latest'];

        const systemInstruction = `
Você é um Assistente Médico Especialista em Diagnóstico Clínico.
Dada uma anamnese estruturada de um paciente (template: ${templateName}), sua função é:
1. Sugerir códigos CID-10 aplicáveis baseados nos sintomas relatados.
2. Formular uma Hipótese Diagnóstica concisa e fundamentada.
3. Sugerir uma Conduta clínica (exames, prescrições, encaminhamentos).

Baseie-se SOMENTE nos dados fornecidos. Se não houver informação suficiente, indique "Dados insuficientes para determinar".
`;

        const prompt = `Analise a seguinte anamnese e gere os insights clínicos:\n\n${clinicalSummary}`;

        let responseText = "";
        let attemptSuccess = false;

        for (const modelName of fallbackModels) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction,
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: SchemaType.OBJECT,
                            properties: {
                                cid_sugerido: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Códigos CID-10 sugeridos" },
                                hipotese_diagnostica: { type: SchemaType.STRING, description: "Hipótese diagnóstica baseada nos sintomas" },
                                conduta_sugerida: { type: SchemaType.STRING, description: "Conduta clínica sugerida" }
                            },
                            required: ["cid_sugerido", "hipotese_diagnostica", "conduta_sugerida"]
                        }
                    }
                });

                const result = await model.generateContent(prompt);
                responseText = result.response.text();
                attemptSuccess = true;
                break;
            } catch {
                console.warn(`[WARN] Insights failed on ${modelName}`);
            }
        }

        if (!attemptSuccess) {
            throw new Error("Nenhum modelo de IA disponível para gerar insights.");
        }

        const insights = JSON.parse(responseText || "{}");
        return { success: true, data: insights };

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        console.error("Error generating insights:", message);
        return { success: false, error: message };
    }
}
