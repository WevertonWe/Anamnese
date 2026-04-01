'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * Registra um novo perfil médico com credenciais básicas.
 * Por padrão, todo novo registro recebe as permissões de plano NORMAL.
 * 
 * @param data - Objeto contendo nome (name), e-mail (email) e senha (password) do médico.
 * @returns Objeto de resposta contendo status de `success`, e em caso afirmativo efetua o login.
 */
export async function registerUser(data: { name: string, email: string, password: string }) {
    try {
        const existingDoc = await prisma.doctorProfile.findFirst({ 
            where: { email: data.email },
            select: { id: true }
        });
        const existingUser = await prisma.user.findFirst({ 
            where: { email: data.email },
            select: { id: true }
        });
        
        if (existingDoc || existingUser) return { success: false, error: "E-mail já cadastrado." };

        const passwordHash = await bcrypt.hash(data.password, 10);

        const newDoctor = await prisma.doctorProfile.create({
            data: {
                email: data.email,
                passwordHash,
                fullName: data.name,
                crm: "",
                specialty: "",
                role: "DOCTOR",
                plan: "NORMAL",
                isActive: true
            }
        });

        await prisma.user.create({
            data: {
                id: newDoctor.id,
                email: data.email,
                name: data.name,
                role: "DOCTOR",
                plan: "NORMAL",
                isActive: true
            }
        });

        return await loginUserWithCredentials(data.email, data.password);
    } catch (err) {
        console.error("Register Error:", err);
        return { success: false, error: "Falha ao criar conta." };
    }
}

/**
 * Autentica um usuário com base no e-mail e verifica o Hash da senha cruzada com o Banco.
 * Estabelece a sessão via gravação de cookies Seguros (HttpOnly em produção).
 * 
 * @param email - E-mail do usuário cadastrado na base.
 * @param password - Senha limpa para aferição via Bcrypt.
 * @returns Objeto indicando o sucesso da operação (`success: true`) ou disparo de erro mapeado.
 */
export async function loginUserWithCredentials(email: string, password: string) {
    try {
        const profile = await prisma.doctorProfile.findFirst({
            where: { email },
            select: {
                id: true,
                passwordHash: true,
                status: true,
                role: true
            }
        });
        if (!profile || !profile.passwordHash) return { success: false, error: "Credenciais inválidas." };

        const isValid = await bcrypt.compare(password, profile.passwordHash);
        if (!isValid) return { success: false, error: "Credenciais inválidas." };

        if (profile.status === 'BLOCKED') {
            return { success: false, error: "Conta bloqueada por inadimplência ou infração. Contate o suporte." };
        }

        await prisma.doctorProfile.update({
            where: { id: profile.id },
            data: { lastLoginAt: new Date() }
        });

        const cookieStore = await cookies();
        cookieStore.set('app_user_id', profile.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 1 semana
        });

        // Mantendo compatibilidade legada e adicionando state do SaaS
        cookieStore.set('app_role', profile.role, { path: '/', maxAge: 60 * 60 * 24 * 7 });
        cookieStore.set('app_status', profile.status, { path: '/', maxAge: 60 * 60 * 24 * 7 });

        return { success: true };
    } catch (err) {
        console.error("Login Error:", err);
        return { success: false, error: "Erro ao realizar login." };
    }
}

/**
 * Encerra ativamente a sessão logada varrendo os cookies de controle primários
 * e redirecionando o fluxo de navegação do usuário de volta para o `/login`.
 */
export async function logoutUser() {
    const cookieStore = await cookies();
    cookieStore.delete('app_user_id');
    cookieStore.delete('app_role');
    cookieStore.delete('app_status');
    redirect('/login');
}

/**
 * Coleta do servidor o ID único da sessão do usuário autenticado no cookie "app_user_id".
 * 
 * @returns O string ID mapeado no cookie ou null caso visitante.
 */
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

/**
 * Eleva um usuário corrente do plano básico para o avançado, fornecendo privilégios do SaaS.
 * O privilégio expira em exatamente 30 dias após sua ativação.
 * 
 * @param userId - ID UUID que receberá o plano premium na base Prisma.
 * @returns Objeto de status marcando `success: true` na consolidação do upgrade virtual.
 */
export async function upgradeToPremium(userId: string) {
    try {
        const { getLoggedUserId } = await import('@/app/actions/auth.actions');
        const doctorId = await getLoggedUserId();
        
        if (!doctorId) throw new Error("Acesso não autorizado.");
        
        // Bloqueio severo de Cross-Account Bypass
        if (doctorId !== userId) {
            const role = await getUserRole();
            if (role !== 'ADMIN') throw new Error("Fraude detectada: Tentativa de bypass de conta inter-usuário.");
        }

        await prisma.doctorProfile.update({
            where: { id: userId },
            data: {
                plan: "PREMIUM",
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            } as any
        });
        return { success: true };
    } catch(err) {
        console.error("Upgrade error:", err);
        return { success: false, error: "Falha ao mudar de plano" };
    }
}
