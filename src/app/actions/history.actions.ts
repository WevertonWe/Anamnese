'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { encryptDeterministic, decryptDeterministic, sanitizeObj } from '@/lib/security';

/**
 * Obtém a listagem completa (History) decodificada e sanitizada de todos os prontuários recentes
 * atrelados ao profissional autenticado atualmente.
 * 
 * @returns Array de prontuários com nomes (pacientes) revertidos da criptografia para exibição textual em tela.
 */
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
            patientName: decryptDeterministic(r.patientName),
            data: typeof r.data === 'string' ? JSON.parse(r.data) : r.data
        }));
    } catch (err) {
        console.error("Erro ao puxar histórico do banco:", err);
        return [];
    }
}

/**
 * Exclui permanentemente o registro clínico no banco desde que este pertença ao médico solicitante.
 * 
 * @param id O UUID relacional do resgitro de paciente a ser removido.
 * @returns Status de sucesso ou mensagem de falha/fraude.
 */
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

/**
 * Insere um novo registro de anamnese manual ou guiado pela IA.
 * Executa interceptação cirúrgica: Cifra o nome do paciente com AES Determinístico
 * e filtra ataques do tipo script injection oriundos das caixas de texto abertas.
 * 
 * @param data Pacote contendo identificação, ID do template base e payload puro preenchido.
 * @returns O próprio registro recém-salvo agora com a estrutura sanitizada.
 */
export async function saveRecord(data: { patientName: string; templateId: string; date?: string; data: any }) {
    try {
        const { getLoggedUserId } = await import('@/app/actions/auth.actions');
        const doctorId = await getLoggedUserId();

        const encryptedPatientName = encryptDeterministic(data.patientName || "Paciente Não Identificado");
        const sanitizedData = sanitizeObj(data.data);

        const newRecord = await (prisma.patientRecord as any).create({
            data: {
                patientName: encryptedPatientName,
                templateId: data.templateId,
                doctorId: doctorId || undefined,
                date: data.date ? new Date(data.date) : new Date(),
                data: JSON.stringify(sanitizedData)
            },
            include: { template: true }
        });

        revalidatePath('/');

        return {
            success: true,
            data: {
                ...newRecord,
                patientName: decryptDeterministic(newRecord.patientName),
                data: JSON.parse(newRecord.data) // Return parsed
            }
        };
    } catch (err) {
        console.error("Erro ao salvar registro manual:", err);
        return { success: false, error: "Falha ao salvar prontuário." };
    }
}

/**
 * Procura nos arquivos os dois registros mais recentes de um paciente homônimo para alimentar
 * o histórico relacional e subsidiar cálculos evolutivos da IA como IMC e curvas ponderais.
 * 
 * @param patientName O string exato fornecido (antes de encriptar) do nome do alvo.
 * @returns Um texto formatado com compilações vitais contendo "Condutas Anteriores" ou Null caso primeiro acesso histórico.
 */
export async function getRecentPatientHistory(patientName: string) {
    if (!patientName || patientName.trim() === '') return null;

    try {
        const encryptedName = encryptDeterministic(patientName);

        const records = await prisma.patientRecord.findMany({
            where: { patientName: { equals: encryptedName } },
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

/**
 * Cria o esqueleto de um questionário em aguardo e devolve a URL remota de autoatendimento (Link Mágico)
 * para preenchimento domiciliar pelo próprio paciente.
 * 
 * @param patientName Nome visível do paciente para associar ao esqueleto vazio.
 * @param templateId Identificador do modelo base (Cardio, Odonto, Geral...) a ser carregado remotamente.
 * @returns String formatada do link para envio via WhatsApp ou E-mail.
 */
export async function generateRemoteLink(patientName: string, templateId: string) {
    try {
        const { getLoggedUserId } = await import('@/app/actions/auth.actions');
        const doctorId = await getLoggedUserId();

        const encryptedPatientName = encryptDeterministic(patientName || "Não Identificado");

        const newRecord = await prisma.patientRecord.create({
            data: {
                patientName: encryptedPatientName,
                templateId,
                doctorId: doctorId || undefined,
                status: 'PENDING',
                data: "{}"
            }
        });

        revalidatePath('/');
        const link = `http://localhost:3000/anamnese/${newRecord.id}`;
        console.log(`[HistoryAction] Link Remoto Gerado para patient_id=${newRecord.id}, link=${link}`);
        // Ideal is to use env var for URL, using localhost for request
        return { success: true, link };
    } catch(e) {
        console.error(`[HistoryAction] Erro ao gerar link remto:`, e);
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
        
        const returnObj = JSON.parse(JSON.stringify(record));
        returnObj.patientName = decryptDeterministic(returnObj.patientName);
        return returnObj;
    } catch(e) { return null; }
}

export async function submitRemoteForm(slug: string, data: any) {
    try {
       const sanitizedData = sanitizeObj(data);
       await prisma.patientRecord.update({
           where: { id: slug },
           data: {
               data: JSON.stringify(sanitizedData),
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

        const sanitizedData = sanitizeObj(data);

        const updated = await (prisma.patientRecord as any).update({
            where: { id },
            data: { data: JSON.stringify(sanitizedData) },
            include: { template: true }
        });
        
        revalidatePath('/');
        return { success: true, data: { ...updated, patientName: decryptDeterministic(updated.patientName), data: JSON.parse(updated.data) } };
    } catch (err) {
        console.error("Erro ao atualizar prontuário:", err);
        return { success: false, error: "Falha ao atualizar prontuário." };
    }
}
