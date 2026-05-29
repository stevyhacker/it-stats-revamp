import { describe, expect, test } from "bun:test";
import { normalizeMunicipality, matchRegionName, prettyRegionName } from "./regions-geo";

describe("municipality normalization", () => {
  test("strips diacritics and lowercases", () => {
    expect(normalizeMunicipality("Nikšić")).toBe("niksic");
    expect(normalizeMunicipality("ŽABLJAK")).toBe("zabljak");
    expect(normalizeMunicipality("  Bijelo Polje ")).toBe("bijelo polje");
  });

  test("strips the 'Municipality' suffix used by geoBoundaries", () => {
    expect(normalizeMunicipality("Herceg Novi Municipality")).toBe("herceg novi");
    expect(normalizeMunicipality("Podgorica Municipality")).toBe("podgorica");
  });

  test("prettyRegionName drops the suffix for display", () => {
    expect(prettyRegionName("Podgorica Municipality")).toBe("Podgorica");
    expect(prettyRegionName("Bar")).toBe("Bar");
  });

  test("matchRegionName maps a bare data name to the suffixed feature name", () => {
    const geoNames = [
      "Podgorica Municipality",
      "Nikšić Municipality",
      "Herceg Novi Municipality",
      "Bijelo Polje Municipality",
    ];
    expect(matchRegionName("PODGORICA", geoNames)).toBe("Podgorica Municipality");
    expect(matchRegionName("Herceg-Novi", geoNames)).toBe("Herceg Novi Municipality");
    expect(matchRegionName("niksic", geoNames)).toBe("Nikšić Municipality");
    expect(matchRegionName("Unknownville", geoNames)).toBeNull();
  });
});
