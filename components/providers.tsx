'use client';
import { createContext, useContext, useEffect, useState, Suspense, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useStore } from 'zustand';
import type { DataSource } from '@/lib/data/DataSource';
import { crearDataSource } from '@/lib/data';
import { crearStoreSesion, type StoreSesion } from '@/store/sesion';
import { crearStoreFiltros, type EstadoFiltros, type StoreFiltros } from '@/store/filtros';
import { FiltrosURLSync } from './shell/filtros-url-sync';
const DataContext = createContext<DataSource | null>(null);
const FiltersContext = createContext<StoreFiltros | null>(null);
const SessionContext = createContext<StoreSesion | null>(null);
export function useDataSource(): DataSource {
  const value = useContext(DataContext);
  if (!value) throw new Error('Falta DataProvider');
  return value;
}
export function useStoreFiltros(): StoreFiltros {
  const store = useContext(FiltersContext);
  if (!store) throw new Error('Falta FiltersProvider');
  return store;
}
export function useFiltros<T>(selector: (state: EstadoFiltros) => T): T {
  return useStore(useStoreFiltros(), selector);
}
export function useSesion() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('Falta SessionProvider');
  return useStore(value);
}
function EscucharCambios({ source, client }: { source: DataSource; client: QueryClient }) {
  useEffect(() => {
    try {
      return source.subscribe(() => {
        void client.invalidateQueries({ queryKey: ['base'] });
        void client.invalidateQueries({ queryKey: ['evidencias'] });
        void client.invalidateQueries({ queryKey: ['historial'] });
      });
    } catch {
      return undefined;
    } // El error del stub se muestra mediante las consultas, no como éxito.
  }, [source, client]);
  return null;
}
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );
  const [source] = useState(crearDataSource);
  const [store] = useState(crearStoreFiltros);
  const [sesion] = useState(crearStoreSesion);
  useEffect(() => {
    // Storage may be unavailable (privacy mode / server render). Keep the demo usable.
    try {
      void Promise.resolve(sesion.persist?.rehydrate()).then(
        () => {
          if (
            window.location.pathname === '/campo' &&
            new URLSearchParams(window.location.search).get('origen') === 'pwa' &&
            sesion.getState().actor.rol === 'Gerencia'
          )
            sesion.getState().cambiar({ rol: 'Supervisor de campo' });
          sesion.getState().completarHidratacion();
        },
        () => sesion.getState().completarHidratacion(),
      );
    } catch {
      sesion.getState().completarHidratacion();
    }
  }, [sesion]);
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <DataContext.Provider value={source}>
          <FiltersContext.Provider value={store}>
            <SessionContext.Provider value={sesion}>
              <Suspense fallback={null}>
                <FiltrosURLSync />
              </Suspense>
              <EscucharCambios source={source} client={queryClient} />
              {children}
            </SessionContext.Provider>
          </FiltersContext.Provider>
        </DataContext.Provider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
