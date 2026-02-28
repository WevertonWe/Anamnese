import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const adapter = new PrismaBetterSqlite3({ url: './prisma/dev.db' })
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('Iniciando DB Seed...')

    const templateGeral = await prisma.template.upsert({
        where: { id: 'template-geral' },
        update: {},
        create: {
            id: 'template-geral',
            name: 'Clínica Médica - Primeira Consulta',
            description: 'Template Padrão (SOAP) para a primeira vez do paciente.',
            isDefault: true,
            schema: JSON.stringify({
                fields: [
                    { id: 'qd', label: 'Queixa Principal (QD)', type: 'textarea', required: true },
                    { id: 'hda', label: 'HDA (História da Doença Atual)', type: 'textarea' },
                    { id: 'hpp', label: 'História Patológica Pregressa (HPP)', type: 'textarea' },
                    { id: 'exame_fisico', label: 'Exame Físico (Objetivo)', type: 'textarea' },
                    { id: 'conduta', label: 'Conduta ou Plano', type: 'textarea' }
                ]
            })
        },
    })

    const templateOrto = await prisma.template.upsert({
        where: { id: 'template-ortopedia' },
        update: {},
        create: {
            id: 'template-ortopedia',
            name: 'Ortopedia - Retorno',
            description: 'Acompanhamento e evolução do quadro ortopédico.',
            isDefault: false,
            schema: JSON.stringify({
                fields: [
                    { id: 'evolucao', label: 'Evolução da Dor', type: 'text' },
                    { id: 'mobilidade', label: 'Amplitude de Movimento Mapeada', type: 'textarea' },
                    { id: 'exame_fisico_direcionado', label: 'Exame Físico Específico', type: 'textarea', required: true },
                    { id: 'imagem', label: 'Laudo de Exames de Imagem (Raio-X / RM)', type: 'textarea' },
                    { id: 'conduta_orto', label: 'Conduta Ortopédica', type: 'textarea' }
                ]
            })
        },
    })

    console.log('Seed Finalizada! Templates injetados:', { templateGeral, templateOrto })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
