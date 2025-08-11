import { Dashboard } from "../src/components/Dashboard";
import { Header } from "../src/components/Header";

// Define types locally
interface Company {
  id: number; 
  pib: string;
  maticniBroj: string;
  name: string;
  address: string | null;
  municipality: string | null;
  activityCode: string | null;
  activityName: string | null;
  employeeCount: number | null; 
  averagePay: number | null; 
  yearId: number; 
  totalIncome: number | null;  
  profit: number | null;       
  incomePerEmployee: number | null; 
  // Add other fields expected from the API and needed by Dashboard
}

interface YearData {
  year: string;
  companyList: Company[]; 
}

async function fetchData(): Promise<YearData[]> {
  // Read the API base URL from environment variables, default to localhost:3001
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  console.log(`Fetching data from: ${apiBaseUrl}/companies`); // Add log
  try {
    const res = await fetch(`${apiBaseUrl}/companies`, {
      // Enable caching for 5 minutes with revalidation
      next: { revalidate: 300 },
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      console.error("Failed to fetch companies:", res.status, res.statusText);
      return [];
    }
    const data = await res.json();
    return data as YearData[];
  } catch (error) {
    console.error("Error fetching /companies:", error);
    return [];
  }
}

export default async function HomePage() {
  const data: YearData[] = await fetchData();

  const years = data.map((d) => d.year);
  const selectedYear = years[0] || "";

  if (data.length === 0) {
    return <main className="p-4">Failed to load company data. Please check the API server.</main>;
  }

  return (
    <>
      <Header />
      <main>
        <Dashboard
          years={years}
          data={data}
        />
      </main>
    </>
  );
}
