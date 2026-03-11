import { CompanyPage } from "@/components/CompanyPage";
import { companyNames } from "@/lib/company-data";

export const dynamicParams = false;

export function generateStaticParams() {
  return companyNames.map((companyName) => ({ companyName }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ companyName: string }>;
}) {
  const { companyName } = await params;

  return <CompanyPage companyName={decodeURIComponent(companyName)} />;
}
