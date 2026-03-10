'use server';

import crypto from 'crypto';
import { getLoggedUserId } from './auth.actions';

// Chave precisa ter exatamente 32 bytes para AES-256. Idealmente vir do .env
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'AnamnesePro_SaaS_Secret_Key_32bt';
const IV_LENGTH = 16;

function encryptText(text: string) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decryptText(text: string) {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

/**
 * Gera um link seguro simulando um JWT stateless, mas usando criptografia AES nativa do Node
 */
export async function generatePatientFormLink(templateId: string) {
    const doctorId = await getLoggedUserId();
    if (!doctorId) return { success: false, error: 'Não autorizado' };

    try {
        const expiresAt = Date.now() + (1000 * 60 * 60 * 24); // 24 horas
        const payload = JSON.stringify({ doctorId, templateId, exp: expiresAt });
        
        const token = encryptText(payload);
        
        // Em produção deve usar NEXT_PUBLIC_APP_URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://agendha.me';
        const link = `${baseUrl}/paciente/formulario?token=${encodeURIComponent(token)}`;

        return { success: true, link, token };
    } catch (error) {
        console.error('Erro ao gerar link de paciente:', error);
        return { success: false, error: 'Falha ao gerar link seguro' };
    }
}

/**
 * Verifica se um link de paciente ainda é válido 
 */
export async function verifyPatientFormToken(token: string) {
    try {
        const decrypted = decryptText(token);
        const data = JSON.parse(decrypted);

        if (Date.now() > data.exp) {
            return { success: false, error: 'Link expirado.' };
        }

        return { success: true, doctorId: data.doctorId, templateId: data.templateId };
    } catch (error) {
        return { success: false, error: 'Token inválido, adulterado ou expirado.' };
    }
}
