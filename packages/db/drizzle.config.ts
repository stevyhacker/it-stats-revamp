import type { Config } from 'drizzle-kit';
import { config } from "dotenv";

config({ path: ".env" });

export default {
  schema: "./src/index.ts",
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
