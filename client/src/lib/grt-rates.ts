// New Mexico GRT rates by location
export const NM_GRT_RATES = [
  { value: 5.375, label: "Rural Areas (5.375%)", locationCode: "NM-5375" },
  { value: 6.8125, label: "Hobbs (6.8125%)", locationCode: "NM-68125" },
  { value: 6.9375, label: "Clovis (6.9375%)", locationCode: "NM-69375" },
  { value: 7.0625, label: "Carlsbad (7.0625%)", locationCode: "NM-70625" },
  { value: 7.1875, label: "Farmington (7.1875%)", locationCode: "NM-71875" },
  { value: 7.3125, label: "Roswell (7.3125%)", locationCode: "NM-73125" },
  { value: 7.4375, label: "Gallup (7.4375%)", locationCode: "NM-74375" },
  { value: 7.5625, label: "Las Cruces (7.5625%)", locationCode: "NM-75625" },
  { value: 7.8125, label: "Albuquerque - Standard (7.8125%)", locationCode: "NM-78125" },
  { value: 8.1875, label: "Albuquerque - High Zone (8.1875%)", locationCode: "NM-81875" },
  { value: 8.4375, label: "Santa Fe (8.4375%)", locationCode: "NM-84375" },
  { value: 8.6875, label: "Maximum Rate (8.6875%)", locationCode: "NM-86875" },
];

export const getGRTRateByCity = (city: string): number => {
  const cityLower = city.toLowerCase().trim();
  
  const cityRates: Record<string, number> = {
    'albuquerque': 7.8125,
    'santa fe': 8.4375,
    'hobbs': 6.8125,
    'las cruces': 7.5625,
    'roswell': 7.3125,
    'farmington': 7.1875,
    'clovis': 6.9375,
    'alamogordo': 6.8125,
    'carlsbad': 7.0625,
    'gallup': 7.4375,
  };

  return cityRates[cityLower] || 5.375; // Default to rural rate
};

export const formatGRTRate = (rate: number): string => {
  return `${rate}%`;
};

export const getLocationCodeByRate = (rate: number): string => {
  const rateEntry = NM_GRT_RATES.find(r => Math.abs(r.value - rate) < 0.001);
  return rateEntry?.locationCode || `NM-${rate.toString().replace('.', '')}`;
};
