import React from 'react';
import { BarChart3 } from 'lucide-react';

export const Header = () => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white dark:from-blue-900 dark:to-blue-950 py-6 px-4">
      <div className="max-w-7xl mx-auto flex items-center space-x-4">
        <BarChart3 size={32} />
        <div>
          <h1 className="text-2xl font-bold">Montenegrin Tech Companies Analysis</h1>
          <p className="text-blue-100">Financial Performance & Growth Insights</p>
        </div>
      </div>
    </header>
  );
};