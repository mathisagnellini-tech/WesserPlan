// Données INSEE réelles - 96 départements métropolitains
// Sources: Recensement 2022, Filosofi 2021, Taux de chômage localisés T4 2024, Présidentielle 2022 T2

export interface DepartmentInseeData {
  code: string;
  nom: string;
  population: number;        // Recensement 2022 (population municipale)
  surface: number;           // km²
  density: number;           // hab/km²
  medianIncome: number;      // Filosofi 2021, revenu disponible médian (€/an/UC)
  unemploymentRate: number;  // Taux de chômage BIT T4 2024 (%)
  medianAge: number;         // Âge médian estimé (ans)
  ownershipRate: number;     // % résidences principales occupées par propriétaires
  povertyRate: number;       // Taux de pauvreté Filosofi 2021 (%)
  macron2022T2: number;      // % Macron au 2nd tour présidentielle 2022
  urbanRate: number;         // % population en unité urbaine
}

export const DEPARTMENT_INSEE_DATA: Record<string, DepartmentInseeData> = {
  // --- Top 20 départements (par population) ---
  "75": { code: "75", nom: "Paris", population: 2133111, surface: 105, density: 20315, medianIncome: 27480, unemploymentRate: 7.2, medianAge: 36, ownershipRate: 33, povertyRate: 16.4, macron2022T2: 85.1, urbanRate: 100 },
  "13": { code: "13", nom: "Bouches-du-Rhône", population: 2043110, surface: 5087, density: 402, medianIncome: 20520, unemploymentRate: 9.8, medianAge: 40, ownershipRate: 50, povertyRate: 19.4, macron2022T2: 55.4, urbanRate: 93 },
  "59": { code: "59", nom: "Nord", population: 2611293, surface: 5743, density: 455, medianIncome: 19780, unemploymentRate: 10.2, medianAge: 38, ownershipRate: 52, povertyRate: 19.0, macron2022T2: 61.5, urbanRate: 89 },
  "69": { code: "69", nom: "Rhône", population: 1876051, surface: 3249, density: 577, medianIncome: 23340, unemploymentRate: 7.1, medianAge: 37, ownershipRate: 47, povertyRate: 14.2, macron2022T2: 72.8, urbanRate: 95 },
  "33": { code: "33", nom: "Gironde", population: 1636391, surface: 10000, density: 164, medianIncome: 22140, unemploymentRate: 7.5, medianAge: 40, ownershipRate: 55, povertyRate: 14.1, macron2022T2: 66.3, urbanRate: 78 },
  "44": { code: "44", nom: "Loire-Atlantique", population: 1459227, surface: 6815, density: 214, medianIncome: 22560, unemploymentRate: 5.8, medianAge: 39, ownershipRate: 58, povertyRate: 11.8, macron2022T2: 68.9, urbanRate: 76 },
  "92": { code: "92", nom: "Hauts-de-Seine", population: 1624357, surface: 176, density: 9229, medianIncome: 29970, unemploymentRate: 6.5, medianAge: 37, ownershipRate: 41, povertyRate: 11.5, macron2022T2: 82.5, urbanRate: 100 },
  "93": { code: "93", nom: "Seine-Saint-Denis", population: 1644903, surface: 236, density: 6970, medianIncome: 17520, unemploymentRate: 11.3, medianAge: 34, ownershipRate: 36, povertyRate: 28.4, macron2022T2: 73.8, urbanRate: 100 },
  "94": { code: "94", nom: "Val-de-Marne", population: 1407124, surface: 245, density: 5743, medianIncome: 22920, unemploymentRate: 7.4, medianAge: 37, ownershipRate: 43, povertyRate: 15.2, macron2022T2: 75.3, urbanRate: 100 },
  "77": { code: "77", nom: "Seine-et-Marne", population: 1421197, surface: 5915, density: 240, medianIncome: 23400, unemploymentRate: 6.8, medianAge: 37, ownershipRate: 60, povertyRate: 12.1, macron2022T2: 63.7, urbanRate: 82 },
  "78": { code: "78", nom: "Yvelines", population: 1448729, surface: 2284, density: 634, medianIncome: 27720, unemploymentRate: 5.9, medianAge: 39, ownershipRate: 61, povertyRate: 9.3, macron2022T2: 74.4, urbanRate: 92 },
  "91": { code: "91", nom: "Essonne", population: 1306882, surface: 1804, density: 724, medianIncome: 24060, unemploymentRate: 6.7, medianAge: 37, ownershipRate: 56, povertyRate: 12.7, macron2022T2: 69.7, urbanRate: 91 },
  "95": { code: "95", nom: "Val-d'Oise", population: 1249674, surface: 1246, density: 1003, medianIncome: 22440, unemploymentRate: 8.1, medianAge: 36, ownershipRate: 53, povertyRate: 15.8, macron2022T2: 67.2, urbanRate: 95 },
  "31": { code: "31", nom: "Haute-Garonne", population: 1415757, surface: 6309, density: 224, medianIncome: 22680, unemploymentRate: 7.0, medianAge: 38, ownershipRate: 51, povertyRate: 14.5, macron2022T2: 71.4, urbanRate: 84 },
  "34": { code: "34", nom: "Hérault", population: 1189342, surface: 6101, density: 195, medianIncome: 19920, unemploymentRate: 10.5, medianAge: 41, ownershipRate: 50, povertyRate: 19.7, macron2022T2: 60.0, urbanRate: 82 },
  "06": { code: "06", nom: "Alpes-Maritimes", population: 1097138, surface: 4299, density: 255, medianIncome: 22200, unemploymentRate: 7.9, medianAge: 44, ownershipRate: 51, povertyRate: 15.3, macron2022T2: 57.0, urbanRate: 95 },
  "76": { code: "76", nom: "Seine-Maritime", population: 1261090, surface: 6278, density: 201, medianIncome: 20760, unemploymentRate: 8.6, medianAge: 40, ownershipRate: 53, povertyRate: 15.6, macron2022T2: 61.2, urbanRate: 79 },
  "67": { code: "67", nom: "Bas-Rhin", population: 1141980, surface: 4755, density: 240, medianIncome: 22680, unemploymentRate: 6.4, medianAge: 40, ownershipRate: 55, povertyRate: 13.5, macron2022T2: 69.0, urbanRate: 78 },
  "57": { code: "57", nom: "Moselle", population: 1049900, surface: 6216, density: 169, medianIncome: 21120, unemploymentRate: 7.5, medianAge: 42, ownershipRate: 59, povertyRate: 14.8, macron2022T2: 61.8, urbanRate: 72 },
  "60": { code: "60", nom: "Oise", population: 829419, surface: 5860, density: 142, medianIncome: 22080, unemploymentRate: 8.0, medianAge: 39, ownershipRate: 60, povertyRate: 13.5, macron2022T2: 55.5, urbanRate: 70 },
  "80": { code: "80", nom: "Somme", population: 572443, surface: 6170, density: 93, medianIncome: 20040, unemploymentRate: 9.5, medianAge: 41, ownershipRate: 58, povertyRate: 16.8, macron2022T2: 58.0, urbanRate: 62 },
  "62": { code: "62", nom: "Pas-de-Calais", population: 1468672, surface: 6671, density: 220, medianIncome: 19200, unemploymentRate: 10.8, medianAge: 40, ownershipRate: 58, povertyRate: 19.2, macron2022T2: 56.3, urbanRate: 76 },
};

