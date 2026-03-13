import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('--- Iniciando Seed e Limpeza (v2) ---');
    console.log('Conectando ao banco...');

    try {
        // 1. Encontrar um médico e um template
        const doctor = await prisma.doctorProfile.findFirst();
        const template = await prisma.template.findFirst();

        if (!doctor || !template) {
            console.error('Erro: Não foram encontrados médicos ou templates para o seed.');
            return;
        }

        console.log(`Encontrado: Médico=${doctor.fullName}, Template=${template.name}`);

        // 2. Criar anamnese de teste
        console.log(`Criando anamnese de teste...`);
        const testRecord = await prisma.patientRecord.create({
            data: {
                patientName: 'Paciente Teste IMC (Debug)',
                doctorId: doctor.id,
                templateId: template.id,
                status: 'COMPLETED',
                data: JSON.stringify({
                    peso: '85kg',
                    altura: '180cm',
                    queixa_principal: 'Validando renderização de IMC e Destaques visuais.',
                    hipotese_diagnostica: 'Sobrepeso leve detectado.',
                    conduta_sugerida: 'Orientações dietéticas e atividade física.'
                })
            }
        });
        console.log(`✅ Registro de teste criado: ID ${testRecord.id}`);

        // 3. Limpeza de registros órfãos
        console.log('Verificando registros órfãos...');
        const orphans = await prisma.patientRecord.deleteMany({
            where: {
                OR: [
                    { doctorId: null },
                    { templateId: "" }
                ]
            }
        });
        console.log(`✅ Limpeza concluída: ${orphans.count} registros removidos.`);
        
    } catch (err) {
        console.error('❌ Erro fatal durante a execução:', err);
        throw err;
    } finally {
        console.log('--- Processo Finalizado ---');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
