'use server';

import prisma from '@/lib/prisma';
import { revalidatePath, unstable_noStore } from 'next/cache';

export async function getDoctorProfile() {
    unstable_noStore();
    try {
        const { getLoggedUserId, logoutUser } = await import('@/app/actions/auth.actions');
        const doctorId = await getLoggedUserId();
        if (!doctorId) return null;

        const profile = await prisma.doctorProfile.findUnique({ where: { id: doctorId } });
        if (!profile) return null;

        // Validação contínua de Segurança
        if ((profile as any).deletedAt || profile.status === 'BLOCKED') {
            await logoutUser();
            return null;
        }

        const isSuperAdmin = profile.role === 'ADMIN';

        return {
            ...profile,
            isSuperAdmin,
            subscriptionValue: Number(profile.subscriptionValue) || 0
        };
    } catch (err) {
        return null;
    }
}

export async function saveDoctorProfile(data: {
    fullName: string,
    crm: string,
    specialty: string,
    signatureAlign?: string,
    showLogoText?: boolean,
    role?: string,
    aiModel?: string,
    language?: string,
    avatarUrl?: string | null,
    signatureImage?: string | null,
    logoUrl?: string | null,
    notificationsEnabled?: boolean
}) {
    try {
        const { getLoggedUserId } = await import('@/app/actions/auth.actions');
        const doctorId = await getLoggedUserId();
        if (!doctorId) return { success: false, error: "Não autenticado." };
            const updateData: any = {
                fullName: data.fullName,
                crm: data.crm,
                specialty: data.specialty,
                signatureAlign: data.signatureAlign,
                showLogoText: data.showLogoText,
                role: data.role as any,
                aiModel: data.aiModel,
                language: data.language,
                avatarUrl: data.avatarUrl,
            };

            if (data.signatureImage !== undefined) updateData.signatureImage = data.signatureImage;
            if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
            if ((data as any).notificationsEnabled !== undefined) updateData.notificationsEnabled = (data as any).notificationsEnabled;

            const newProfile = await (prisma.doctorProfile as any).update({
                where: { id: doctorId },
                data: updateData
            });

        if (data.language) {
            const { cookies } = await import('next/headers');
            const cookieStore = await cookies();
            cookieStore.set('NEXT_LOCALE', data.language, { path: '/', maxAge: 31536000 });
        }

        revalidatePath('/');
        return { success: true };
    } catch (err) {
        console.error("Erro ao salvar perfil do médico:", err);
        return { success: false, error: "Falha ao gravar configurações." };
    }
}
