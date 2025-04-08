import React, { useState, useMemo } from 'react';
import numeral from 'numeral';
import { CompanyData, YearData } from '../types';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/solid';

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
    <div className="overflow-x-auto relative">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 ease-in-out"
              onClick={() => handleSort('name')}
            >
              Company Name
              {renderSortIcon('name')}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 ease-in-out"
              onClick={() => handleSort('totalIncome')}
            >
              Total Income
              {renderSortIcon('totalIncome')}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 ease-in-out"
              onClick={() => handleSort('profit')}
            >
              Profit
              {renderSortIcon('profit')}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 ease-in-out"
              onClick={() => handleSort('employeeCount')}
            >
              Employees
              {renderSortIcon('employeeCount')}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 ease-in-out"
              onClick={() => handleSort('averagePay')}
            >
              Avg Monthly Pay
              {renderSortIcon('averagePay')}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 ease-in-out"
              onClick={() => handleSort('incomePerEmployee')}
            >
              Income/Employee
              {renderSortIcon('incomePerEmployee')}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {sortedCompanyList.map((company: CompanyData) => (
            <tr
              key={company.name}
              onClick={() => onCompanySelect(company.name)}
              className="hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer"
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                {company.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">
                {numeral(company.totalIncome).format('0,0')}€
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">
                {numeral(company.profit).format('0,0')}€
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">
                {company.employeeCount}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">
                {numeral(company.averagePay).format('0,0')}€
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">
                {numeral(company.incomePerEmployee).format('0,0')}€
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CompanyTable;
