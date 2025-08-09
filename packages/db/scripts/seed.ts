import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';
import { years, companies } from '../src/schema'; 
import { eq } from 'drizzle-orm'; 
import path from 'path'; 

// Import data directly
import { data, companyPibMap } from '../../../apps/web/src/data';

config({ path: path.resolve(__dirname, '../.env') }); 

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set or not loaded correctly.');
}

const migrationClient = postgres(connectionString, {
    max: 1,
});
const db = drizzle(migrationClient);
console.log('Database client initialized.');


async function seed() {
    console.log('Seeding database...');

    try {
        // Use imported data
        for (const yearEntry of data) {
            const yearValue = parseInt(yearEntry.year as any, 10); // Cast year to any if needed
            if (isNaN(yearValue)) {
                console.warn(`Skipping invalid year: ${yearEntry.year}`);
                continue;
            }

            console.log(`Processing year: ${yearValue}`);

            let yearRecord = await db
                .select()
                .from(years)
                .where(eq(years.yearValue, yearValue)).limit(1);

            let yearId: number;

            if (yearRecord.length === 0) {
                console.log(`  Inserting year: ${yearValue}`);
                const insertedYear = await db
                    .insert(years)
                    .values({ yearValue: yearValue })
                    .returning({ insertedId: years.id });
                yearId = insertedYear[0].insertedId;
            } else {
                console.log(`  Year ${yearValue} already exists.`);
                yearId = yearRecord[0].id;
            }

            // Use reduce to build the array of valid company data for insertion
            const companyInserts = yearEntry.companyList.reduce((acc: any[], company: any) => {
                // Find PIB using the map
                const pib = companyPibMap[company.name];

                if (!pib) {
                    console.warn(`  Skipping company '${company.name}' in year ${yearValue}: PIB not found in map.`);
                    return acc; // Skip this company
                }

                let averagePayInt: number | null = null;
                if (typeof company.averagePay === 'string') {
                    averagePayInt = parseInt(company.averagePay.replace(/[^0-9]/g, ''), 10) || null;
                } else if (typeof company.averagePay === 'number') {
                    averagePayInt = Math.floor(company.averagePay); // Truncate decimals
                }

                const totalIncome = company.totalIncome ?? null;
                const profit = company.profit ?? null;
                const employeeCount = company.employeeCount ?? null;
                const netPayCosts = company.netPayCosts ?? null;
                const incomePerEmployee = company.incomePerEmployee ?? null;

                if (!company.name) {
                    console.warn('  Skipping company with missing name in year', yearValue);
                    return acc; // Skip this company
                }

                // Add PIB to the insert data
                acc.push({
                    name: company.name,
                    pib: pib, // Add PIB here
                    totalIncome: totalIncome,
                    profit: profit,
                    employeeCount: employeeCount,
                    netPayCosts: netPayCosts,
                    averagePay: averagePayInt,
                    incomePerEmployee: incomePerEmployee,
                    yearId: yearId,
                });
                return acc; // Return the updated accumulator
            }, []); // Start with an empty array

            if (companyInserts.length > 0) {
                console.log(`  Inserting/Ignoring ${companyInserts.length} companies for year ${yearValue}...`);
                await db.insert(companies).values(companyInserts).onConflictDoNothing({
                    // Update conflict target to use pib and yearId
                    target: [companies.pib, companies.yearId]
                });
                console.log(`  Finished processing companies for ${yearValue}.`);
            } else {
                console.log(`  No valid companies to insert for year ${yearValue}.`);
            }
        }

        console.log('Database seeded successfully!');
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    } finally {
        await migrationClient.end();
        console.log('Database connection closed.');
    }
}

seed();
