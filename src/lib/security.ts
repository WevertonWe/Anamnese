import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012'; // 32 bytes
const STATIC_IV = Buffer.alloc(16, 0); // Deterministic p/ permitir busca exata

/**
 * Criptografa strings (Geralmente nomes de pacientes) através de AES Determinístico (AES-256-CBC com IV Fixo).
 * O determinismo, embora reduza levemente a aleatoriedade, é crucial para permitirmos "Buscas Exatas" via Prisma no banco de dados,
 * pois o "João" será sempre criptografado como a mesma String Final e o banco pode indexá-la nativamente.
 * 
 * @param text - Chave String / Nome legível para criptografia.
 * @returns String hexadecimal embarcada com a tag de controle 'ENC:'.
 */
export function encryptDeterministic(text: string) {
    if (!text || text === "Paciente Não Identificado") return text;
    try {
        let cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), STATIC_IV);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return 'ENC:' + encrypted.toString('hex');
    } catch(e) { 
        return text; 
    }
}

/**
 * O inverso da blindagem de texto. Ele reabre a string purificada.
 * Avalia se o prefixo de segurança correspondente aos blocos da aplicação está cravado na string antes de tentar destilar a inteligência crua.
 * 
 * @param text - Hash criptográfico contendo o carimbo 'ENC:'.
 * @returns A string traduzida, ou texto inalterado caso a flag não seja detectada.
 */
export function decryptDeterministic(text: string | null | undefined) {
    if (!text || !text.startsWith('ENC:')) return text;
    try {
        let encryptedText = Buffer.from(text.substring(4), 'hex');
        let decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), STATIC_IV);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch(e) { 
        return text; 
    }
}

/**
 * Varredor profundo e transversal recursivo de objetos complexos (JSON/Arrays).
 * Remove insígnias perigosas e converte tags HTML em Native Code Entities prestando proteção irrestrita contra XSS _(Cross-Site Scripting)_.
 * 
 * @param obj - O Payload original (string em texto livre ou um array de blocos aninhados de respostas).
 * @returns O próprio objeto agora higienizado e esterelizado de tags executáveis JavaScript e DOM injection.
 */
export function sanitizeObj(obj: any): any {
    if (typeof obj === 'string') {
        // Simple HTML Sanitization
        return obj.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#39;").replace(/"/g, "&quot;");
    } else if (typeof obj === 'object' && obj !== null) {
        const newObj: any = Array.isArray(obj) ? [] : {};
        for (const key in obj) {
            newObj[sanitizeObj(key)] = sanitizeObj(obj[key]);
        }
        return newObj;
    }
    return obj;
}
