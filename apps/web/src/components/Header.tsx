import React from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export const Header = () => {
  return (
    <header className="relative overflow-hidden gradient-primary text-white py-8 px-4 shadow-medium">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 backdrop-blur-sm" />
      <div className="relative max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-white/10 backdrop-blur-sm">
              <BarChart3 size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/90 bg-clip-text">
                Montenegro IT Stats
              </h1>
              <p className="text-primary-foreground/80 font-medium mt-1">
                Financial Performance & Growth Insights
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-primary-foreground/60">
              <TrendingUp size={16} />
              <span className="text-sm font-medium">Public Data from Tax Administration</span>
            </div>
            <ThemeToggle variant="default" className="border-white/20 hover:bg-white/10 [&_svg]:!text-white [&_svg]:hover:!text-white" />
          </div>
        </div>
      </div>
    </header>
  );
};