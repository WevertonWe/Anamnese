'use server';

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import OpenAI from "openai";

interface GenerateTemplateRequest {
    specialty: string;
}

export async function generateTemplateStructure(data: GenerateTemplateRequest) {
    const { specialty } = data;

    // Model Lists
    const geminiModels = ['gemini-3-flash', 'gemini-3.1-flash-lite', 'gemini-2.5-flash'];
    const openaiModels = ['gpt-4o', 'gpt-3.5-turbo'];

    const systemInstruction = `
Você é um especialista em documentação clínica e estruturação de prontuários médicos.
A sua função é gerar a estrutura ideal de um formulário de anamnese para uma especialidade médica específica.
Retorne um JSON contendo o nome sugerido para o template, uma descrição curta, uma lista de campos de formulário (fields) e um objeto de traduções (translations).
Cada campo deve ter "id" (kebab-case), "label" (Título do campo em PT-BR), e "type" (textarea, text, radio, checkbox, date).
Se o tipo for "radio" ou "checkbox", você DEVE incluir a propriedade "options" com um array de strings contendo as alternativas de múltipla escolha.
Obrigatório incluir: Queixa Principal, HMA, História Patológica e Exame Físico. Adapte o restante para ser focado na especialidade solicitada.

As traduções devem ser fornecidas no objeto "translations" contendo chaves para "en" (Inglês) e "es" (Espanhol). Cada um desses objetos deve mapear o "id" do campo para a sua tradução. Se houver options, mapeie as traduções na respectiva ordem separadas por vírgula na chave "id-options".
`;

    const prompt = `Gere a estrutura de um formulário de anamnese para a especialidade ou contexto clínico: ${specialty}`;

    let lastError: any = null;

    // --- TRY GEMINI FIRST ---
    if (process.env.GEMINI_API_KEY) {
        const partialKey = process.env.GEMINI_API_KEY.slice(0, 6) + "..." + process.env.GEMINI_API_KEY.slice(-4);
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        for (const modelName of geminiModels) {
            try {
                console.info(`[AI] Attempting Gemini | Model: ${modelName} | Key: ${partialKey}`);
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: systemInstruction,
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: SchemaType.OBJECT,
                            properties: {
                                templateName: { type: SchemaType.STRING },
                                description: { type: SchemaType.STRING },
                                fields: {
                                    type: SchemaType.ARRAY,
                                    items: {
                                        type: SchemaType.OBJECT,
                                        properties: {
                                            id: { type: SchemaType.STRING },
                                            label: { type: SchemaType.STRING },
                                            type: { type: SchemaType.STRING },
                                            options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
                                        },
                                        required: ["id", "label", "type"]
                                    }
                                },
                                translations: { type: SchemaType.STRING }
                            },
                            required: ["templateName", "description", "fields"]
                        }
                    }
                });

                const result = await model.generateContent(prompt);
                const text = result.response.text();
                console.info(`🚀 Sistema migrado para a Geração 3 do Gemini. Template gerado com sucesso usando ${modelName}`);
                return { success: true, data: parseAiResponse(text) };

            } catch (err: any) {
                lastError = err;
                const status = err?.status || err?.response?.status;
                console.warn(`[WARN] Gemini ${modelName} failed. Status: ${status}`);
                if (status === 401 || status === 403) {
                    console.error("[CRITICAL] Gemini API Key invalid or restricted.");
                    break; // Skip other Gemini models if key is bad
                }
            }
        }
    }

    // --- FALLBACK TO OPENAI ---
    if (process.env.OPENAI_API_KEY) {
        const partialKey = process.env.OPENAI_API_KEY.slice(0, 6) + "..." + process.env.OPENAI_API_KEY.slice(-4);
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        for (const modelName of openaiModels) {
            try {
                console.info(`[AI] Falling back to OpenAI | Model: ${modelName} | Key: ${partialKey}`);
                const response = await openai.chat.completions.create({
                    model: modelName,
                    messages: [
                        { role: "system", content: systemInstruction },
                        { role: "user", content: prompt }
                    ],
                    response_format: { type: "json_object" }
                });

                const text = response.choices[0].message.content || "{}";
                return { success: true, data: parseAiResponse(text) };

            } catch (err: any) {
                lastError = err;
                const status = err?.status || err?.response?.status;
                console.warn(`[WARN] OpenAI ${modelName} failed. Status: ${status}`);
                if (status === 401) {
                    console.error("[CRITICAL] OpenAI API Key invalid.");
                    break;
                }
            }
        }
    }

    return {
        success: false,
        error: "Nenhum modelo de IA disponível (Gemini/OpenAI). Verifique as chaves e limites de cota.",
        details: lastError?.message
    };
}

function parseAiResponse(text: string) {
    try {
        const data = JSON.parse(text);
        if (data.translations && typeof data.translations === 'string') {
            try {
                data.translations = JSON.parse(data.translations);
            } catch (e) {
                console.warn("Could not parse returned translations JSON string");
            }
        }
        return data;
    } catch (e) {
        console.error("AI Response Parse Error:", e);
        return {};
    }
}
