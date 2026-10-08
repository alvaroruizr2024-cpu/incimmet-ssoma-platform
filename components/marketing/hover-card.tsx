'use client';
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { buscarDato, mismaReferencia, type DatoInteractivo } from '@/lib/domain/interactivos3d';
import { useRelato3D } from '@/store/relato3d';

/** Rótulo que sigue al puntero fino. Es decorativo: el panel de dato y el texto de escena son la lectura accesible. */
export function HoverCard({ catalogo }: { catalogo: readonly DatoInteractivo[] }) {
  const hover = useRelato3D((s) => s.hover);
  const seleccion = useRelato3D((s) => s.seleccion);
  const tarjeta = useRef<HTMLDivElement>(null);
  const puntero = useRef({ x: -9999, y: -9999 });
  const dato = hover && !mismaReferencia(hover, seleccion) ? buscarDato(catalogo, hover) : null;
  const colocar = useCallback(() => {
    const el = tarjeta.current;
    if (!el) return;
    const { x, y } = puntero.current;
    const left = Math.max(8, Math.min(x + 18, window.innerWidth - el.offsetWidth - 8));
    const top = Math.max(8, Math.min(y + 18, window.innerHeight - el.offsetHeight - 8));
    el.style.transform = `translate(${left}px, ${top}px)`;
  }, []);
  useEffect(() => {
    const mover = (event: PointerEvent) => {
      puntero.current = { x: event.clientX, y: event.clientY };
      colocar();
    };
    window.addEventListener('pointermove', mover, { passive: true });
    return () => window.removeEventListener('pointermove', mover);
  }, [colocar]);
  useLayoutEffect(() => {
    colocar();
  }, [colocar, dato]);
  if (!dato) return null;
  return (
    <div ref={tarjeta} className="intro-hover-card" aria-hidden="true">
      <p className="intro-hover-title">{dato.titulo}</p>
      <p>{dato.lineas[0]}</p>
      <p className="intro-hover-hint">Clic: fijar el dato y abrirlo</p>
    </div>
  );
}
