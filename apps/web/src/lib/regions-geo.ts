// Helpers for matching the dataset's municipality strings to the GeoJSON
// feature names. The geoBoundaries ADM1 file names features like
// "Podgorica Municipality" / "Nikšić Municipality", while the dataset stores
// bare city names (possibly upper-cased and accented), so normalization strips
// diacritics, casing, separators, and the "municipality"/"opština" word.

export function normalizeMunicipality(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics
    .toLowerCase()
    .replace(/\b(municipality|op[sš]tina|opstina)\b/g, "")
    .replace(/[-_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Drop the trailing " Municipality" for display purposes.
export function prettyRegionName(geoName: string): string {
  return geoName.replace(/\s+Municipality$/i, "").trim();
}

// Explicit overrides for spelling mismatches that normalization can't resolve.
// key = normalized dataset value, value = exact GeoJSON feature name.
const OVERRIDES: Record<string, string> = {
  // e.g. "tuzi": "Podgorica Municipality" if the dataset lists a region the
  // geoBoundaries ADM1 file does not contain. Fill in after enumerating the
  // real /summary municipality values.
};

// Given a dataset municipality value and the list of GeoJSON feature names,
// return the exact feature name it maps to, or null when unmatched.
export function matchRegionName(dataName: string, geoNames: string[]): string | null {
  const norm = normalizeMunicipality(dataName);
  if (!norm) return null;
  if (OVERRIDES[norm]) return OVERRIDES[norm];
  const hit = geoNames.find((g) => normalizeMunicipality(g) === norm);
  return hit ?? null;
}
