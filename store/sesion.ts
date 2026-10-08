import { createStore } from 'zustand/vanilla';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ActorDemo } from '@/lib/types';

interface SesionState {
  actor: ActorDemo;
  hidratado: boolean;
  cambiar: (actor: ActorDemo) => void;
  completarHidratacion: () => void;
}
/** Scope = current browser tab. Role simulation is not authentication. */
export function crearStoreSesion() {
  return createStore<SesionState>()(
    persist(
      (set) => ({
        actor: { rol: 'Gerencia' },
        hidratado: false,
        cambiar: (actor) => set({ actor }),
        completarHidratacion: () => set({ hidratado: true }),
      }),
      {
        name: 'incimmet-sesion-demo-v1',
        storage: createJSONStorage(() => sessionStorage),
        skipHydration: true,
        partialize: (state) => ({ actor: state.actor }),
        merge: (persisted, current) => {
          const saved = persisted as { actor?: ActorDemo } | undefined;
          const actor = saved?.actor;
          if (
            !actor ||
            !['Gerencia', 'SSOMA corporativo', 'Supervisor de campo'].includes(actor.rol)
          )
            return current;
          return { ...current, actor };
        },
      },
    ),
  );
}
export type StoreSesion = ReturnType<typeof crearStoreSesion>;
