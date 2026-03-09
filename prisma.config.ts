import { defineConfig } from '@prisma/config';
import { config } from 'dotenv';
import * as path from 'path';
config();

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL || ("file:" + path.join(process.cwd(), "prisma", "dev.db"))
  },
  migrations: {
    seed: 'npx tsx prisma/seed.ts'
  }
});
