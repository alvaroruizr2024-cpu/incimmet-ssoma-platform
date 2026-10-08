'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, X } from 'lucide-react';
import { ESCENAS } from '@/lib/domain/cinematica';
import {
  buscarDato,
  datosDeEscena,
  mismaReferencia,
  vecinoEnEscena,
  type DatoInteractivo,
} from '@/lib/domain/interactivos3d';
import { useRelato3D } from '@/store/relato3d';
import { ContextLink } from './context-link';

/** Panel DOM del dato fijado en el recorrido 3D: recorrible con teclado y enlazado a la plataforma. */
export function DataInspector({
  catalogo,
  escena,
}: {
  catalogo: readonly DatoInteractivo[];
  escena: number;
}) {
  const seleccion = useRelato3D((s) => s.seleccion);
  const dato = seleccion ? buscarDato(catalogo, seleccion) : null;
  const lista = datosDeEscena(catalogo, escena);
  const indice = dato ? lista.findIndex((d) => mismaReferencia(d, dato)) : -1;
  const panel = useRef<HTMLElement>(null);
  const estabaAbierto = useRef(false);
  const abierto = dato !== null;
  const cerrar = useCallback(() => {
    useRelato3D.getState().seleccionar(null);
    document.getElementById('intro-explorar')?.focus({ preventScroll: true });
  }, []);
  const mover = (paso: 1 | -1) =>
    useRelato3D.getState().seleccionar(vecinoEnEscena(catalogo, seleccion, escena, paso));
  useEffect(() => {
    if (abierto && !estabaAbierto.current) panel.current?.focus({ preventScroll: true });
    estabaAbierto.current = abierto;
  }, [abierto]);
  useEffect(() => {
    if (!abierto) return;
    const tecla = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cerrar();
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [abierto, cerrar]);
  if (!dato) return null;
  const etiqueta = (
    <>
      {dato.accion} <ArrowUpRight size={15} aria-hidden="true" />
    </>
  );
  return (
    <aside
      ref={panel}
      tabIndex={-1}
      className="intro-inspector"
      aria-label="Dato fijado en el recorrido 3D"
      data-testid="intro-inspector"
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          mover(1);
        } else if (event.key === 'ArrowLeft') {
          event.preventDefault();
          mover(-1);
        }
      }}
    >
      <p className="intro-inspector-eyebrow">
        <span>{ESCENAS[escena]?.titulo ?? 'Escena'}</span>
        {indice >= 0 && (
          <span>
            {indice + 1} / {lista.length}
          </span>
        )}
      </p>
      <h3 aria-live="polite">{dato.titulo}</h3>
      <ul>
        {dato.lineas.map((linea) => (
          <li key={linea}>{linea}</li>
        ))}
      </ul>
      {dato.enlace === 'contexto' ? (
        <ContextLink href={dato.href} className="intro-inspector-link">
          {etiqueta}
        </ContextLink>
      ) : (
        <Link prefetch={false} href={dato.href} className="intro-inspector-link">
          {etiqueta}
        </Link>
      )}
      <div
        className="intro-inspector-nav"
        role="group"
        aria-label="Recorrer los datos de la escena"
      >
        <button
          type="button"
          onClick={() => mover(-1)}
          disabled={lista.length < 2}
          aria-label="Dato anterior"
        >
          <ArrowLeft size={17} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => mover(1)}
          disabled={lista.length < 2}
          aria-label="Dato siguiente"
        >
          <ArrowRight size={17} aria-hidden="true" />
        </button>
        <button type="button" onClick={cerrar} aria-label="Cerrar dato">
          <X size={17} aria-hidden="true" />
        </button>
      </div>
      <p className="intro-inspector-fine">
        Rótulo ilustrativo del recorrido. La cifra, su período y su fuente están en el texto de la
        escena.
      </p>
    </aside>
  );
}
