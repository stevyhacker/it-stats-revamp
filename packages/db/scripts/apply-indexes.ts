import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function applyIndexes() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  const client = postgres(process.env.DATABASE_URL);
  const db = drizzle(client);

  try {
    console.log("📊 Applying performance indexes...");
    
    // Read the SQL file
    const sqlPath = join(__dirname, '../src/migrations/add-performance-indexes.sql');
    const sqlContent = readFileSync(sqlPath, 'utf-8');
    
    // Split by semicolons and execute each statement
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      await client.unsafe(statement + ';');
    }
    
    console.log("✅ All indexes created successfully!");
    
    // Analyze tables for query planner statistics
    console.log("📊 Analyzing tables for query optimization...");
    await client`ANALYZE companies`;
    await client`ANALYZE years`;
    console.log("✅ Table statistics updated!");
    
  } catch (error) {
    console.error("❌ Error applying indexes:", error);
    throw error;
  } finally {
    await client.end();
  }
}

applyIndexes().catch(console.error);