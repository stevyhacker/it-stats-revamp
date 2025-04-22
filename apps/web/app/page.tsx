"use client";

import { useState, useEffect } from "react";
import { data as rawData } from "../src/data";
import type { YearData } from "../src/types";
import { Dashboard } from "../src/components/Dashboard";

const data: YearData[] = rawData as YearData[];

export default function HomePage() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("darkMode") === "true";
    }
    return false;
  });
  const [selectedYear, setSelectedYear] = useState<string>(data[0]?.year || "");
  const years = data.map((d) => d.year);

  useEffect(() => {
    console.log("Dark mode useEffect triggered. isDark:", isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
  }, [isDark]);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
  };

  return (
    <main className="">
      <Dashboard
        years={years}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        isDark={isDark}
        toggleDarkMode={toggleDarkMode}
        data={data}
      />
    </main>
  );
}
