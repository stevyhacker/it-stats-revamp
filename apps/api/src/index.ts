import { Hono } from 'hono';
import { logger } from 'hono/logger';
// import { clerkMiddleware, getAuth } from '@hono/clerk-auth';
import 'dotenv/config';
import { db, years, companies, eq, desc, asc } from 'db';
import * as schema from 'db';

// Define Company type using Drizzle inference
type Company = typeof companies.$inferSelect;
// Define type for the result of the join query
// Assuming 'years' table has 'id' and 'yearValue' (number)
type CompanyWithYear = Company & { year: { yearValue: number | null } }; // Allow null if leftJoin

interface YearData {
  year: string; // Keep as string for the key and output
  companyList: CompanyWithYear[]; // Use the joined type here
  // Add other year-specific properties if needed
}

const app = new Hono();

// Middleware
app.use(logger());

// --- Helper Function ---
// Function to group companies by year
// Updated to accept the joined data type
function groupCompaniesByYear(allCompanies: CompanyWithYear[]): YearData[] {
  const groupedData: { [year: string]: YearData } = {};

  allCompanies.forEach((company) => {
    // Use the actual yearValue from the joined 'years' table data
    // Handle potential null yearValue if using leftJoin and a company somehow lacks a year
    const yearVal = company.year?.yearValue;
    if (yearVal === null || yearVal === undefined) {
        console.warn(`Company ID ${company.id} missing year data. Skipping.`);
        return; // Skip companies without a valid year
    }
    const yearStr = yearVal.toString(); // Correctly use the yearValue

    if (!groupedData[yearStr]) {
      groupedData[yearStr] = {
        year: yearStr,
        companyList: [],
        // Add other year-specific fields if necessary from a 'years' table query
      };
    }
    // Ensure the full CompanyWithYear object is pushed
    groupedData[yearStr].companyList.push(company);
  });

  // Sort years if needed, e.g., descending
  return Object.values(groupedData).sort((a, b) => parseInt(b.year) - parseInt(a.year));
}

// --- Public Data Routes ---

// Route to get data for a specific company (by PIB) across all years
// NOTE: Defined *before* /companies to ensure it matches first
// Updated to join with years and return yearValue
app.get('/companies/:pib', async (c) => {
  const pib = c.req.param('pib');

  if (!pib) {
    return c.json({ error: 'PIB parameter is required' }, 400);
  }

  try {
    // Join with years table here too
    const companyData = await db
      .select({
        // Correctly select all fields from companies schema
        id: schema.companies.id,
        name: schema.companies.name,
        pib: schema.companies.pib,
        totalIncome: schema.companies.totalIncome,
        profit: schema.companies.profit,
        employeeCount: schema.companies.employeeCount,
        netPayCosts: schema.companies.netPayCosts,
        averagePay: schema.companies.averagePay,
        incomePerEmployee: schema.companies.incomePerEmployee,
        yearId: schema.companies.yearId, // Keep yearId if needed
        createdAt: schema.companies.createdAt,
        updatedAt: schema.companies.updatedAt,
        // Select the yearValue directly from years table
        yearValue: schema.years.yearValue
      })
      .from(companies)
      .leftJoin(years, eq(companies.yearId, years.id)) // Join based on foreign key
      .where(eq(companies.pib, pib)) // Filter by PIB
      .orderBy(asc(years.yearValue)); // Order by actual year value

    if (companyData.length === 0) {
      return c.json({ message: 'Company not found for the given PIB' }, 404);
    }

    // The result already includes yearValue directly at the top level due to the select
    return c.json(companyData);
  } catch (error) {
    console.error(`Error fetching data for company PIB ${pib}:`, error);
    return c.json({ error: 'Failed to fetch company data' }, 500);
  }
});

