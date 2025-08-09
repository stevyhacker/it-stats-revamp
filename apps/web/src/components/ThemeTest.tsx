"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "./ThemeToggle";

export const ThemeTest = () => {
  const { theme, isDark } = useTheme();

  return (
    <div className="p-8 space-y-6">
      <Card className="glass-card shadow-soft">
        <CardHeader>
          <CardTitle>Theme System Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Current Theme:</h3>
              <p className="text-muted-foreground">{theme}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Is Dark Mode:</h3>
              <p className="text-muted-foreground">{isDark ? 'Yes' : 'No'}</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <ThemeToggle variant="default" />
            <span className="text-sm text-muted-foreground">Toggle theme</span>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Color Test:</h3>
            <div className="grid grid-cols-5 gap-2">
              <div className="w-16 h-16 bg-primary rounded-md flex items-center justify-center text-primary-foreground text-xs">
                Primary
              </div>
              <div className="w-16 h-16 bg-secondary rounded-md flex items-center justify-center text-secondary-foreground text-xs">
                Secondary
              </div>
              <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center text-muted-foreground text-xs">
                Muted
              </div>
              <div className="w-16 h-16 bg-accent rounded-md flex items-center justify-center text-accent-foreground text-xs">
                Accent
              </div>
              <div className="w-16 h-16 bg-destructive rounded-md flex items-center justify-center text-destructive-foreground text-xs">
                Destructive
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Chart Colors:</h3>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <div 
                  key={num}
                  className={`w-16 h-16 bg-chart-${num} rounded-md flex items-center justify-center text-white text-xs font-bold`}
                >
                  Chart {num}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};