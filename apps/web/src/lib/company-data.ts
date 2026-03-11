import rawCompanyData from "../../../../backups/companies.json";

export interface CompanyRecord {
  id: number;
  pib: string;
  maticniBroj: string | null;
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
}

export interface CompanyYearRecord {
  year: string;
  companyList: CompanyRecord[];
}

type RawCompanyRecord = Partial<CompanyRecord> & {
  name: string;
};

type RawCompanyYearRecord = {
  year: string | number;
  companyList: RawCompanyRecord[];
};

const typedRawCompanyData = rawCompanyData as RawCompanyYearRecord[];

export const companyData: CompanyYearRecord[] = typedRawCompanyData
  .map((yearRecord) => ({
    year: String(yearRecord.year),
    companyList: yearRecord.companyList.map((company) => ({
      id: Number(company.id ?? 0),
      pib: company.pib ?? "",
      maticniBroj: company.maticniBroj ?? null,
      name: company.name,
      address: company.address ?? null,
      municipality: company.municipality ?? null,
      activityCode: company.activityCode ?? null,
      activityName: company.activityName ?? null,
      employeeCount: company.employeeCount ?? null,
      averagePay: company.averagePay ?? null,
      yearId: Number(company.yearId ?? 0),
      totalIncome: company.totalIncome ?? null,
      profit: company.profit ?? null,
      incomePerEmployee: company.incomePerEmployee ?? null,
    })),
  }))
  .sort((a, b) => Number(b.year) - Number(a.year));

export const companyNames = Array.from(
  new Set(companyData.flatMap((yearRecord) => yearRecord.companyList.map((company) => company.name))),
).sort((a, b) => a.localeCompare(b));