// Route to get all companies data, grouped by year
app.get('/companies', async (c) => {
  try {
    // Fetch all companies JOINED with their corresponding year
    const allCompaniesWithYear = await db
        .select({
             // Correctly select all fields from companies schema
             id: schema.companies.id,
             name: schema.companies.name,
             pib: schema.companies.pib,
             totalIncome: schema.companies.totalIncome,
             profit: schema.companies.profit,
             employeeCount: schema.companies.employeeCount,
             netPayCosts: schema.companies.netPayCosts,
             averagePay: schema.companies.averagePay,
             incomePerEmployee: schema.companies.incomePerEmployee,
             yearId: schema.companies.yearId, // Keep yearId for the base Company type
             createdAt: schema.companies.createdAt,
             updatedAt: schema.companies.updatedAt,
             // Select the yearValue nested as expected by CompanyWithYear type
             year: { yearValue: schema.years.yearValue }
        })
        .from(companies)
        .leftJoin(years, eq(companies.yearId, years.id)) // Join companies with years
        .orderBy(desc(years.yearValue), asc(companies.name)); // Order by actual year, then name

    // The selection now matches the schema, so the type assertion should be safer
    const formattedCompanies = allCompaniesWithYear as CompanyWithYear[];

    // Group the flat list by year using the updated helper
    const groupedData = groupCompaniesByYear(formattedCompanies); // Pass the correctly structured data

    if (groupedData.length === 0) {
        return c.json({ message: 'No company data found' }, 404);
    }

    // Simplify the output structure for the API response
    // Remove the nested 'year' object from each company in the list
    const finalResponse = groupedData.map(yearGroup => ({
        year: yearGroup.year,
        companyList: yearGroup.companyList.map(comp => {
             // This deconstruction now correctly captures all fields from the schema
             const { year, ...companyDetails } = comp; // yearId remains in companyDetails
             return companyDetails;
        })
    }));

    // Return the grouped and simplified data
    return c.json(finalResponse);

  } catch (error) {
    console.error('Error fetching all companies data:', error);
    return c.json({ error: 'Failed to fetch company data' }, 500);
  }
});

// GET /years - Fetches all available years
app.get('/years', async (c) => {
  try {
    console.log('Fetching years from DB...');
    const result = await db
      .select({
        yearValue: schema.years.yearValue,
      })
      .from(years)
      .orderBy(desc(years.yearValue));

    console.log('Raw DB result for /years:', result);

    const yearValues = result.map((y) => y.yearValue);

    console.log('Mapped yearValues:', yearValues);

    return c.json(yearValues);
  } catch (error) {
    console.error('Error fetching years:', error);
    return c.json({ error: 'Failed to fetch years' }, 500);
  }
});

// --- Clerk Authentication ---
// Initialize Clerk middleware (ensure env vars are set)
// Note: Adjust publishableKey and secretKey based on your needs if loaded differently
// const clerk = clerkMiddleware({
//   secretKey: process.env.CLERK_SECRET_KEY,
//   publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
// });

// Example public route
app.get('/', (c) => {
  return c.json({ message: 'Hello from IT Stats API!' });
});

// --- Protected Routes Example ---
// Group routes that require authentication
const appRoutes = app.basePath('/api'); // Example base path

// Apply Clerk middleware to this group
// appRoutes.use(clerk);

appRoutes.get('/protected', (c) => {
  // const auth = getAuth(c);

  // if (!auth?.userId) {
  //   return c.json({ error: 'Unauthorized' }, 401);
  // }

  // Access user data if needed: auth.userId, auth.sessionClaims, etc.
  // return c.json({ message: 'This is a protected route', userId: auth.userId });
  return c.json({ message: 'This is a protected route' });
});

// --- Server Start ---
// Only start the server if this file is being run directly (not imported)
if (import.meta.main) {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isDev = process.env.NODE_ENV !== 'production';
  const runningInBun = typeof Bun !== 'undefined' && typeof Bun.serve === 'function';

  console.log(`API server starting on port ${port} (${isDev ? 'development' : 'production'})`);

  // Ensure downstream consumers see the resolved port value
  if (!process.env.PORT) {
    process.env.PORT = String(port);
  }

  if (runningInBun) {
    console.log('Bun runtime detected; relying on automatic Bun server binding.');
    console.log(`Server is running on http://${isDev ? 'localhost' : '0.0.0.0'}:${port}`);
  } else {
    // Node.js runtime - use @hono/node-server
    const { serve } = await import('@hono/node-server');
    serve({
      fetch: app.fetch,
      port: port,
      hostname: '0.0.0.0',
    });
    console.log(`Server is running on http://${isDev ? 'localhost' : '0.0.0.0'}:${port}`);
  }
}

// Export for testing and imports
export default app;
