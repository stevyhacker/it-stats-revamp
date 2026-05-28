import { describe, expect, test } from "bun:test";
import {
  buildCleanCompanyData,
  deriveSector,
  filterCompanies,
  getCompanyFilterOptions,
} from "./company-filters";

const companies = [
  {
    name: "Softworks",
    activityCode: "6201",
    activityName: "Računarsko programiranje",
    municipality: "Podgorica",
    totalIncome: 1_000_000,
    employeeCount: 12,
  },
  {
    name: "Builder",
    activityCode: "4120",
    activityName: "Izgradnja stambenih i nestambenih zgrada",
    municipality: "Nikšić",
    totalIncome: 2_000_000,
    employeeCount: 20,
  },
  {
    name: "Cafe",
    activityCode: "5610",
    activityName: "Djelatnosti restorana i pokretnih ugost. objekta",
    municipality: "Podgorica",
    totalIncome: 100_000,
    employeeCount: 5,
  },
];

describe("company filters", () => {
  test("derives stable broad sectors from Montenegro activity codes", () => {
    expect(deriveSector("6201", "Računarsko programiranje")).toBe("Technology");
    expect(deriveSector("4120", "Izgradnja stambenih i nestambenih zgrada")).toBe("Construction");
    expect(deriveSector("5610", "Djelatnosti restorana")).toBe("Hospitality");
  });

  test("filters companies by sector and activity category together with numeric filters", () => {
    expect(
      filterCompanies(companies, {
        sector: "Technology",
        category: "Računarsko programiranje",
        minRevenue: "500000",
      }).map((company) => company.name),
    ).toEqual(["Softworks"]);

    expect(filterCompanies(companies, { sector: "Technology", minEmployees: "20" })).toEqual([]);
  });

  test("builds sorted sector and category options from the selected-year companies", () => {
    expect(getCompanyFilterOptions(companies)).toEqual({
      sectors: ["Construction", "Hospitality", "Technology"],
      categories: [
        "Djelatnosti restorana i pokretnih ugost. objekta",
        "Izgradnja stambenih i nestambenih zgrada",
        "Računarsko programiranje",
      ],
      municipalities: ["Nikšić", "Podgorica"],
    });
  });

  test("builds the default clean dataset for completed years and audited company rows", () => {
    const rawData = [
      {
        year: "2026",
        companyList: [
          {
            name: "Future Filing",
            pib: "99999999",
            averagePay: 900,
            legalStatus: "D.O.O.",
            activity: "6201, Kompjutersko programiranje",
          },
        ],
      },
      {
        year: "2025",
        companyList: [
          {
            name: "Clean General Company",
            pib: "11111111",
            averagePay: 650,
            legalStatus: "D.O.O.",
            activity: "4673, Trgovina na veliko",
          },
          {
            name: "Sole Proprietor",
            pib: "22222222",
            averagePay: 650,
            legalStatus: "Preduzetnik",
            activity: "6201, Kompjutersko programiranje",
          },
          {
            name: "Suspicious Pay",
            pib: "33333333",
            averagePay: 299,
            legalStatus: "D.O.O.",
            activity: "5610, Djelatnosti restorana",
          },
        ],
      },
    ];

    expect(buildCleanCompanyData(rawData, 2026)).toEqual([
      {
        year: "2025",
        companyList: [
          expect.objectContaining({
            name: "Clean General Company",
            activityCode: "4673",
            activityName: "Trgovina na veliko",
            legalStatus: "D.O.O.",
            averagePay: 650,
          }),
        ],
      },
    ]);
  });
});
