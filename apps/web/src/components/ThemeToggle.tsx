"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  variant?: "default" | "floating";
  className?: string;
}

export const ThemeToggle = ({ variant = "default", className }: ThemeToggleProps) => {
  const { theme, toggleTheme, isDark } = useTheme();

  const baseClasses = "transition-all duration-300 hover:scale-105";
  const floatingClasses = "fixed bottom-8 right-8 z-50 rounded-full neu-button bg-card/80 backdrop-blur-sm border";
  const defaultClasses = "rounded-md";

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className={cn(
        baseClasses,
        variant === "floating" ? floatingClasses : defaultClasses,
        className
      )}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="relative w-5 h-5">
        <Sun
          className={cn(
            "w-5 h-5 absolute inset-0 transition-all duration-300 text-current",
            isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
          )}
        />
        <Moon
          className={cn(
            "w-5 h-5 absolute inset-0 transition-all duration-300 text-current",
            isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
          )}
        />
      </div>
    </Button>
  );
};