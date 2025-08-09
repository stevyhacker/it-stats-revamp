import { Pool } from 'pg';

async function setupDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔌 Connecting to Railway database...');
    const client = await pool.connect();
    console.log('✅ Connected to database');

    // Create tables
    console.log('🏗️  Creating tables...');
    
    // Create years table
    await client.query(`
      CREATE TABLE IF NOT EXISTS years (
        id SERIAL PRIMARY KEY,
        year_value INTEGER UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);
    console.log('✅ Years table ready');

    // Create companies table
    await client.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(256) NOT NULL,
        pib VARCHAR(50) NOT NULL,
        total_income INTEGER,
        profit INTEGER,
        employee_count INTEGER,
        net_pay_costs INTEGER,
        average_pay INTEGER,
        income_per_employee INTEGER,
        year_id INTEGER NOT NULL REFERENCES years(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);
    console.log('✅ Companies table ready');

    // Create unique indexes
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS company_year_unique_idx 
      ON companies(name, year_id);
    `);
    
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS pib_year_unique_idx 
      ON companies(pib, year_id);
    `);
    console.log('✅ Indexes created');

    // Create users table (for future use with Clerk)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        clerk_id TEXT UNIQUE NOT NULL,
        email VARCHAR(256) UNIQUE NOT NULL,
        name TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);
    console.log('✅ Users table ready');

    console.log('🎉 Database setup complete!');
    
    client.release();
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase().catch(console.error); 