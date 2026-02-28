'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function loginUser(role: string) {
    const cookieStore = await cookies();
    cookieStore.set('app_role', role, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 semana
    });

    redirect('/');
}

export async function logoutUser() {
    const cookieStore = await cookies();
    cookieStore.delete('app_role');
    redirect('/login');
}

export async function getUserRole() {
    const cookieStore = await cookies();
    const role = cookieStore.get('app_role');
    return role?.value || null;
}
