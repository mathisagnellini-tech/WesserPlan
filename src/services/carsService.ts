import { supabasePlan as supabase } from '@/lib/supabase';
import type { CarType } from '@/components/operations/types';

// Supabase row type matches schema.sql
interface CarRow {
  id: number;
  plate: string;
  brand: string;
  location: string | null;
  km: number;
  next_service: string | null;
  owner: string | null;
  lat: number;
  lng: number;
  fuel_declared: number;
  tank_size: number;
  damages: Array<{ date: string; description: string; author: string }>;
  created_at: string;
  updated_at: string;
}

function rowToCar(row: CarRow): CarType {
  return {
    id: String(row.id),
    plate: row.plate,
    brand: row.brand,
    where: row.location ?? '',
    km: row.km,
    service: row.next_service ?? '',
    owner: row.owner ?? '',
    lat: row.lat,
    lng: row.lng,
    fuelStats: {
      declared: row.fuel_declared,
      tankSize: row.tank_size,
    },
    damages: row.damages ?? [],
  };
}

export const carsService = {
  async getAll(): Promise<CarType[]> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('plate');

    if (error) throw new Error(`Cars fetch failed: ${error.message}`);
    return (data as CarRow[]).map(rowToCar);
  },

  async getById(id: number): Promise<CarType | null> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return rowToCar(data as CarRow);
  },

  async create(car: Partial<CarRow>): Promise<CarType> {
    const { data, error } = await supabase
      .from('vehicles')
      .insert(car)
      .select()
      .single();

    if (error) throw new Error(`Car create failed: ${error.message}`);
    return rowToCar(data as CarRow);
  },

  async update(id: number, updates: Partial<CarRow>): Promise<CarType | null> {
    const { data, error } = await supabase
      .from('vehicles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Car update failed: ${error.message}`);
    return rowToCar(data as CarRow);
  },

  async reportDamage(id: number, damage: { date: string; description: string; author: string }): Promise<void> {
    // Fetch current damages, append new one
    const { data: car, error: fetchErr } = await supabase
      .from('vehicles')
      .select('damages')
      .eq('id', id)
      .single();

    if (fetchErr) throw new Error(`Car fetch failed: ${fetchErr.message}`);

    const currentDamages = (car as { damages: unknown[] }).damages ?? [];
    const { error } = await supabase
      .from('vehicles')
      .update({ damages: [...currentDamages, damage] })
      .eq('id', id);

    if (error) throw new Error(`Damage report failed: ${error.message}`);
  },
};
