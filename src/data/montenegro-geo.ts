// Simplified GeoJSON for Montenegro municipalities
export const montenegroGeoData = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "name": "Podgorica", "id": "podgorica" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[19.2, 42.4], [19.4, 42.4], [19.4, 42.5], [19.2, 42.5], [19.2, 42.4]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Nikšić", "id": "niksic" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[18.8, 42.7], [19.0, 42.7], [19.0, 42.8], [18.8, 42.8], [18.8, 42.7]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Bar", "id": "bar" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[19.0, 42.0], [19.2, 42.0], [19.2, 42.1], [19.0, 42.1], [19.0, 42.0]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Budva", "id": "budva" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[18.8, 42.2], [19.0, 42.2], [19.0, 42.3], [18.8, 42.3], [18.8, 42.2]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Herceg Novi", "id": "herceg-novi" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[18.5, 42.4], [18.7, 42.4], [18.7, 42.5], [18.5, 42.5], [18.5, 42.4]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Bijelo Polje", "id": "bijelo-polje" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[19.6, 43.0], [19.8, 43.0], [19.8, 43.1], [19.6, 43.1], [19.6, 43.0]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Kotor", "id": "kotor" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[18.7, 42.3], [18.9, 42.3], [18.9, 42.4], [18.7, 42.4], [18.7, 42.3]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Tivat", "id": "tivat" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[18.6, 42.3], [18.8, 42.3], [18.8, 42.4], [18.6, 42.4], [18.6, 42.3]]]
      }
    }
  ]
};

// Mock company location data (since the actual data doesn't include location information)
export const companyLocations: Record<string, string> = {
  "Coinis": "podgorica",
  "CoreIT": "podgorica",
  "Amplitudo": "podgorica",
  "Fleka": "podgorica",
  "Logate": "podgorica",
  "Bild Studio": "podgorica", 
  "Codeus": "podgorica",
  "Uhura Solutions": "podgorica",
  "Alicorn": "podgorica",
  "Montecha": "podgorica",
  "Taurons": "niksic",
  "Codingo": "budva",
  "Omnitech": "bar",
  "Winsoft": "herceg-novi",
  "Zero Gravity": "podgorica",
  "Datum Solutions": "bijelo-polje",
  "Focaloid": "kotor",
  "Fincore": "tivat",
  "New Frontier": "podgorica",
  "Inperio": "podgorica"
};

// This function counts companies per region based on our mock data
export const getCompaniesPerRegion = () => {
  const regionCounts: Record<string, number> = {};
  
  Object.values(companyLocations).forEach(region => {
    if (regionCounts[region]) {
      regionCounts[region]++;
    } else {
      regionCounts[region] = 1;
    }
  });
  
  return regionCounts;
}; 