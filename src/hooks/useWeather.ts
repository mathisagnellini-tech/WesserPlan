import { useState, useEffect } from 'react';
import {
  getWeatherForLocation,
  getWeatherForDepartment,
} from '@/services/weatherService';
import type { WeatherData } from '@/services/weatherService';

const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes

export function useWeather(
  lat?: number,
  lng?: number,
): { data: WeatherData | null; isLoading: boolean; error: string | null } {
  const [data, setData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lat === undefined || lng === undefined) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function fetchWeather() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getWeatherForLocation(lat!, lng!);
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erreur météo inconnue');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchWeather();

    const interval = setInterval(fetchWeather, REFRESH_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [lat, lng]);

  return { data, isLoading, error };
}

export function useDepartmentWeather(
  deptCode?: string,
): { data: WeatherData | null; isLoading: boolean; error: string | null } {
  const [data, setData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!deptCode) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function fetchWeather() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getWeatherForDepartment(deptCode!);
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erreur météo inconnue');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchWeather();

    const interval = setInterval(fetchWeather, REFRESH_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [deptCode]);

  return { data, isLoading, error };
}
