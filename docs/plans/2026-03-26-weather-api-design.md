# Weather API Integration Design

**Date:** 2026-03-26
**Status:** Approved
**API:** Open-Meteo (free, no API key)

## Data Points

- Current temperature, condition (WMO code → French label + icon), wind speed
- 24h hourly forecast (temperature, precipitation probability)
- 7-day daily forecast (min/max temp, condition, precipitation)

## Location Strategy

- **Primary:** Per-department (capital coordinates from `constants/departments.ts`)
- **Detail:** Per-zone centroid for Zone Maker cluster detail views
- Department coordinates added to existing `departmentMap` data

## Service Layer

`src/services/weatherService.ts`:
- Fetches from `https://api.open-meteo.com/v1/forecast`
- In-memory cache keyed by `lat,lng` (rounded to 2 decimals), 15-min TTL
- Maps WMO weather codes to French labels + Lucide icons
- Exports: `getWeatherForLocation(lat, lng)`, `getWeatherForDepartment(deptCode)`

## Integration Points

1. **Dashboard WeatherWidget** — Real avgTemp, condition, 24h temperature curve
2. **Team Planner BoardColumn** — Weather icon in column header for mission zone
3. **Team Planner MissionInspector** — Forecast for mission's zone
4. **WPlan DataLab** — Weather correlation widget with real data
5. **Zone Maker ClusterDetail** — Current weather for selected cluster

## Custom Hook

`src/hooks/useWeather.ts` — React hook wrapping the service:
- Takes `lat, lng` or `departmentCode`
- Returns `{ data, isLoading, error }`
- Auto-refreshes every 15 minutes

## Error Handling

- Graceful fallback to "N/A" / placeholder if API fails
- Non-blocking — components render immediately, weather fills async
- No retry spam — single attempt per cache miss

## Types

```typescript
interface WeatherData {
  current: {
    temperature: number;
    condition: string;
    conditionCode: number;
    windSpeed: number;
    icon: string; // Lucide icon name
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
```
