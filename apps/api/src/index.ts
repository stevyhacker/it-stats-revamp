import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { clerkMiddleware, getAuth } from '@hono/clerk-auth';
import 'dotenv/config';
import { db, years, companies, eq, desc, asc } from 'db';

const app = new Hono();

// Middleware
app.use(logger());

// --- Public Data Routes ---

// GET /years - Fetches all available years
app.get('/years', async (c) => {
  try {
    console.log('Fetching years from DB...');
    const result = await db
      .select({
        yearValue: years.yearValue,
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

// Route to get data for a specific company (by PIB) across all years
// NOTE: Defined *before* /companies to ensure it matches first
app.get('/companies/:pib', async (c) => {
  const pib = c.req.param('pib');

  if (!pib) {
    return c.json({ error: 'PIB parameter is required' }, 400);
  }

  try {
    const companyData = await db
      .select()
      .from(companies)
      .where(eq(companies.pib, pib)) // Filter by PIB
      .orderBy(asc(companies.yearId)); // Optional: order by year

    if (companyData.length === 0) {
      return c.json({ message: 'Company not found for the given PIB' }, 404);
    }

    return c.json(companyData);
  } catch (error) {
    console.error(`Error fetching data for company PIB ${pib}:`, error);
    return c.json({ error: 'Failed to fetch company data' }, 500);
  }
});

// Route to get all companies across all years
app.get('/companies', async (c) => {
  console.log("Fetching all companies data...");
  // Fetch all company data, joining with years if needed or handling year association
  const allCompanies = await db
    .select()
    .from(companies)
    .orderBy(asc(companies.yearId), asc(companies.name)); // Example ordering

  return c.json(allCompanies);
});

// GET /years/:year/companies - Fetches companies for a specific year
app.get('/years/:year/companies', async (c) => {
  const yearParam = c.req.param('year');
  const yearValue = parseInt(yearParam, 10);

  if (isNaN(yearValue)) {
    return c.json({ error: 'Invalid year parameter' }, 400);
  }

  try {
    // First, find the year ID
    const yearResult = await db
      .select({ id: years.id })
      .from(years)
      .where(eq(years.yearValue, yearValue))
      .limit(1);

    if (yearResult.length === 0) {
      return c.json({ error: `Year ${yearValue} not found` }, 404);
    }
    const yearId = yearResult[0].id;

    // Then, fetch companies for that year ID
    const companyResult = await db
      .select()
      .from(companies)
      .where(eq(companies.yearId, yearId))
      .orderBy(asc(companies.name));

    return c.json(companyResult);

  } catch (error) {
    console.error(`Error fetching companies for year ${yearValue}:`, error);
    return c.json({ error: 'Failed to fetch company data' }, 500);
  }
});

// --- Clerk Authentication ---
// Initialize Clerk middleware (ensure env vars are set)
// Note: Adjust publishableKey and secretKey based on your needs if loaded differently
const clerk = clerkMiddleware({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
});

// Example public route
app.get('/', (c) => {
  return c.json({ message: 'Hello from IT Stats API!' });
});

// --- Protected Routes Example ---
// Group routes that require authentication
const appRoutes = app.basePath('/api'); // Example base path

// Apply Clerk middleware to this group
appRoutes.use(clerk);

appRoutes.get('/protected', (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Access user data if needed: auth.userId, auth.sessionClaims, etc.
  return c.json({ message: 'This is a protected route', userId: auth.userId });
});

// --- Server Start ---
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3004;
console.log(`API server starting on port ${port}`);

import { serve } from 'bun';

serve({
  port: port,
  fetch: app.fetch,
});
