'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getDoctorProfile() {
    try {
        const profile = await prisma.doctorProfile.findFirst();
        return profile || { fullName: '', crm: '', specialty: '', signatureAlign: 'center', showLogoText: true, role: 'doctor', aiModel: 'gemini-1.5-flash' };
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
    aiModel?: string
}) {
    try {
        // Como o sistema é local/single user, verificamos se já existe um perfil
        const existing = await prisma.doctorProfile.findFirst();

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
                    aiModel: data.aiModel
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
                    aiModel: data.aiModel || 'gemini-1.5-flash'
                }
            });
        }

        revalidatePath('/');
        return { success: true };
    } catch (err) {
        console.error("Erro ao salvar perfil do médico:", err);
        return { success: false, error: "Falha ao gravar configurações." };
    }
}
