import { defineConfig } from '@prisma/config';

export default defineConfig({
    datasource: {
        // Usamos apenas a URL principal aqui para evitar o erro de tipagem
        url: process.env.DATABASE_URL,
    },
});