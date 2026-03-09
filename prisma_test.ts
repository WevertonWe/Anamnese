import prisma from './src/lib/prisma';

async function testPrisma() {
    try {
        console.log("Testando busca de email...");
        const result = await prisma.doctorProfile.findFirst({
            where: { email: 'teste@teste.com' }
        });
        console.log("SUCESSO: O ORM reconheceu o campo email.");
    } catch (e: any) {
        console.error("ERRO:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

testPrisma();
