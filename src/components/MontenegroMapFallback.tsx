import React, { useState } from 'react';
import { getCompaniesPerRegion } from '../data/montenegro-geo';

interface MontenegroMapFallbackProps {
  width?: number;
  height?: number;
}

// Simple map coordinates for Montenegro regions
const regions = [
  { id: "podgorica", name: "Podgorica", path: "M 120 140 L 140 140 L 140 150 L 120 150 Z", center: [130, 145] },
  { id: "niksic", name: "Nikšić", path: "M 80 70 L 100 70 L 100 80 L 80 80 Z", center: [90, 75] },
  { id: "bar", name: "Bar", path: "M 100 200 L 120 200 L 120 210 L 100 210 Z", center: [110, 205] },
  { id: "budva", name: "Budva", path: "M 80 180 L 100 180 L 100 190 L 80 190 Z", center: [90, 185] },
  { id: "herceg-novi", name: "Herceg Novi", path: "M 50 140 L 70 140 L 70 150 L 50 150 Z", center: [60, 145] },
  { id: "bijelo-polje", name: "Bijelo Polje", path: "M 160 30 L 180 30 L 180 40 L 160 40 Z", center: [170, 35] },
  { id: "kotor", name: "Kotor", path: "M 70 170 L 90 170 L 90 180 L 70 180 Z", center: [80, 175] },
  { id: "tivat", name: "Tivat", path: "M 60 170 L 80 170 L 80 180 L 60 180 Z", center: [70, 175] }
];

export const MontenegroMapFallback = ({ width = 600, height = 400 }: MontenegroMapFallbackProps) => {
  const [tooltip, setTooltip] = useState<{
    content: string;
    position: { x: number; y: number };
  } | null>(null);
  
  // Get company count per region
  const companiesPerRegion = getCompaniesPerRegion();
  
  // Create a color scale based on the number of companies
  const getRegionColor = (regionId: string) => {
    const count = companiesPerRegion[regionId] || 0;
    
    if (count === 0) return '#e5e7eb'; // Light gray for regions with no companies
    if (count <= 2) return '#93c5fd'; // Light blue
    if (count <= 5) return '#60a5fa'; // Medium blue
    if (count <= 10) return '#3b82f6'; // Regular blue
    return '#1d4ed8'; // Dark blue for regions with more than 10 companies
  };

  // Calculate a scaling factor to fit the map into the provided width/height
  const viewBoxWidth = 250;
  const viewBoxHeight = 250;
  const scaleFactor = Math.min(width / viewBoxWidth, height / viewBoxHeight);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        ICT Company Distribution
      </h2>
      
      <div className="relative">
        <svg 
          width={width} 
          height={height} 
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          style={{ margin: '0 auto', display: 'block' }}
        >
          {/* Draw Montenegro outline */}
          <path 
            d="M 40 120 
               C 40 80 60 50 100 40 
               C 140 30 180 40 200 70
               C 220 100 210 150 180 180
               C 150 210 90 220 60 190
               C 30 160 40 120 40 120 Z" 
            fill="#f3f4f6" 
            stroke="#d1d5db" 
            strokeWidth="2"
          />
          
          {/* Draw regions */}
          {regions.map(region => {
            const count = companiesPerRegion[region.id] || 0;
            
            return (
              <g key={region.id}>
                <path
                  d={region.path}
                  fill={getRegionColor(region.id)}
                  stroke="#FFFFFF"
                  strokeWidth="1"
                  onMouseEnter={(e) => {
                    setTooltip({
                      content: `${region.name}: ${count} companies`,
                      position: { x: e.clientX, y: e.clientY }
                    });
                  }}
                  onMouseLeave={() => {
                    setTooltip(null);
                  }}
                />
                
                {/* Add region name if there's space */}
                {count > 0 && (
                  <text
                    x={region.center[0]}
                    y={region.center[1]}
                    textAnchor="middle"
                    fontSize="8"
                    fill="#000000"
                    className="select-none pointer-events-none"
                  >
                    {count}
                  </text>
                )}
              </g>
            );
          })}
          
          {/* Add a title/label */}
          <text
            x={viewBoxWidth / 2}
            y={15}
            textAnchor="middle"
            fontSize="12"
            fontWeight="bold"
            fill="#4b5563"
            className="dark:fill-white"
          >
            Montenegro
          </text>
        </svg>
        
        {tooltip && (
          <div 
            className="absolute z-10 px-3 py-2 text-sm bg-gray-900 dark:bg-gray-700 text-white rounded shadow-lg pointer-events-none"
            style={{ 
              left: `${tooltip.position.x + 10}px`, 
              top: `${tooltip.position.y - 40}px`
            }}
          >
            {tooltip.content}
          </div>
        )}
      </div>
      
      <div className="mt-6 flex justify-center">
        <div className="flex items-center space-x-8">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-[#e5e7eb] mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">0 companies</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-[#93c5fd] mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">1-2 companies</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-[#60a5fa] mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">3-5 companies</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-[#3b82f6] mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">6-10 companies</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-[#1d4ed8] mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">10+ companies</span>
          </div>
        </div>
      </div>
      
      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
        Distribution of ICT companies across Montenegro municipalities
      </p>
    </div>
  );
}; 