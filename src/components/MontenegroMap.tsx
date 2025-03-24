import React, { useState } from 'react';
import { 
  ComposableMap, 
  Geographies, 
  Geography,
  ZoomableGroup
} from 'react-simple-maps';
import { montenegroGeoData, getCompaniesPerRegion } from '../data/montenegro-geo';

interface MontenegroMapProps {
  width?: number;
  height?: number;
}

export const MontenegroMap = ({ width = 600, height = 400 }: MontenegroMapProps) => {
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

  // Handle mousemove for better tooltip positioning
  const handleMouseMove = (e: React.MouseEvent) => {
    if (tooltip) {
      setTooltip({
        ...tooltip,
        position: { x: e.clientX, y: e.clientY }
      });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        ICT Company Distribution
      </h2>
      
      <div 
        className="relative" 
        style={{ width, height }}
        onMouseMove={handleMouseMove}
      >
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 6000,
            center: [19.3, 42.7] // Centered on Montenegro
          }}
          width={width}
          height={height}
        >
          <ZoomableGroup>
            <Geographies geography={montenegroGeoData}>
              {({ geographies }) =>
                geographies.map(geo => {
                  const regionId = geo.properties.id;
                  const count = companiesPerRegion[regionId] || 0;
                  
                  return (
                    <Geography
                      key={regionId}
                      geography={geo}
                      fill={getRegionColor(regionId)}
                      stroke="#FFFFFF"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none" },
                        hover: { outline: "none", fill: "#dbeafe" },
                        pressed: { outline: "none", fill: "#bfdbfe" },
                      }}
                      onMouseEnter={(e) => {
                        const { name } = geo.properties;
                        setTooltip({
                          content: `${name}: ${count} companies`,
                          position: { x: e.clientX, y: e.clientY }
                        });
                      }}
                      onMouseLeave={() => {
                        setTooltip(null);
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
        
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