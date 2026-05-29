import { describe, expect, test } from "bun:test";
import { buildRegionParams } from "./api";

describe("region API params", () => {
  test("sends region trend metric names without mapping companies to revenue", () => {
    expect(buildRegionParams({ metric: "companies", limit: 6 }).toString()).toBe("metric=companies&limit=6");
    expect(buildRegionParams({ metric: "employees", limit: 6 }).toString()).toBe("metric=employees&limit=6");
    expect(buildRegionParams({ metric: "avgPay", limit: 6 }).toString()).toBe("metric=avgPay&limit=6");
    expect(buildRegionParams({ metric: "revenue", limit: 6 }).toString()).toBe("metric=revenue&limit=6");
  });
});
