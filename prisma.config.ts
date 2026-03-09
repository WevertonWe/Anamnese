import { defineConfig } from '@prisma/config';
import * as path from 'path';

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL || ("file:" + path.join(process.cwd(), "prisma", "dev.db"))
  },
  migrations: {
    seed: 'npx tsx prisma/seed.ts'
  }
});
