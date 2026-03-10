'use server';

import prisma from '@/lib/prisma';
import { getLoggedUserId } from './auth.actions';

export async function getAdminDashStats() {
    const adminId = await getLoggedUserId();
    if (!adminId) throw new Error("Não autorizado");

    const totalDoctors = await prisma.doctorProfile.count();
    const activeSubs = await prisma.doctorProfile.count({
        where: { status: 'ACTIVE' }
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
            createdById: true
        },
        orderBy: { updatedAt: 'desc' }
    });

    return doctors;
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
