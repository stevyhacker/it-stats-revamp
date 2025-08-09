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
  selectedCompanies?: string[];
  onToggleCompany?: (companyName: string) => void;
}

const CompanyTable: React.FC<CompanyTableProps> = ({ selectedYearData, onCompanySelect, selectedCompanies = [], onToggleCompany }) => {
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
    <div className="w-full overflow-x-auto rounded-lg bg-card/60 backdrop-blur-sm border">
      <Table className="w-full">
        <TableHeader className="sticky top-0 bg-background/80 backdrop-blur-sm border-b shadow-sm">
          <TableRow>
            <TableHead className="w-8"></TableHead>
            <TableHead
              className="cursor-pointer hover:bg-accent/40 transition-all duration-200 font-semibold text-xs uppercase tracking-wider rounded-t-md"
              onClick={() => handleSort('name')}
            >
              Company Name
              {renderSortIcon('name')}
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-accent/40 transition-all duration-200 font-semibold text-xs uppercase tracking-wider rounded-t-md"
              onClick={() => handleSort('totalIncome')}
            >
              Total Income
              {renderSortIcon('totalIncome')}
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-accent/40 transition-all duration-200 font-semibold text-xs uppercase tracking-wider rounded-t-md"
              onClick={() => handleSort('profit')}
            >
              Profit
              {renderSortIcon('profit')}
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-accent/40 transition-all duration-200 font-semibold text-xs uppercase tracking-wider rounded-t-md"
              onClick={() => handleSort('averagePay')}
            >
              Avg Monthly Pay
              {renderSortIcon('averagePay')}
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-accent/40 transition-all duration-200 font-semibold text-xs uppercase tracking-wider rounded-t-md"
              onClick={() => handleSort('employeeCount')}
            >
              Employees
              {renderSortIcon('employeeCount')}
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-accent/40 transition-all duration-200 font-semibold text-xs uppercase tracking-wider rounded-t-md"
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
              className="cursor-pointer hover:bg-accent/30 hover:border-l-4 hover:border-l-primary/50 transition-colors duration-200 group relative overflow-hidden"
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={selectedCompanies.includes(company.name)}
                  onChange={() => onToggleCompany && onToggleCompany(company.name)}
                  aria-label={`Select ${company.name} for comparison`}
                />
              </TableCell>
              <TableCell className="font-medium group-hover:text-foreground transition-colors duration-200 relative z-10">{company.name}</TableCell>
              <TableCell className="group-hover:font-semibold transition-colors duration-200 relative z-10">
                {numeral(company.totalIncome).format('0,0')}€
              </TableCell>
              <TableCell className="group-hover:font-semibold transition-colors duration-200 relative z-10">
                <span>
                  {numeral(company.profit).format('0,0')}€
                </span>
              </TableCell>
              <TableCell className="group-hover:font-semibold transition-colors duration-200 relative z-10">
                {numeral(company.averagePay).format('0,0')}€
              </TableCell>
              <TableCell className="group-hover:font-semibold transition-colors duration-200 relative z-10">
                {company.employeeCount}
              </TableCell>
              <TableCell className="group-hover:font-semibold transition-colors duration-200 relative z-10">
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
