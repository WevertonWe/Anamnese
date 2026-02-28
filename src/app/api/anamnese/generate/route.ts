import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const audioFile = formData.get('audio') as File;
        const textTransciption = formData.get('text') as string;

        if (!audioFile && !textTransciption) {
            return NextResponse.json(
                { error: 'Áudio ou texto de transcrição não fornecido' },
                { status: 400 }
            );
        }

        // TODO: Implementar Whisper / STT Web API local processando
        // Se recebemos apenas o áudio, na arquitetura final idealmente este endpoint nunca receberá o áudio
        // se optarmos por STT no cliente 100%. Mas no draft, simularemos o "preenchimento".

        const samplePromptSOAP = `
      Atue como um assistente médico especialista clínico.
      Analise a seguinte transcrição da consulta e extraia as informações no formato estruturado (SOAP - Subjetivo, Objetivo, Avaliação, Plano) 
      ou no formato do Template escolhido pelo médico.
      
      Transcrição:
      "${textTransciption || '[Áudio Recebido, simulando transcrição: Paciente refere dor de cabeça há 3 dias. Pressão aferida em 12x8.]'}"
      
      Gere um JSON com os campos correspondentes para preencher a interface.
    `;

        console.log("LLM Prompt Payload Draft:\n", samplePromptSOAP);

        // Draft response
        return NextResponse.json({
            success: true,
            message: 'Análise de anamnese gerada com sucesso (Simulação Draft)',
            data: {
                subjetivo: "Paciente relata cefaleia há 3 dias.",
                objetivo: "Pressão arterial 120/80 mmHg.",
                avaliacao: "Cefaleia tensional vs Enxaqueca episódica.",
                plano: "Prescrito analgésico e orientações de repouso.",
                cid_sugerido: ["G44.2"]
            }
        });

    } catch (error) {
        console.error("Erro na pipeline de anamnese:", error);
        return NextResponse.json(
            { error: 'Falha interna do servidor ao processar anamnese' },
            { status: 500 }
        );
    }
}
