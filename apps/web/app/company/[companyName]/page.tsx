import { CompanyPage } from "@/components/CompanyPage";
import { fetchApi } from "@/lib/api";
import type { CompanyData } from "@/types";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ companyName: string }>;
}) {
  const { companyName } = await params;
  const companyPib = decodeURIComponent(companyName);
  const history = await fetchApi<CompanyData[]>(
    `/companies/${encodeURIComponent(companyPib)}`,
    undefined,
    { next: { revalidate: 300 } },
  ).catch((error) => {
    console.error(`Failed to load company ${companyPib}:`, error);
    return [];
  });

  return <CompanyPage companyPib={companyPib} initialHistory={history} />;
}
