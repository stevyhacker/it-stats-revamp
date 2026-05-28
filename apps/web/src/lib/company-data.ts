import rawCompanyData from "../../../../backups/companies.json";
import {
  buildCleanCompanyData,
  type CleanCompanyRecord,
  type CleanCompanyYearRecord,
  type RawCompanyYearForCleanSubset,
} from "./company-filters";

export type CompanyRecord = CleanCompanyRecord;
export type CompanyYearRecord = CleanCompanyYearRecord;

const typedRawCompanyData = rawCompanyData as RawCompanyYearForCleanSubset[];

export const companyData: CompanyYearRecord[] = buildCleanCompanyData(typedRawCompanyData);

export const companyNames = Array.from(
  new Set(companyData.flatMap((yearRecord) => yearRecord.companyList.map((company) => company.name))),
).sort((a, b) => a.localeCompare(b));

export const companyPibs = Array.from(
  new Set(companyData.flatMap((yearRecord) => yearRecord.companyList.map((company) => company.pib))),
).sort((a, b) => a.localeCompare(b));
