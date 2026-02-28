'use server';

import prisma from '@/lib/prisma';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

/**
 * Interface para representar o Request de Geração de Anamnese
 */
interface GenerateAnamnesisRequest {
    transcription: string;
    templateId: string;
    patientName: string;
}

/**
 * Função principal chamada pelo frontend (Client Component) que roda no servidor de forma segura,
 * protegendo as chaves de API.
 */
export async function generateAnamnesis(data: GenerateAnamnesisRequest) {
    try {
        const { transcription, templateId, patientName } = data;

        // 1 - Validação e Security Audit (Dados de saúde)
        const sanitizedTranscription = patientName
            ? transcription.replace(new RegExp(patientName, 'gi'), '[NOME DO PACIENTE]')
            : transcription;

        // 2 - Fallback Automático de Modelos IA
        const fallbackModels = [
            'gemini-2.5-flash',
            'gemini-2.0-flash',
            'gemini-1.5-flash-latest',
            'gemini-2.5-flash-lite',
            'gemini-pro-latest'
        ];

        // 2 - Resgatar o template escolhido do DB Prisma
        const template = await prisma.template.findUnique({ where: { id: templateId } });

        if (!template || !template.schema) {
            throw new Error("Template de anamnese não encontrado no banco de dados.");
        }

        const templateSchema: any = typeof template.schema === 'string'
            ? JSON.parse(template.schema)
            : template.schema;

        const dynamicProperties: Record<string, any> = {};
        const requiredFields: string[] = [];
        let expectedFormatStr = "";

        const sanitizeKey = (k: string) => k.replace(/[^a-zA-Z0-9_]/g, '_');

        templateSchema.fields.forEach((field: any) => {
            const safeKey = sanitizeKey(field.id);
            dynamicProperties[safeKey] = { type: SchemaType.STRING, description: field.label || '' };
            requiredFields.push(safeKey);
            expectedFormatStr += `- "${safeKey}": string (Extrair a informação: ${field.label || 'Vazio'})\n`;
        });

        dynamicProperties["cid_sugerido"] = { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Lista de referências CID 10 extraídas se aplicável." };
        requiredFields.push("cid_sugerido");
        expectedFormatStr += `- "cid_sugerido": array de strings\n`;

        // 3 - Construção do System Prompt Médico Especializado
        const systemInstruction = `
Você é um Assistente Médico Especialista em Documentação Clínica.
Sua função é ler a transcrição de uma consulta médica (frequentemente com erros de fala) e estruturar rigorosamente as informações no formato SOAP ou de acordo com as diretrizes da especialidade médica.

INDIRETRIZES:
- Extraia apenas fatos clínicos presentes no texto. Não invente sintomas.
- Se uma informação vital faltar baseada na transcrição, preencha com "Não relatado".
- Se houver negação clínica (ex: 'nega febre'), deixe isso explícito.
- Adapte-se estritamente às chaves abaixo solicitadas pelo modelo médico:

CHAVES ESPERADAS NO JSON OBRIGATÓRIAS:
${expectedFormatStr}
`;

        console.log("--- REQUESTING GEMINI API ---");
        console.log("User Input:", sanitizedTranscription);

        // 4 - Chamada à API Real do Google Gemini
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("A chave GEMINI_API_KEY não foi configurada no ambiente (.env).");
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        let responseText = "";
        let attemptSuccess = false;

        const prompt = `Analise a transcrição a seguir e extraia o arquivo JSON esperado:\n\n${sanitizedTranscription}`;
        console.log("--- TEXTO ENVIADO (PROMPT) ---");
        console.log(sanitizedTranscription);

        // 5 - Tentar processar com os modelos da fila até dar certo
        for (const modelName of fallbackModels) {
            console.log(`--- TENTANDO MODELO: ${modelName} ---`);
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: systemInstruction,
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: SchemaType.OBJECT,
                            properties: dynamicProperties,
                            required: requiredFields
                        }
                    }
                });

                const result = await model.generateContent(prompt);
                responseText = result.response.text();

                console.log(`--- SUCESSO NO MODELO: ${modelName} ---`);
                console.log("--- JSON GERADO PELA IA ---");
                console.log(responseText);

                attemptSuccess = true;
                break; // Se funcionou, corta o loop for

            } catch (apiError: any) {
                console.warn(`[WARN] Falha no modelo ${modelName}:`, apiError.message);
                // Continua proximo iteração
            }
        }

        if (!attemptSuccess) {
            console.error("--- TODOS OS MODELOS FALHARAM ---");
            throw new Error("Nossa Orquestração de IA falhou. Nenhuma máquina do cluster respondeu. Tente novamente em alguns minutos.");
        }

        let mockAiResponse: Record<string, any> = {};
        try {
            mockAiResponse = JSON.parse(responseText || "{}");
        } catch (parseError) {
            console.error("Erro ao analisar JSON retornado. O modelo pode ter alucinado texto fora do padrão JSON:", responseText);
            throw new Error("A IA devolveu um formato inválido. Tente falar mais pausadamente.");
        }

        // Fazer map reverso pro ID original do formulário
        const finalResponse: Record<string, any> = {};
        templateSchema.fields.forEach((field: any) => {
            finalResponse[field.id] = mockAiResponse[sanitizeKey(field.id)] || mockAiResponse[field.id] || "";
        });
        finalResponse["cid_sugerido"] = mockAiResponse["cid_sugerido"] || [];

        console.log("✅ Dados da IA interceptados com sucesso e devolvidos para a tela");

        // 6 - Retornar dados estruturados para a UI
        return {
            success: true,
            message: "Anamnese processada com sucesso.",
            data: finalResponse
        };

    } catch (error: any) {
        console.error("Erro fatal ao gerar anamnese", error);
        return {
            success: false,
            error: error?.message || "Falha ao processar informações da clínica.",
        };
    }
}
