import { unstable_cache } from "next/cache";
import { apiUrl } from "@/lib/api";

const API_REVALIDATE_SECONDS = 300;

const readCachedApi = unstable_cache(
  async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    return response.json() as Promise<unknown>;
  },
  ["it-stats-api"],
  { revalidate: API_REVALIDATE_SECONDS, tags: ["it-stats-api"] },
);

export async function fetchCachedApi<T>(path: string, params?: URLSearchParams): Promise<T> {
  return readCachedApi(apiUrl(path, params)) as Promise<T>;
}
