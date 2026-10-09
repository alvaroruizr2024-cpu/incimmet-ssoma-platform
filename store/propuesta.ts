import { create } from 'zustand';

interface EstadoPropuesta {
  hover: string | null;
  seleccion: string | null;
  fijarHover: (clave: string | null) => void;
  seleccionar: (clave: string | null) => void;
}
/** Estado compartido entre el canvas y el DOM: solo identidad del dato señalado o fijado. */
export const usePropuesta = create<EstadoPropuesta>()((set) => ({
  hover: null,
  seleccion: null,
  fijarHover: (hover) => set((estado) => (estado.hover === hover ? estado : { hover })),
  seleccionar: (seleccion) => set({ seleccion }),
}));
