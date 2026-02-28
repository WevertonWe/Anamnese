import { defineConfig } from '@prisma/config';
import { config } from 'dotenv';
import * as path from 'path';
config();

export default defineConfig({
  datasource: {
    url: "file:" + path.join(process.cwd(), "prisma", "dev.db")
  },
  migrations: {
    seed: 'npx tsx prisma/seed.ts'
  }
});
