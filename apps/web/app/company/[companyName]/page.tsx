import { CompanyPage } from "@/components/CompanyPage";
import { fetchCachedApi } from "@/lib/server-api";
import type { CompanyData } from "@/types";

export default async function Page({
  params,
}: {
  params: Promise<{ companyName: string }>;
}) {
  const { companyName } = await params;
  const companyPib = decodeURIComponent(companyName);
  const history = await fetchCachedApi<CompanyData[]>(
    `/companies/${encodeURIComponent(companyPib)}`,
  ).catch((error) => {
    console.error(`Failed to load company ${companyPib}:`, error);
    return [];
  });

  return <CompanyPage companyPib={companyPib} initialHistory={history} />;
}
