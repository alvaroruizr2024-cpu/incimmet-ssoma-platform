import { createStore } from 'zustand/vanilla';
import type { Filtros } from '@/lib/types';
export interface EstadoFiltros {
  filtros: Filtros;
  origen: 'url' | 'usuario';
  historial: 'push' | 'replace';
  actualizar: (parche: Partial<Filtros>, historial?: 'push' | 'replace') => void;
  desdeURL: (filtros: Filtros) => void;
  limpiar: () => void;
}
/** Una instancia por árbol React; evita compartir filtros entre solicitudes SSR. */
export function crearStoreFiltros(inicial: Filtros = {}) {
  return createStore<EstadoFiltros>()((set) => ({
    filtros: inicial,
    origen: 'url',
    historial: 'push',
    actualizar: (parche, historial = 'push') =>
      set((s) => ({ filtros: { ...s.filtros, ...parche }, origen: 'usuario', historial })),
    desdeURL: (filtros) => set({ filtros, origen: 'url' }),
    limpiar: () => set({ filtros: {}, origen: 'usuario', historial: 'push' }),
  }));
}
export type StoreFiltros = ReturnType<typeof crearStoreFiltros>;
