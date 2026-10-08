'use client';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStoreFiltros } from '@/components/providers';
import { filtrosAParametros, parametrosAFiltros } from '@/lib/domain/filtrosURL';
export function FiltrosURLSync() {
  const store = useStoreFiltros();
  const search = useSearchParams().toString();
  useEffect(() => {
    store.getState().desdeURL(parametrosAFiltros(new URLSearchParams(search)));
  }, [store, search]);
  useEffect(
    () =>
      store.subscribe((state, previous) => {
        if (state.origen !== 'usuario' || state.filtros === previous.filtros) return;
        const actuales = new URLSearchParams(window.location.search);
        const nuevos = filtrosAParametros(state.filtros, actuales).toString();
        if (nuevos === actuales.toString()) return;
        const url = `${window.location.pathname}${nuevos ? `?${nuevos}` : ''}${window.location.hash}`;
        // Next.js integra History API nativa con useSearchParams. Sin bucles al restaurar la URL.
        if (state.historial === 'replace') window.history.replaceState(null, '', url);
        else window.history.pushState(null, '', url);
      }),
    [store],
  );
  return null;
}
