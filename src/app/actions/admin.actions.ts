'use server';

import prisma from '@/lib/prisma';
import { getLoggedUserId } from './auth.actions';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase-client';

export async function getAdminDashStats() {
    const adminId = await getLoggedUserId();
    if (!adminId) throw new Error("Não autorizado");

    const totalDoctors = await prisma.doctorProfile.count();
    const activeSubs = await prisma.doctorProfile.count({
        where: { 
            status: 'ACTIVE',
            OR: [
                { subscriptionExpiresAt: null },
                { subscriptionExpiresAt: { gt: new Date() } }
            ]
        }
    });

    // Mensalidades vencidas: status ACTIVE mas com expiration data no passado
    const now = new Date();
    const expiredSubs = await prisma.doctorProfile.count({
        where: {
            status: 'ACTIVE',
            subscriptionExpiresAt: { lte: now }
        }
    });

    return { totalDoctors, activeSubs, expiredSubs };
}

export async function getDoctorsList(search: string = "", status: string = "ALL") {
    const adminId = await getLoggedUserId();
    if (!adminId) throw new Error("Não autorizado");

    const query: any = {};
    
    if (search) {
        query.OR = [
            { fullName: { contains: search, mode: 'insensitive' } },
            { crm: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
        ];
    }

    if (status !== "ALL") {
        query.status = status;
    }

    const doctors = await prisma.doctorProfile.findMany({
        where: query,
        select: {
            id: true,
            fullName: true,
            crm: true,
            email: true,
            status: true,
            lastLoginAt: true,
            subscriptionExpiresAt: true,
            subscriptionValue: true,
            createdById: true,
            deletedAt: true
        },
        orderBy: { updatedAt: 'desc' }
    });

    return doctors.map(doc => ({
        ...doc,
        subscriptionValue: Number(doc?.subscriptionValue) || 0
    }));
}

export async function updateDoctorStatus(id: string, newStatus: 'ACTIVE' | 'BLOCKED') {
    const adminId = await getLoggedUserId();
    if (!adminId) throw new Error("Não autorizado");

    await prisma.doctorProfile.update({
        where: { id },
        data: { status: newStatus }
    });

    return { success: true };
}

export async function archiveDoctorProfile(id: string, isRestore = false) {
    const adminId = await getLoggedUserId();
    if (!adminId) throw new Error("Não autorizado");

    await prisma.doctorProfile.update({
        where: { id },
        data: { 
            deletedAt: isRestore ? null : new Date(),
            status: isRestore ? 'ACTIVE' : 'BLOCKED'
        }
    });

    return { success: true };
}

export async function updateDoctorSubscription(id: string, value: number, expiresAt: Date | null) {
    const adminId = await getLoggedUserId();
    if (!adminId) throw new Error("Não autorizado");

    await prisma.doctorProfile.update({
        where: { id },
        data: { 
            subscriptionValue: value,
            subscriptionExpiresAt: expiresAt
        }
    });

    return { success: true };
}

// Helpers para upload de base64 via Supabase Storage
async function uploadBase64ToStorage(base64String: string, path: string) {
    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) throw new Error('Input string não é um base64 válido');
    
    const contentType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    
    const { error } = await supabase.storage
        .from('doctors-branding')
        .upload(path, buffer, {
            contentType,
            upsert: true
        });
        
    if (error) throw error;
    
    const { data: publicData } = supabase.storage
        .from('doctors-branding')
        .getPublicUrl(path);
        
    return publicData.publicUrl;
}

export async function createDoctorWithBranding(data: {
    fullName: string;
    crm: string;
    specialty: string;
    email: string;
    subscriptionValue: number;
    subscriptionExpiresAt?: Date | null;
    logoBase64?: string | null;
    signatureBase64?: string | null;
}) {
    const adminId = await getLoggedUserId();
    if (!adminId) throw new Error("Não autorizado");

    // Validar se email já existe
    const existing = await prisma.doctorProfile.findUnique({ where: { email: data.email } });
    if (existing) {
        return { success: false, error: "Este email já está cadastrado." };
    }

    // Gerar senha dinamicamente: PrimeiroNome#4Digitos
    const firstName = data.fullName.split(' ')[0].replace(/[^a-zA-Z]/g, '');
    const randomChars = Math.random().toString(36).substring(2, 6);
    const generatedPassword = `${firstName}#${randomChars}`;
    const passwordHash = await bcrypt.hash(generatedPassword, 10);

    let logoUrl = null;
    let signatureImage = null;

    // Fazer UPLOAD para Supabase
    try {
        const timestamp = Date.now();
        if (data.logoBase64) {
            const path = `logos/${adminId}_${timestamp}_logo.png`;
            logoUrl = await uploadBase64ToStorage(data.logoBase64, path);
        }
        if (data.signatureBase64) {
            const path = `signatures/${adminId}_${timestamp}_sign.png`;
            signatureImage = await uploadBase64ToStorage(data.signatureBase64, path);
        }
    } catch (err) {
        console.error("Erro no upload do Storage:", err);
        return { success: false, error: "Falha ao processar imagens no Storage." };
    }

    // Criar perfil no Prisma
    await prisma.doctorProfile.create({
        data: {
            fullName: data.fullName,
            crm: data.crm,
            specialty: data.specialty,
            email: data.email,
            passwordHash,
            subscriptionValue: data.subscriptionValue,
            subscriptionExpiresAt: data.subscriptionExpiresAt,
            status: 'ACTIVE',
            createdById: adminId,
            logoUrl,
            signatureImage,
        }
    });

    return { 
        success: true, 
        password: generatedPassword, 
    };
}

export async function permanentDeleteDoctor(id: string) {
    const adminId = await getLoggedUserId();
    if (!adminId) throw new Error("Não autorizado");

    const doctor = await prisma.doctorProfile.findUnique({
        where: { id },
        select: { logoUrl: true, signatureImage: true }
    });

    if (!doctor) {
        return { success: false, error: "Médico não encontrado." };
    }

    let filesDeleted = 0;

    const deleteFromStorage = async (url: string | null) => {
        if (!url) return;
        try {
            const urlParts = url.split('/');
            const fileName = urlParts[urlParts.length - 1];
            const folder = url.includes('/logos/') ? 'logos' : 'signatures';
            const path = `${folder}/${fileName}`;

            const { error } = await supabase.storage
                .from('doctors-branding')
                .remove([path]);
            
            if (!error) filesDeleted++;
        } catch (e) {
            console.error("Error deleting file:", e);
        }
    };

    if (doctor.logoUrl) await deleteFromStorage(doctor.logoUrl);
    if (doctor.signatureImage) await deleteFromStorage(doctor.signatureImage);

    await prisma.doctorProfile.delete({
        where: { id }
    });

    return { success: true, filesDeleted };
}
