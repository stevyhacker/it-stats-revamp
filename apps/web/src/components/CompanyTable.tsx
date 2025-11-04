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
  profitMarginByName?: Map<string, number>;
}

const CompanyTable: React.FC<CompanyTableProps> = ({ selectedYearData, onCompanySelect, selectedCompanies = [], onToggleCompany, profitMarginByName }) => {
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

    const Icon = sortDirection === 'asc' ? ChevronUpIcon : ChevronDownIcon;

    return (
      <Icon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    );
  };

  return (
    <div className="w-full overflow-x-auto">
      <Table className="data-table">
        <TableHeader>
          <TableRow className="border-b border-border bg-muted/20">
            <TableHead className="w-[50px]"></TableHead>
            <TableHead
              className="relative cursor-pointer hover:bg-muted/50 transition-colors text-left"
              onClick={() => handleSort('name')}
            >
              <span className="block">Company</span>
              {renderSortIcon('name')}
            </TableHead>
            <TableHead
              className="relative cursor-pointer hover:bg-muted/50 transition-colors text-right pr-8"
              onClick={() => handleSort('totalIncome')}
            >
              <span className="block">Revenue</span>
              {renderSortIcon('totalIncome')}
            </TableHead>
            <TableHead
              className="relative cursor-pointer hover:bg-muted/50 transition-colors text-right pr-8"
              onClick={() => handleSort('profit')}
            >
              <span className="block">Profit</span>
              {renderSortIcon('profit')}
            </TableHead>
            <TableHead
              className="relative cursor-pointer hover:bg-muted/50 transition-colors text-right pr-8"
              onClick={() => handleSort('averagePay')}
            >
              <span className="block">Avg Net Salary</span>
              {renderSortIcon('averagePay')}
            </TableHead>
            <TableHead
              className="relative cursor-pointer hover:bg-muted/50 transition-colors text-right pr-8"
              onClick={() => handleSort('employeeCount')}
            >
              <span className="block">Employees</span>
              {renderSortIcon('employeeCount')}
            </TableHead>
            <TableHead
              className="relative cursor-pointer hover:bg-muted/50 transition-colors text-right pr-8"
              onClick={() => handleSort('incomePerEmployee')}
            >
              <span className="block">Revenue/Employee</span>
              {renderSortIcon('incomePerEmployee')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCompanyList.map((company: CompanyData, idx: number) => (
            <TableRow
              key={company.name}
              onClick={() => onCompanySelect(company.name)}
              className={`cursor-pointer hover:bg-muted/30 border-b border-border/50 group transition-colors ${idx % 2 === 1 ? 'bg-muted/10' : ''}`}
            >

              <TableCell className="font-semibold text-left group-hover:text-primary transition-colors">
                {/*<input
                  type="checkbox"
                  className="h-4 w-4 mr-2 accent-primary"
                  checked={selectedCompanies.includes(company.name)}
                  onChange={() => onToggleCompany && onToggleCompany(company.name)}
                  aria-label={`Select ${company.name} for comparison`}
                />*/}
                {company.name}
              </TableCell>
              <TableCell className="tabular-nums text-right pr-8">
                {numeral(company.totalIncome).format('0,0')}€
              </TableCell>
              <TableCell className={`tabular-nums text-right pr-8 ${
                (company.profit ?? 0) >= 0 ? 'text-success' : 'text-destructive'
              }`}>
                {numeral(company.profit).format('0,0')}€
              </TableCell>
              <TableCell className="tabular-nums text-right pr-8">
                {numeral(company.averagePay).format('0,0')}€
              </TableCell>
              <TableCell className="tabular-nums text-right pr-8">
                {company.employeeCount}
              </TableCell>
              <TableCell className="tabular-nums text-right pr-8">
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
