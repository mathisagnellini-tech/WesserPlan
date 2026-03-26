import { departmentCapitals } from '@/constants/departments';

// ─── Types ───────────────────────────────────────────────────────────

export interface WeatherData {
  current: {
    temperature: number;
    condition: string;
    conditionCode: number;
    windSpeed: number;
    icon: string;
    walkingScore: 'Excellente' | 'Bonne' | 'Difficile' | 'Extreme';
  };
  hourly: {
    time: string[];
    temperature: number[];
    precipitationProbability: number[];
  };
  daily: {
    date: string[];
    tempMin: number[];
    tempMax: number[];
    condition: string[];
    conditionCode: number[];
    precipitationSum: number[];
  };
}

// ─── WMO code mappings ───────────────────────────────────────────────

export function getWmoCondition(code: number): string {
  if (code === 0) return 'Ciel dégagé';
  if (code === 1) return 'Peu nuageux';
  if (code === 2) return 'Partiellement nuageux';
  if (code === 3) return 'Couvert';
  if (code >= 45 && code <= 48) return 'Brouillard';
  if (code >= 51 && code <= 55) return 'Bruine';
  if (code >= 61 && code <= 65) return 'Pluie';
  if (code >= 66 && code <= 67) return 'Pluie verglaçante';
  if (code >= 71 && code <= 77) return 'Neige';
  if (code >= 80 && code <= 82) return 'Averses';
  if (code >= 85 && code <= 86) return 'Averses de neige';
  if (code >= 95 && code <= 99) return 'Orage';
  return 'Inconnu';
}

export function getWmoIcon(code: number): string {
  if (code === 0) return 'Sun';
  if (code === 1 || code === 2) return 'CloudSun';
  if (code === 3) return 'Cloud';
  if (code >= 45 && code <= 48) return 'CloudFog';
  if (code >= 51 && code <= 55) return 'CloudDrizzle';
  if (code >= 61 && code <= 67) return 'CloudRain';
  if (code >= 71 && code <= 86) return 'CloudSnow';
  if (code >= 95 && code <= 99) return 'CloudLightning';
  return 'Cloud';
}

// ─── Walking score ───────────────────────────────────────────────────

function calculateWalkingScore(
  temperature: number,
  windSpeed: number,
  weatherCode: number,
): 'Excellente' | 'Bonne' | 'Difficile' | 'Extreme' {
  const hasRain = weatherCode >= 51;
  const hasHeavyRain = weatherCode >= 61;
  const hasSnowOrStorm = weatherCode >= 71;

  // Extreme conditions
  if (
    temperature < 5 ||
    temperature > 35 ||
    windSpeed > 50 ||
    hasSnowOrStorm
  ) {
    return 'Extreme';
  }

  // Excellente: 15-25°C, wind < 20, no rain
  if (
    temperature >= 15 &&
    temperature <= 25 &&
    windSpeed < 20 &&
    !hasRain
  ) {
    return 'Excellente';
  }

  // Bonne: 10-30°C, wind < 30, light rain ok
  if (
    temperature >= 10 &&
    temperature <= 30 &&
    windSpeed < 30 &&
    !hasHeavyRain
  ) {
    return 'Bonne';
  }

  return 'Difficile';
}

// ─── Cache ───────────────────────────────────────────────────────────

const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

const cache = new Map<string, { data: WeatherData; timestamp: number }>();

function getCacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}

// ─── API ─────────────────────────────────────────────────────────────

export async function getWeatherForLocation(
  lat: number,
  lng: number,
): Promise<WeatherData> {
  const key = getCacheKey(lat, lng);
  const cached = cache.get(key);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,weather_code,wind_speed_10m` +
    `&hourly=temperature_2m,precipitation_probability` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum` +
    `&timezone=Europe/Paris&forecast_days=7`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.status}`);
  }

  const json = await response.json();

  const currentCode: number = json.current.weather_code;
  const currentTemp: number = json.current.temperature_2m;
  const currentWind: number = json.current.wind_speed_10m;

  const data: WeatherData = {
    current: {
      temperature: currentTemp,
      condition: getWmoCondition(currentCode),
      conditionCode: currentCode,
      windSpeed: currentWind,
      icon: getWmoIcon(currentCode),
      walkingScore: calculateWalkingScore(currentTemp, currentWind, currentCode),
    },
    hourly: {
      time: json.hourly.time,
      temperature: json.hourly.temperature_2m,
      precipitationProbability: json.hourly.precipitation_probability,
    },
    daily: {
      date: json.daily.time,
      tempMin: json.daily.temperature_2m_min,
      tempMax: json.daily.temperature_2m_max,
      condition: (json.daily.weather_code as number[]).map(getWmoCondition),
      conditionCode: json.daily.weather_code,
      precipitationSum: json.daily.precipitation_sum,
    },
  };

  cache.set(key, { data, timestamp: Date.now() });

  return data;
}

export async function getWeatherForDepartment(
  deptCode: string,
): Promise<WeatherData | null> {
  const capital = departmentCapitals[deptCode];
  if (!capital) return null;
  return getWeatherForLocation(capital.lat, capital.lng);
}
