import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';

// Type definitions
interface Company {
  id: number;
  name: string;
  pib: string;
  totalIncome: number;
  profit: number;
  employeeCount: number;
  netPayCosts: number;
  averagePay: number;
  incomePerEmployee: number;
  yearId: number;
  createdAt: string;
  updatedAt: string;
}

interface YearData {
  year: string;
  companyList: Company[];
}

async function importData() {
  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    console.log('💡 Get it from Railway dashboard: PostgreSQL service → Connect tab');
    process.exit(1);
  }

  // Database connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔌 Connecting to database...');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Connected to database');
    
    // Read the JSON file
    const jsonPath = join(__dirname, '../backups/companies.json');
    console.log(`📂 Reading data from: ${jsonPath}`);
    
    const jsonData = readFileSync(jsonPath, 'utf-8');
    const data: YearData[] = JSON.parse(jsonData);
    
    console.log(`📊 Found ${data.length} years of data`);
    
    // Start transaction
    await client.query('BEGIN');
    
    try {
      // First, ensure years exist
      for (const yearData of data) {
        const yearValue = parseInt(yearData.year);
        
        // Insert year if it doesn't exist
        await client.query(`
          INSERT INTO years (year_value) 
          VALUES ($1) 
          ON CONFLICT (year_value) DO NOTHING
        `, [yearValue]);
        
        console.log(`📅 Year ${yearValue} ready`);
      }
      
      // Get year IDs mapping
      const yearMap = new Map<number, number>();
      const yearResult = await client.query('SELECT id, year_value FROM years');
      yearResult.rows.forEach(row => {
        yearMap.set(row.year_value, row.id);
      });
      
      console.log(`🗂️  Year mapping: ${JSON.stringify(Object.fromEntries(yearMap))}`);
      
      // Insert companies
      let totalCompanies = 0;
      for (const yearData of data) {
        const yearValue = parseInt(yearData.year);
        const yearId = yearMap.get(yearValue);
        
        if (!yearId) {
          console.error(`❌ Year ID not found for ${yearValue}`);
          continue;
        }
        
        // Clear existing companies for this year
        const deleteResult = await client.query('DELETE FROM companies WHERE year_id = $1', [yearId]);
        console.log(`🗑️  Cleared ${deleteResult.rowCount} existing companies for ${yearValue}`);
        
        for (const company of yearData.companyList) {
          await client.query(`
            INSERT INTO companies (
              name, pib, total_income, profit, employee_count, 
              net_pay_costs, average_pay, income_per_employee, year_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `, [
            company.name,
            company.pib,
            company.totalIncome,
            company.profit,
            company.employeeCount,
            company.netPayCosts,
            company.averagePay,
            company.incomePerEmployee,
            yearId
          ]);
        }
        
        totalCompanies += yearData.companyList.length;
        console.log(`✅ Imported ${yearData.companyList.length} companies for ${yearValue}`);
      }
      
      // Commit transaction
      await client.query('COMMIT');
      console.log(`🎉 Successfully imported ${totalCompanies} companies!`);
      
      // Show summary
      const summaryResult = await client.query(`
        SELECT 
          y.year_value,
          COUNT(c.id) as company_count
        FROM years y
        LEFT JOIN companies c ON y.id = c.year_id
        GROUP BY y.year_value
        ORDER BY y.year_value
      `);
      
      console.log('\n📈 Import Summary:');
      summaryResult.rows.forEach(row => {
        console.log(`   ${row.year_value}: ${row.company_count} companies`);
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the import
importData().catch(console.error); 