import { useState, useMemo } from 'react'; // Keep useState and useMemo
import { useParams, useNavigate } from 'react-router-dom'; // Import hooks
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Building2, TrendingUp, Users, Wallet, ArrowUpRight, ArrowDownRight, ChevronUp, ChevronDown, ArrowLeft } from 'lucide-react'; // Added ArrowLeft
import numeral from 'numeral';
import { data } from '../data';
import { Button } from '@/components/ui/button'; // Added Button
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'; // Added Card components
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/table'; // Added Table components

interface CompanyYearData {
  year: string;
  name?: string;
  totalIncome?: number;
  profit?: number;
  employeeCount?: number;
  averagePay?: number;
  incomePerEmployee?: number;
}

interface SortConfig {
  key: keyof CompanyYearData | null;
  direction: 'ascending' | 'descending';
}

export const CompanyPage = () => {
  const { companyName } = useParams<{ companyName: string }>(); // Get company name from URL
  const navigate = useNavigate(); // Hook for navigation

  const companyData: CompanyYearData[] = useMemo(() => data
    .map(yearData => {
      const company = yearData.companyList.find(c => c.name === companyName);
      return {
        year: yearData.year,
        ...company,
        // Ensure averagePay is a number or undefined
        averagePay: company?.averagePay !== undefined ? parseFloat(String(company.averagePay)) || undefined : undefined,
      };
    })
    .filter(d => d.name !== undefined) // Filter out years where the company didn't exist
    // Calculate incomePerEmployee here if not already present
    .map(d => ({ ...d, incomePerEmployee: d.totalIncome && d.employeeCount ? d.totalIncome / d.employeeCount : 0 }))
    .sort((a, b) => Number(a.year) - Number(b.year)), [companyName]);

  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'year', direction: 'descending' });

  // Function to handle navigating back
  const handleClose = () => {
    navigate(-1); // Go back one step in history
  };

  const latestData = companyData[companyData.length - 1] || {};
  const previousYearData = companyData[companyData.length - 2];

  const calculateGrowth = (current?: number, previous?: number) => {
    if (current === undefined || previous === undefined || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const growthMetrics = previousYearData ? {
    incomeGrowth: calculateGrowth(latestData.totalIncome, previousYearData.totalIncome),
    profitGrowth: calculateGrowth(latestData.profit, previousYearData.profit),
    employeeGrowth: calculateGrowth(latestData.employeeCount, previousYearData.employeeCount)
  } : null;

  const sortedData = useMemo(() => {
    const sortableItems = [...companyData];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (aValue === undefined || bValue === undefined) return 0; // Handle potential undefined values

        // Handle sorting for numeric columns explicitly
        if (['totalIncome', 'profit', 'employeeCount', 'averagePay', 'incomePerEmployee'].includes(sortConfig.key!)) {
          const numA = parseFloat(String(aValue)) || 0; // Convert to number, default to 0 if NaN
          const numB = parseFloat(String(bValue)) || 0; // Convert to number, default to 0 if NaN
          return sortConfig.direction === 'ascending' ? numA - numB : numB - numA;
        }
        
        // Handle sorting for string columns (like 'name' or 'year')
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          // Special handling for 'year' to sort numerically
          if (sortConfig.key === 'year') {
            return sortConfig.direction === 'ascending' ? Number(aValue) - Number(bValue) : Number(bValue) - Number(aValue);
          }
          return sortConfig.direction === 'ascending' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }

        // Fallback (should ideally not be reached)
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [companyData, sortConfig]);

  const requestSort = (key: keyof CompanyYearData) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof CompanyYearData) => {
    if (sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? 
      <ChevronUp size={16} className="ml-1 inline-block" /> : 
      <ChevronDown size={16} className="ml-1 inline-block" />;
  };

  // Define columns for the table
  const columns: { key: keyof CompanyYearData; label: string }[] = [
    { key: 'year', label: 'Year' },
    { key: 'totalIncome', label: 'Total Income' },
    { key: 'profit', label: 'Profit' },
    { key: 'employeeCount', label: 'Employees' },
    { key: 'averagePay', label: 'Avg Pay' }, // Key updated
    { key: 'incomePerEmployee', label: 'Income/Employee' }, // Key updated
  ];

  return (
    <div className="fixed inset-0 bg-background overflow-y-auto transition-colors duration-200"> 
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"> 
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{companyName}</h1> 
            <p className="text-muted-foreground">Historical Performance Analysis</p> 
          </div>
          <Button
            variant="ghost" 
            onClick={handleClose} 
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Overview
          </Button>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{numeral(latestData.totalIncome).format('0,0')}€</div>
              {growthMetrics && (
                <div className={`mt-1 flex items-center text-xs ${growthMetrics.incomeGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}> 
                  {growthMetrics.incomeGrowth >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />} 
                  <span className="ml-1">{Math.abs(growthMetrics.incomeGrowth).toFixed(1)}% vs last year</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{numeral(latestData.profit).format('0,0')}€</div>
              {growthMetrics && (
                <div className={`mt-1 flex items-center text-xs ${growthMetrics.profitGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}> 
                  {growthMetrics.profitGrowth >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />} 
                  <span className="ml-1">{Math.abs(growthMetrics.profitGrowth).toFixed(1)}% vs last year</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{latestData.employeeCount}</div>
              {growthMetrics && (
                <div className={`mt-1 flex items-center text-xs ${growthMetrics.employeeGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}> 
                  {growthMetrics.employeeGrowth >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />} 
                  <span className="ml-1">{Math.abs(growthMetrics.employeeGrowth).toFixed(1)}% vs last year</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Monthly Pay</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{numeral(latestData.averagePay).format('0,0')}€</div>
               {/* Growth calculation for avg pay could be added here if needed */} 
               <p className="text-xs text-muted-foreground mt-1">
                  Latest available average
               </p>
            </CardContent>
          </Card>
        </div>

        {/* Historical Charts Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8"> 
          <Card>
            <CardHeader>
              <CardTitle>Income & Profit Trends</CardTitle>
            </CardHeader>
            <CardContent className="pl-2"> 
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={companyData}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }} 
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /> 
                    <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} /> 
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `€${numeral(value).format('0a')}`} /> 
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))', 
                        borderRadius: 'var(--radius)', 
                        color: 'hsl(var(--foreground))' 
                      }}
                      formatter={(value: number, name: string) => [`${numeral(value).format('0,0')}€`, name]} 
                      cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} 
                    />
                    <Line type="monotone" dataKey="totalIncome" stroke="hsl(var(--primary))" name="Total Income" dot={false} /> 
                    <Line type="monotone" dataKey="profit" stroke="hsl(var(--chart-2))" name="Profit" dot={false} /> 
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Employee Count & Efficiency</CardTitle>
            </CardHeader>
            <CardContent className="pl-2"> 
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={companyData}
                     margin={{ top: 5, right: 20, left: 10, bottom: 5 }} 
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /> 
                    <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} /> 
                    <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${numeral(value).format('0a')}`} /> 
                    <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `€${numeral(value).format('0a')}`} /> 
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))', 
                        borderRadius: 'var(--radius)', 
                        color: 'hsl(var(--foreground))' 
                      }}
                      formatter={(value: number, name: string) => [
                        name === 'Employees' ? `${numeral(value).format('0,0')}` : `${numeral(value).format('0,0')}€`,
                        name
                      ]}
                      cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} 
                    />
                    <Line yAxisId="left" type="monotone" dataKey="employeeCount" stroke="hsl(var(--chart-3))" name="Employees" dot={false} /> 
                    <Line yAxisId="right" type="monotone" dataKey="incomePerEmployee" stroke="hsl(var(--chart-4))" name="Income per Employee" dot={false} /> 
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Yearly Data Table Card */}
        <Card> 
          <CardHeader>
             <CardTitle>Historical Data</CardTitle>
          </CardHeader>
          <CardContent>
            <Table> 
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead  
                      key={column.key}
                      className="cursor-pointer hover:bg-muted/50" 
                      onClick={() => requestSort(column.key)}
                    >
                      {column.label}
                      {getSortIcon(column.key)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody> 
                {sortedData.map((yearData) => (
                  <TableRow key={yearData.year}> 
                    <TableCell className="font-medium">{yearData.year}</TableCell> 
                    <TableCell>{numeral(yearData.totalIncome).format('0,0')}€</TableCell>
                    <TableCell>{numeral(yearData.profit).format('0,0')}€</TableCell>
                    <TableCell>{yearData.employeeCount}</TableCell>
                    <TableCell>{numeral(yearData.averagePay).format('0,0')}€</TableCell>
                    <TableCell>{numeral(yearData.incomePerEmployee).format('0,0')}€</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};