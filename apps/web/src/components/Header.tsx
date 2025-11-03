import React from 'react';
import { Terminal, Activity, Database } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export const Header = () => {
  return (
    <header className="relative border-b-2 border-border bg-card">
      {/* Terminal window decoration */}
      <div className="terminal-header">
        <div className="flex items-center gap-2">
          <div className="terminal-dots" />
          <div className="w-3 h-3 rounded-full bg-success" />
        </div>
        <div className="flex-1 flex justify-center">
          <span className="text-xs text-muted-foreground font-mono">
            ~/montenegro-it-stats
          </span>
        </div>
        <ThemeToggle variant="default" className="border-border hover:bg-accent" />
      </div>
      
      {/* Main header content */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 border-2 border-primary bg-background relative">
              <Terminal size={32} className="text-primary" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight crt-glow flex items-center gap-2">
                <span className="text-primary">$</span>
                <span>montenegro-it-stats</span>
              </h1>
              <p className="text-sm text-muted-foreground font-mono mt-2 flex items-center gap-2">
                <Activity size={14} className="text-terminal-cyan" />
                <span>Analyzing financial data & growth metrics</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 self-start sm:self-center">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 border border-border bg-muted/30 text-xs font-mono">
              <Database size={12} className="text-primary" />
              <span className="text-muted-foreground">src: tax-admin</span>
            </div>
            <div className="status-indicator text-xs font-mono text-muted-foreground">
              <span>live</span>
            </div>
          </div>
        </div>
        
        {/* Command line style info bar */}
        <div className="mt-4 command-line text-xs flex flex-wrap items-center gap-2">
          <span className="text-primary">{'>'}</span>
          <span className="text-muted-foreground">query:</span>
          <span className="text-foreground">SELECT * FROM companies WHERE country = 'Montenegro'</span>
          <span className="text-success ml-auto">● OK</span>
        </div>
      </div>
    </header>
  );
};