import type { DataSource } from './DataSource';
import { StaticJsonDataSource } from './StaticJsonDataSource';
import { SupabaseDataSource } from './SupabaseDataSource';
export function crearDataSource(
  modo: string = process.env.NEXT_PUBLIC_DATA_SOURCE ?? 'static',
): DataSource {
  if (modo === 'static') return new StaticJsonDataSource();
  if (modo === 'supabase') return new SupabaseDataSource();
  throw new Error(`DataSource desconocido: ${modo}. Valores admitidos: static | supabase`);
}
