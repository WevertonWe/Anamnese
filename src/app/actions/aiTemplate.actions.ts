'use server';

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

interface GenerateTemplateRequest {
    specialty: string;
}

export async function generateTemplateStructure(data: GenerateTemplateRequest) {
    try {
        const { specialty } = data;

        if (!process.env.GEMINI_API_KEY) {
            throw new Error("A chave GEMINI_API_KEY não foi configurada.");
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const fallbackModels = [
            'gemini-2.5-flash',
            'gemini-2.0-flash',
            'gemini-1.5-flash-latest',
        ];

        const systemInstruction = `
Você é um especialista em documentação clínica e estruturação de prontuários médicos.
A sua função é gerar a estrutura ideal de um formulário de anamnese para uma especialidade médica específica.
Retorne um JSON contendo o nome sugerido para o template, uma descrição curta, uma lista de campos de formulário (fields) e um objeto de traduções (translations).
Cada campo deve ter "id" (kebab-case), "label" (Título do campo em PT-BR), e "type" (textarea, text, radio, checkbox, date).
Se o tipo for "radio" ou "checkbox", você DEVE incluir a propriedade "options" com um array de strings contendo as alternativas de múltipla escolha.
Obrigatório incluir: Queixa Principal, HMA, História Patológica e Exame Físico. Adapte o restante para ser focado na especialidade solicitada.

As traduções devem ser forncidas no objeto "translations" contendo chaves para "en" (Inglês) e "es" (Espanhol). Cada um desses objetos deve mapear o "id" do campo para a sua tradução. Se houver options, mapeie as traduções na respectiva ordem separadas por vírgula na chave "id-options" ou traduza cada option caso prefira, mas a Action do site usa "id-options".
Exemplo de translations:
{
  "en": { "hda": "History of Present Illness", "dor-options": "Mild, Moderate, Severe" },
  "es": { "hda": "Historia de la Enfermedad Actual", "dor-options": "Leve, Moderado, Severo" }
}
`;

        const prompt = `Gere a estrutura de um formulário de anamnese para a especialidade ou contexto clínico: ${specialty}`;

        let responseText = "";
        let attemptSuccess = false;

        for (const modelName of fallbackModels) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: systemInstruction,
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: SchemaType.OBJECT,
                            properties: {
                                templateName: { type: SchemaType.STRING, description: "Nome curto do template" },
                                description: { type: SchemaType.STRING, description: "Descrição do propósito do template" },
                                fields: {
                                    type: SchemaType.ARRAY,
                                    items: {
                                        type: SchemaType.OBJECT,
                                        properties: {
                                            id: { type: SchemaType.STRING },
                                            label: { type: SchemaType.STRING },
                                            type: { type: SchemaType.STRING, description: "'text', 'textarea', 'radio', 'checkbox' ou 'date'" },
                                            options: {
                                                type: SchemaType.ARRAY,
                                                items: { type: SchemaType.STRING },
                                                description: "Obrigatório se type for radio ou checkbox"
                                            }
                                        },
                                        required: ["id", "label", "type"]
                                    }
                                },
                                translations: {
                                    type: SchemaType.STRING,
                                    description: "Objeto JSON serializado como STRING contendo os dicionários de tradução para 'en' e 'es'."
                                }
                            },
                            required: ["templateName", "description", "fields"]
                        }
                    }
                });

                const result = await model.generateContent(prompt);
                responseText = result.response.text();
                attemptSuccess = true;
                break;
            } catch (err) {
                console.warn(`[WARN] AI Template generation failed on ${modelName}`);
            }
        }

        if (!attemptSuccess) {
            throw new Error("Nenhum modelo de IA esteve disponível para gerar o template.");
        }

        const templateData = JSON.parse(responseText || "{}");
        if (templateData.translations && typeof templateData.translations === 'string') {
            try {
                templateData.translations = JSON.parse(templateData.translations);
            } catch (e) {
                console.warn("Could not parse returned translations JSON string");
            }
        }

        return { success: true, data: templateData };

    } catch (error: any) {
        console.error("Error generating template AI:", error);
        return { success: false, error: error.message || "Erro desconhecido na geração com IA." };
    }
}
