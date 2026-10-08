import { create } from 'zustand';
import type { Vec3 } from '@/lib/domain/cinematica';
import { mismaReferencia, type ReferenciaDato } from '@/lib/domain/interactivos3d';

interface EstadoRelato3D {
  hover: ReferenciaDato | null;
  seleccion: ReferenciaDato | null;
  /** Posición en el mundo del dato fijado; la cámara inclina levemente la mirada hacia él. */
  foco: Vec3 | null;
  fijarHover: (dato: ReferenciaDato | null) => void;
  seleccionar: (dato: ReferenciaDato | null, foco?: Vec3 | null) => void;
  fijarFoco: (foco: Vec3 | null) => void;
}
/** Estado compartido entre el canvas y el DOM: solo identidad y posición, nunca texto ni cifras. */
export const useRelato3D = create<EstadoRelato3D>()((set) => ({
  hover: null,
  seleccion: null,
  foco: null,
  fijarHover: (hover) =>
    set((estado) =>
      mismaReferencia(estado.hover, hover) || (estado.hover === null && hover === null)
        ? estado
        : { hover },
    ),
  seleccionar: (seleccion, foco = null) => set({ seleccion, foco }),
  fijarFoco: (foco) => set({ foco }),
}));
