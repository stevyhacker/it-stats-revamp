import React from 'react';
import { TrendingUp, Activity, Database } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export const Header = () => {
  return (
    <header className="relative border-b border-border bg-accent shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-lg bg-primary/10 relative shrink-0">
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-success rounded-full" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-display font-bold tracking-tight text-foreground">
                Montenegro IT Statistics
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2 flex items-center gap-1 sm:gap-2">
                <Activity size={12} className="text-primary" />
                <span>Financial data and growth metrics for Montenegrin tech companies</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-center w-full sm:w-auto justify-end">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-muted/30 text-xs">
              <Database size={12} className="text-primary" />
              <span className="text-muted-foreground font-medium">Data: Tax Administration</span>
            </div>
            <div className="status-indicator text-xs text-muted-foreground font-medium">
              <span>Live</span>
            </div>
            <ThemeToggle variant="default" className="border-border hover:bg-accent rounded-lg h-9 w-9 sm:h-10 sm:w-10" />
          </div>
        </div>
      </div>
    </header>
  );
};