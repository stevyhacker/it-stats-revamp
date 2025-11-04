import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, desc, asc } from 'drizzle-orm';
import postgres from 'postgres';
import * as schema from './schema';
import 'dotenv/config';
// Ensure DATABASE_URL is set in your environment
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}
// Create the connection
const queryClient = postgres(process.env.DATABASE_URL);
// Create the Drizzle instance
export const db = drizzle(queryClient, { schema });
// Export the schema for use elsewhere
export * from './schema';
// Export common Drizzle functions as well
export { eq, desc, asc };
