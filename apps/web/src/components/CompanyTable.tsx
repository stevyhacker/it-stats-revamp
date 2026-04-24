import React, { useMemo, useState } from 'react';
import numeral from 'numeral';
import { CompanyData, YearData } from '../types';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
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

const CompanyTable: React.FC<CompanyTableProps> = ({
  selectedYearData,
  onCompanySelect,
  selectedCompanies = [],
  profitMarginByName,
}) => {
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

      if (['totalIncome', 'profit', 'employeeCount', 'averagePay', 'incomePerEmployee'].includes(sortColumn)) {
        const numA = parseFloat(String(aValue)) || 0;
        const numB = parseFloat(String(bValue)) || 0;
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }

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
      <Icon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
    );
  };

  const sortableHeaderClass =
    'relative cursor-pointer select-none pr-8 text-right transition-colors hover:bg-primary/10';

  return (
    <div className="w-full overflow-x-auto">
      <Table className="data-table min-w-[1000px] table-fixed whitespace-nowrap">
        <colgroup>
          <col className="w-[52px]" />
          <col className="w-[260px]" />
          <col className="w-[92px]" />
          <col className="w-[138px]" />
          <col className="w-[138px]" />
          <col className="w-[94px]" />
          <col className="w-[138px]" />
          <col className="w-[159px]" />
        </colgroup>
        <TableHeader>
          <TableRow className="border-b border-border/80 bg-muted/40 hover:bg-muted/40">
            <TableHead className="text-right">#</TableHead>
            <TableHead
              className="relative cursor-pointer select-none text-left transition-colors hover:bg-primary/10"
              onClick={() => handleSort('name')}
            >
              <span className="block">Company</span>
              {renderSortIcon('name')}
            </TableHead>
            <TableHead
              className={sortableHeaderClass}
              onClick={() => handleSort('employeeCount')}
            >
              <span className="block">Employees</span>
              {renderSortIcon('employeeCount')}
            </TableHead>
            <TableHead
              className={sortableHeaderClass}
              onClick={() => handleSort('totalIncome')}
            >
              <span className="block">Revenue</span>
              {renderSortIcon('totalIncome')}
            </TableHead>
            <TableHead
              className={sortableHeaderClass}
              onClick={() => handleSort('profit')}
            >
              <span className="block">Profit</span>
              {renderSortIcon('profit')}
            </TableHead>
            <TableHead className="text-right">Margin</TableHead>
            <TableHead
              className={sortableHeaderClass}
              onClick={() => handleSort('averagePay')}
            >
              <span className="block">Avg net salary</span>
              {renderSortIcon('averagePay')}
            </TableHead>
            <TableHead
              className={sortableHeaderClass}
              onClick={() => handleSort('incomePerEmployee')}
            >
              <span className="block">Revenue/employee</span>
              {renderSortIcon('incomePerEmployee')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCompanyList.map((company: CompanyData, index: number) => {
            const selected = selectedCompanies.includes(company.name);
            const profitValue = company.profit ?? 0;
            const revenueValue = company.totalIncome ?? 0;
            const margin = profitMarginByName?.get(company.name) ??
              (revenueValue ? profitValue / revenueValue : 0);

            return (
              <TableRow
                key={company.name}
                onClick={() => onCompanySelect(company.name)}
                data-selected={selected}
                className={`${index % 2 === 1 ? 'bg-muted/10' : ''} cursor-pointer border-b border-border/60 group`}
              >
                <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell className="max-w-[18rem] truncate font-semibold text-left group-hover:text-primary">
                  {company.name}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {company.employeeCount}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {numeral(company.totalIncome).format('0,0')}€
                </TableCell>
                <TableCell
                  className={`text-right font-mono tabular-nums ${
                    profitValue >= 0 ? 'text-success' : 'text-destructive'
                  }`}
                >
                  {numeral(company.profit).format('0,0')}€
                </TableCell>
                <TableCell
                  className={`text-right font-mono tabular-nums ${
                    margin >= 0 ? 'text-success' : 'text-destructive'
                  }`}
                >
                  {numeral(margin).format('0.0%')}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {numeral(company.averagePay).format('0,0')}€
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {numeral(company.incomePerEmployee).format('0,0')}€
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default CompanyTable;
