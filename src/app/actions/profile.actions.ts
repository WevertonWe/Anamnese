'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getDoctorProfile() {
    try {
        const { getLoggedUserId } = await import('@/app/actions/auth.actions');
        const doctorId = await getLoggedUserId();
        if (!doctorId) return null;

        const profile = await prisma.doctorProfile.findUnique({ where: { id: doctorId } });
        return profile || null;
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
    signatureImage?: string | null
}) {
    try {
        const { getLoggedUserId } = await import('@/app/actions/auth.actions');
        const doctorId = await getLoggedUserId();
        if (!doctorId) return { success: false, error: "Não autenticado." };

        await prisma.doctorProfile.update({
            where: { id: doctorId },
            data: {
                fullName: data.fullName,
                crm: data.crm,
                specialty: data.specialty,
                signatureAlign: data.signatureAlign,
                showLogoText: data.showLogoText,
                role: data.role,
                aiModel: data.aiModel,
                language: data.language,
                avatarUrl: data.avatarUrl,
                signatureImage: (data as any).signatureImage
            }
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
