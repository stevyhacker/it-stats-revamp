import React, { useState, useMemo } from 'react';
import numeral from 'numeral';
import { CompanyData, YearData } from '../types';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/solid';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

type SortableColumn = keyof Omit<CompanyData, 'link' | 'id'>;
type SortDirection = 'asc' | 'desc';

interface CompanyTableProps {
  selectedYearData: YearData | undefined;
  onCompanySelect: (companyName: string) => void;
}

const CompanyTable: React.FC<CompanyTableProps> = ({ selectedYearData, onCompanySelect }) => {
  const [sortColumn, setSortColumn] = useState<SortableColumn>('totalIncome');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const sortedCompanyList = useMemo(() => {
    if (!selectedYearData?.companyList) {
        return [];
    }

    const list = [...selectedYearData.companyList];
    list.sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      // Handle sorting for numeric columns explicitly
      if (['totalIncome', 'profit', 'employeeCount', 'averagePay', 'incomePerEmployee'].includes(sortColumn)) {
        const numA = parseFloat(String(aValue)) || 0; // Convert to number, default to 0 if NaN
        const numB = parseFloat(String(bValue)) || 0; // Convert to number, default to 0 if NaN
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      }
      
      // Handle sorting for string columns (like 'name')
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }

      // Fallback for any other cases (should ideally not be reached with defined types)
      const valA = aValue ?? 0;
      const valB = bValue ?? 0;
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [selectedYearData, sortColumn, sortDirection]);

  if (!selectedYearData) {
    return null;
  }

  const handleSort = (column: SortableColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection(column === 'name' ? 'asc' : 'desc');
    }
  };

  const renderSortIcon = (column: SortableColumn) => {
    if (sortColumn !== column) {
      return null;
    }
    return sortDirection === 'asc' ? (
      <ChevronUpIcon className="h-4 w-4 inline-block ml-1" />
    ) : (
      <ChevronDownIcon className="h-4 w-4 inline-block ml-1" />
    );
  };

  return (
    <div className="w-full overflow-x-auto rounded-lg neu-inset bg-muted/20 backdrop-blur-sm">
      <Table className="w-full">
        <TableHeader className="sticky top-0 bg-gradient-to-r from-muted/80 via-background/90 to-muted/80 backdrop-blur-sm border-b-2 border-primary/20 shadow-sm">
          <TableRow>
            <TableHead
              className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-all duration-300 font-semibold text-xs uppercase tracking-wider rounded-t-md"
              onClick={() => handleSort('name')}
            >
              Company Name
              {renderSortIcon('name')}
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-chart-1/10 hover:text-chart-1 transition-all duration-300 font-semibold text-xs uppercase tracking-wider rounded-t-md"
              onClick={() => handleSort('totalIncome')}
            >
              Total Income
              {renderSortIcon('totalIncome')}
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-chart-2/10 hover:text-chart-2 transition-all duration-300 font-semibold text-xs uppercase tracking-wider rounded-t-md"
              onClick={() => handleSort('profit')}
            >
              Profit
              {renderSortIcon('profit')}
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-chart-3/10 hover:text-chart-3 transition-all duration-300 font-semibold text-xs uppercase tracking-wider rounded-t-md"
              onClick={() => handleSort('averagePay')}
            >
              Avg Monthly Pay
              {renderSortIcon('averagePay')}
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-chart-4/10 hover:text-chart-4 transition-all duration-300 font-semibold text-xs uppercase tracking-wider rounded-t-md"
              onClick={() => handleSort('employeeCount')}
            >
              Employees
              {renderSortIcon('employeeCount')}
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-chart-5/10 hover:text-chart-5 transition-all duration-300 font-semibold text-xs uppercase tracking-wider rounded-t-md"
              onClick={() => handleSort('incomePerEmployee')}
            >
              Income/Employee
              {renderSortIcon('incomePerEmployee')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCompanyList.map((company: CompanyData) => (
            <TableRow
              key={company.name}
              onClick={() => onCompanySelect(company.name)}
              className="cursor-pointer hover:bg-gradient-to-r hover:from-primary/5 hover:via-chart-1/3 hover:to-primary/5 hover:border-l-4 hover:border-l-primary/60 transition-all duration-300 group relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-primary/5 before:to-transparent before:translate-x-full hover:before:translate-x-0 before:transition-transform before:duration-500"
            >
              <TableCell className="font-medium group-hover:text-primary transition-all duration-300 relative z-10">{company.name}</TableCell>
              <TableCell className="group-hover:text-chart-1 group-hover:font-semibold transition-all duration-300 relative z-10">
                {numeral(company.totalIncome).format('0,0')}€
              </TableCell>
              <TableCell className="group-hover:font-semibold transition-all duration-300 relative z-10">
                <span className={`${company.profit >= 0 ? 'group-hover:text-chart-2' : 'group-hover:text-destructive'}`}>
                  {numeral(company.profit).format('0,0')}€
                </span>
              </TableCell>
              <TableCell className="group-hover:text-chart-3 group-hover:font-semibold transition-all duration-300 relative z-10">
                {numeral(company.averagePay).format('0,0')}€
              </TableCell>
              <TableCell className="group-hover:text-chart-4 group-hover:font-semibold transition-all duration-300 relative z-10">
                {company.employeeCount}
              </TableCell>
              <TableCell className="group-hover:text-chart-5 group-hover:font-semibold transition-all duration-300 relative z-10">
                {numeral(company.incomePerEmployee).format('0,0')}€
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CompanyTable;
