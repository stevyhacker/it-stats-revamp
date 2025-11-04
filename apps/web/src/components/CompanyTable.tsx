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
    return sortDirection === 'asc' ? (
      <ChevronUpIcon className="h-4 w-4 inline-block ml-1" />
    ) : (
      <ChevronDownIcon className="h-4 w-4 inline-block ml-1" />
    );
  };

  return (
    <div className="w-full overflow-x-auto border-2 border-border bg-card">
      <Table className="data-table">
        <TableHeader>
          <TableRow className="border-b-2 border-border bg-muted/30">
            <TableHead className="w-8 font-sans"></TableHead>
            <TableHead
              className="cursor-pointer hover:bg-primary/10 transition-all duration-150 font-sans font-bold text-xs uppercase tracking-wider"
              onClick={() => handleSort('name')}
            >
              <span className="text-primary">{'>'}</span> company_name
              {renderSortIcon('name')}
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-primary/10 transition-all duration-150 font-sans font-bold text-xs uppercase tracking-wider"
              onClick={() => handleSort('totalIncome')}
            >
              total_income
              {renderSortIcon('totalIncome')}
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-primary/10 transition-all duration-150 font-sans font-bold text-xs uppercase tracking-wider"
              onClick={() => handleSort('profit')}
            >
              profit
              {renderSortIcon('profit')}
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-primary/10 transition-all duration-150 font-sans font-bold text-xs uppercase tracking-wider"
              onClick={() => handleSort('averagePay')}
            >
              avg_pay
              {renderSortIcon('averagePay')}
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-primary/10 transition-all duration-150 font-sans font-bold text-xs uppercase tracking-wider"
              onClick={() => handleSort('employeeCount')}
            >
              employees
              {renderSortIcon('employeeCount')}
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-primary/10 transition-all duration-150 font-sans font-bold text-xs uppercase tracking-wider"
              onClick={() => handleSort('incomePerEmployee')}
            >
              income_per_emp
              {renderSortIcon('incomePerEmployee')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCompanyList.map((company: CompanyData, idx: number) => (
            <TableRow
              key={company.name}
              onClick={() => onCompanySelect(company.name)}
              className="cursor-pointer hover:bg-primary/5 border-t border-border group relative transition-colors duration-150"
            >
              <TableCell onClick={(e) => e.stopPropagation()} className="font-sans text-xs">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary border-2 border-primary"
                  checked={selectedCompanies.includes(company.name)}
                  onChange={() => onToggleCompany && onToggleCompany(company.name)}
                  aria-label={`Select ${company.name} for comparison`}
                />
              </TableCell>
              <TableCell className="font-sans font-medium group-hover:text-primary transition-colors duration-150">
                <div className="flex items-center gap-2">
                  <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">{'>'}</span>
                  <span>{company.name}</span>
                  {profitMarginByName && (
                    <span className="text-[10px] px-1.5 py-0.5 border border-success/40 bg-success/10 text-success font-sans">
                      {(((profitMarginByName.get(company.name) ?? 0) * 100).toFixed(1))}%
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-sans group-hover:font-bold transition-all duration-150">
                {numeral(company.totalIncome).format('0,0')}€
              </TableCell>
              <TableCell className={`font-sans group-hover:font-bold transition-all duration-150 ${
                (company.profit ?? 0) >= 0 ? 'text-success' : 'text-destructive'
              }`}>
                {numeral(company.profit).format('0,0')}€
              </TableCell>
              <TableCell className="font-sans group-hover:font-bold transition-all duration-150">
                {numeral(company.averagePay).format('0,0')}€
              </TableCell>
              <TableCell className="font-sans group-hover:font-bold transition-all duration-150">
                {company.employeeCount}
              </TableCell>
              <TableCell className="font-sans group-hover:font-bold transition-all duration-150">
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
