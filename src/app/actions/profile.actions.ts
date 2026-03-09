'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getDoctorProfile() {
    try {
<<<<<<< HEAD
        const { getLoggedUserId } = await import('@/app/actions/auth.actions');
        const doctorId = await getLoggedUserId();
        if (!doctorId) return null;

        const profile = await prisma.doctorProfile.findUnique({ where: { id: doctorId } });
        return profile || null;
=======
        const profile = await prisma.doctorProfile.findFirst();
        return profile || { fullName: '', crm: '', specialty: '', signatureAlign: 'center', showLogoText: true, role: 'doctor', aiModel: 'gemini-1.5-flash', language: 'pt' };
>>>>>>> a20460f2f415855354f0003124980c0dcf8bfced
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
<<<<<<< HEAD
    language?: string,
    avatarUrl?: string | null,
    signatureImage?: string | null
=======
    language?: string
>>>>>>> a20460f2f415855354f0003124980c0dcf8bfced
}) {
    try {
        const { getLoggedUserId } = await import('@/app/actions/auth.actions');
        const doctorId = await getLoggedUserId();
        if (!doctorId) return { success: false, error: "Não autenticado." };

<<<<<<< HEAD
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
=======
        if (existing) {
            await prisma.doctorProfile.update({
                where: { id: existing.id },
                data: {
                    fullName: data.fullName,
                    crm: data.crm,
                    specialty: data.specialty,
                    signatureAlign: data.signatureAlign,
                    showLogoText: data.showLogoText,
                    role: data.role,
                    aiModel: data.aiModel,
                    language: data.language
                }
            });
        } else {
            await prisma.doctorProfile.create({
                data: {
                    fullName: data.fullName,
                    crm: data.crm,
                    specialty: data.specialty,
                    signatureAlign: data.signatureAlign,
                    showLogoText: data.showLogoText,
                    role: data.role || 'doctor',
                    aiModel: data.aiModel || 'gemini-1.5-flash',
                    language: data.language || 'pt'
                }
            });
>>>>>>> a20460f2f415855354f0003124980c0dcf8bfced
        }

        revalidatePath('/');
        return { success: true };
    } catch (err) {
        console.error("Erro ao salvar perfil do médico:", err);
        return { success: false, error: "Falha ao gravar configurações." };
    }
}
