'use client';
import type { ContextoDatos } from '@/lib/types';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDataSource, useFiltros, useSesion } from '@/components/providers';
import { seleccionarCruzado } from '@/lib/domain/filtros';
export function useBase(forzado?: ContextoDatos) {
  const source = useDataSource();
  const seleccionado = useFiltros((s) => s.filtros.contexto);
  const contexto = forzado ?? seleccionado ?? 'base';
  return useQuery({
    queryKey: ['base', contexto],
    queryFn: () => source.getBase(contexto),
    // Keep the controller mounted while switching projections; unmounting pauses replay.
    placeholderData: (anterior) => anterior,
  });
}
export function useVista(forzado?: ContextoDatos) {
  const query = useBase(forzado);
  const filtros = useFiltros((s) => s.filtros);
  const { actor } = useSesion();
  const base = useMemo(() => {
    const b = query.data;
    if (!b) return undefined;
    if (actor.rol !== 'Supervisor de campo') return b;
    const eventos = b.eventos.filter((e) => e.proyectoCodigo === actor.proyectoCodigo);
    const ids = new Set(eventos.map((e) => e.id));
    return {
      ...b,
      eventos,
      acciones: b.acciones.filter((a) => ids.has(a.eventoId)),
      lecciones: b.lecciones.filter((l) => l.eventoIds.some((id) => ids.has(id))),
    };
  }, [query.data, actor.rol, actor.proyectoCodigo]);
  const seleccion = useMemo(
    () =>
      base ? seleccionarCruzado(base.eventos, base.acciones, base.lecciones, filtros) : undefined,
    [base, filtros],
  );
  return { ...query, base, seleccion, filtros, actor };
}
