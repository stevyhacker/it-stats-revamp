import React from 'react';
import { TrendingUp, Activity, Database } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export const Header = () => {
  return (
    <header className="relative border-b border-border bg-accent shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10 relative">
              <TrendingUp size={32} className="text-primary" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-foreground">
                Montenegro IT Statistics
              </h1>
              <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                <Activity size={14} className="text-primary" />
                <span>Financial data and growth metrics for Montenegrin tech companies</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 self-start sm:self-center">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-muted/30 text-xs">
              <Database size={12} className="text-primary" />
              <span className="text-muted-foreground font-medium">Data: Tax Administration</span>
            </div>
            <div className="status-indicator text-xs text-muted-foreground font-medium">
              <span>Live</span>
            </div>
            <ThemeToggle variant="default" className="border-border hover:bg-accent rounded-lg" />
          </div>
        </div>
      </div>
    </header>
  );
};