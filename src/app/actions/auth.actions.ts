'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function registerUser(data: { name: string, email: string, password: string }) {
    try {
        const existing = await prisma.doctorProfile.findFirst({ where: { email: data.email } });
        if (existing) return { success: false, error: "E-mail já cadastrado." };

        const passwordHash = await bcrypt.hash(data.password, 10);

        await prisma.doctorProfile.create({
            data: {
                email: data.email,
                passwordHash,
                fullName: data.name,
                crm: "",
                specialty: "",
                role: "doctor"
            }
        });

        return await loginUserWithCredentials(data.email, data.password);
    } catch (err) {
        console.error("Register Error:", err);
        return { success: false, error: "Falha ao criar conta." };
    }
}

export async function loginUserWithCredentials(email: string, password: string) {
    try {
        const profile = await prisma.doctorProfile.findFirst({ where: { email } });
        if (!profile || !profile.passwordHash) return { success: false, error: "Credenciais inválidas." };

        const isValid = await bcrypt.compare(password, profile.passwordHash);
        if (!isValid) return { success: false, error: "Credenciais inválidas." };

        const cookieStore = await cookies();
        cookieStore.set('app_user_id', profile.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 1 semana
        });

        // Mantendo compatibilidade legada
        cookieStore.set('app_role', profile.role, { path: '/', maxAge: 60 * 60 * 24 * 7 });

        return { success: true };
    } catch (err) {
        console.error("Login Error:", err);
        return { success: false, error: "Erro ao realizar login." };
    }
}

export async function logoutUser() {
    const cookieStore = await cookies();
    cookieStore.delete('app_user_id');
    cookieStore.delete('app_role');
    redirect('/login');
}

export async function getLoggedUserId() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('app_user_id');
    return userId?.value || null;
}

// Manter função old para debug ou fallback manual
export async function getUserRole() {
    const cookieStore = await cookies();
    const role = cookieStore.get('app_role');
    return role?.value || null;
}