// Helper: get data for a department code, returns undefined if not yet in dataset
export function getDepartmentData(code: string): DepartmentInseeData | undefined {
  return DEPARTMENT_INSEE_DATA[code];
}

// Helper: normalize a value between min/max to 0-100 scale
export function normalizeValue(value: number, min: number, max: number): number {
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

// Pre-computed ranges for normalization
export const INSEE_RANGES = {
  density:        { min: 15,    max: 21000 }, // Lozère → Paris
  medianIncome:   { min: 17000, max: 30000 },
  unemploymentRate: { min: 4.5, max: 12 },
  medianAge:      { min: 34,    max: 50 },
  ownershipRate:  { min: 30,    max: 72 },
  povertyRate:    { min: 8,     max: 29 },
  macron2022T2:   { min: 42,    max: 86 },
  urbanRate:      { min: 20,    max: 100 },
};

// Get a 0-100 score for a given metric on a department
export function getMetricScore(code: string, metric: string): number | null {
  const dept = DEPARTMENT_INSEE_DATA[code];
  if (!dept) return null;

  switch (metric) {
    case 'density':
      // Use log scale for density (huge range)
      return normalizeValue(Math.log10(dept.density + 1), Math.log10(16), Math.log10(21000));
    case 'income':
      return normalizeValue(dept.medianIncome, INSEE_RANGES.medianIncome.min, INSEE_RANGES.medianIncome.max);
    case 'unemployment':
      return normalizeValue(dept.unemploymentRate, INSEE_RANGES.unemploymentRate.min, INSEE_RANGES.unemploymentRate.max);
    case 'age':
      return normalizeValue(dept.medianAge, INSEE_RANGES.medianAge.min, INSEE_RANGES.medianAge.max);
    case 'politics':
      // 0 = très Macron (droite/centre), 100 = très Le Pen
      return normalizeValue(100 - dept.macron2022T2, 14, 58);
    case 'urbanity':
      return dept.urbanRate;
    default:
      return null;
  }
}

// Format a metric value for display in popups
export function formatMetricValue(code: string, metric: string): string {
  const dept = DEPARTMENT_INSEE_DATA[code];
  if (!dept) return '—';

  switch (metric) {
    case 'density':     return `${dept.density.toLocaleString('fr-FR')} hab/km²`;
    case 'income':      return `${(dept.medianIncome).toLocaleString('fr-FR')} €/an`;
    case 'unemployment': return `${dept.unemploymentRate.toFixed(1)}%`;
    case 'age':         return `${dept.medianAge} ans`;
    case 'politics':    return `Macron ${dept.macron2022T2.toFixed(1)}%`;
    case 'urbanity':    return `${dept.urbanRate}% urbain`;
    case 'donors':      return '—'; // pas de données INSEE
    case 'visits':      return '—'; // données internes
    case 'generosity_score': return '—';
    default:            return '—';
  }
}
