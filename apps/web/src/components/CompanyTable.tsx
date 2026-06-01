import React from 'react';
import Link from 'next/link';
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
import { Button } from '@/components/ui/button';
import { AveragePayFootnote } from '@/components/AveragePayFootnote';
import type { CompanySortKey, SortDirection } from '@/lib/api';

interface CompanyTableProps {
  selectedYearData: YearData | undefined;
  onCompanySelect: (company: CompanyData) => void;
  selectedCompanies?: string[];
  onToggleCompany?: (companyName: string) => void;
  profitMarginByName?: Map<string, number>;
  sortColumn: CompanySortKey;
  sortDirection: SortDirection;
  onSort: (column: CompanySortKey) => void;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

const CompanyTable: React.FC<CompanyTableProps> = ({
  selectedYearData,
  onCompanySelect,
  selectedCompanies = [],
  profitMarginByName,
  sortColumn,
  sortDirection,
  onSort,
  page,
  pageSize,
  total,
  onPageChange,
  isLoading = false,
}) => {
  if (!selectedYearData) {
    return null;
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;
  const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = Math.min(page * pageSize, total);

  const renderSortIcon = (column: CompanySortKey) => {
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
    <div className="w-full">
      <div className="hidden w-full overflow-x-auto md:block">
        <Table className="data-table min-w-[1072px] table-fixed whitespace-nowrap">
          <colgroup>
            <col className="w-[52px]" />
            <col />
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
                className="relative cursor-pointer select-none pr-8 text-left transition-colors hover:bg-primary/10"
                onClick={() => onSort('name')}
              >
                <span className="block">Company</span>
                {renderSortIcon('name')}
              </TableHead>
              <TableHead
                className={sortableHeaderClass}
                onClick={() => onSort('employeeCount')}
              >
                <span className="block">Employees</span>
                {renderSortIcon('employeeCount')}
              </TableHead>
              <TableHead
                className={sortableHeaderClass}
                onClick={() => onSort('totalIncome')}
              >
                <span className="block">Revenue</span>
                {renderSortIcon('totalIncome')}
              </TableHead>
              <TableHead
                className={sortableHeaderClass}
                onClick={() => onSort('profit')}
              >
                <span className="block">Profit</span>
                {renderSortIcon('profit')}
              </TableHead>
              <TableHead className="text-right">Margin</TableHead>
              <TableHead
                className={sortableHeaderClass}
                onClick={() => onSort('averagePay')}
              >
                <span className="block">Avg. Pay*</span>
                {renderSortIcon('averagePay')}
              </TableHead>
              <TableHead
                className={sortableHeaderClass}
                onClick={() => onSort('incomePerEmployee')}
              >
                <span className="block">Revenue/employee</span>
                {renderSortIcon('incomePerEmployee')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {selectedYearData.companyList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  {isLoading ? 'Loading companies...' : 'No companies match this query.'}
                </TableCell>
              </TableRow>
            ) : (
              selectedYearData.companyList.map((company: CompanyData, index: number) => {
                const selected = selectedCompanies.includes(company.name);
                const profitValue = company.profit ?? 0;
                const revenueValue = company.totalIncome ?? 0;
                const margin = profitMarginByName?.get(company.name) ??
                  (revenueValue ? profitValue / revenueValue : 0);

                return (
                  <TableRow
                    key={company.pib ?? company.name}
                    onClick={() => onCompanySelect(company)}
                    data-selected={selected}
                    className={`${index % 2 === 1 ? 'bg-muted/10' : ''} cursor-pointer border-b border-border/60 group`}
                  >
                    <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                      {(page - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell className="min-w-0 truncate text-left">
                      {company.pib ? (
                        <Link
                          href={`/company/${company.pib}/`}
                          onClick={(event) => event.stopPropagation()}
                          className="block truncate font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline group-hover:text-primary"
                        >
                          {company.name}
                        </Link>
                      ) : (
                        <span className="font-semibold">{company.name}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {company.employeeCount ?? 0}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {numeral(company.totalIncome ?? 0).format('0,0')}€
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono tabular-nums ${
                        profitValue >= 0 ? 'text-success' : 'text-destructive'
                      }`}
                    >
                      {numeral(company.profit ?? 0).format('0,0')}€
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono tabular-nums ${
                        margin >= 0 ? 'text-success' : 'text-destructive'
                      }`}
                    >
                      {numeral(margin).format('0.0%')}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {numeral(company.averagePay ?? 0).format('0,0')}€
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {numeral(company.incomePerEmployee ?? 0).format('0,0')}€
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: stacked cards keep every metric visible without horizontal scrolling. */}
      <div className="md:hidden">
        {selectedYearData.companyList.length === 0 ? (
          <div className="px-4 py-10 text-center text-muted-foreground">
            {isLoading ? 'Loading companies...' : 'No companies match this query.'}
          </div>
        ) : (
          selectedYearData.companyList.map((company: CompanyData, index: number) => {
            const rank = (page - 1) * pageSize + index + 1;
            const revenueValue = company.totalIncome ?? 0;
            const profitValue = company.profit ?? 0;
            const margin =
              profitMarginByName?.get(company.name) ??
              (revenueValue ? profitValue / revenueValue : 0);

            const content = (
              <>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 font-mono text-[0.7rem] tabular-nums text-muted-foreground">
                    {rank}
                  </span>
                  <span className="min-w-0 flex-1 break-words font-semibold text-foreground">
                    {company.name}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted-foreground">Revenue</dt>
                    <dd className="font-mono tabular-nums">{numeral(revenueValue).format('0,0')}€</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted-foreground">Profit</dt>
                    <dd className={`font-mono tabular-nums ${profitValue >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {numeral(profitValue).format('0,0')}€
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted-foreground">Employees</dt>
                    <dd className="font-mono tabular-nums">{company.employeeCount ?? 0}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted-foreground">Margin</dt>
                    <dd className={`font-mono tabular-nums ${margin >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {numeral(margin).format('0.0%')}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted-foreground">Avg. Pay*</dt>
                    <dd className="font-mono tabular-nums">{numeral(company.averagePay ?? 0).format('0,0')}€</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted-foreground">Rev/employee</dt>
                    <dd className="font-mono tabular-nums">{numeral(company.incomePerEmployee ?? 0).format('0,0')}€</dd>
                  </div>
                </dl>
              </>
            );

            return company.pib ? (
              <Link
                key={company.pib}
                href={`/company/${company.pib}/`}
                className="block border-b border-border/60 px-4 py-4 transition-colors hover:bg-primary/10"
              >
                {content}
              </Link>
            ) : (
              <div
                key={company.name}
                onClick={() => onCompanySelect(company)}
                className="block cursor-pointer border-b border-border/60 px-4 py-4 transition-colors hover:bg-primary/10"
              >
                {content}
              </div>
            );
          })
        )}
      </div>

      <AveragePayFootnote className="border-t border-border/70 px-4 py-3" />

      <div className="flex flex-col gap-3 border-t border-border/70 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span className="font-mono">
          Showing {pageStart}-{pageEnd} of {numeral(total).format('0,0')}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={!canGoPrevious || isLoading}
            className="h-8 rounded-md border-border/80 px-3 text-xs"
          >
            Previous
          </Button>
          <span className="min-w-24 text-center font-mono">
            Page {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={!canGoNext || isLoading}
            className="h-8 rounded-md border-border/80 px-3 text-xs"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CompanyTable;
