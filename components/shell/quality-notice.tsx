'use client';
import { useEffect, useId, useState } from 'react';
import type { BaseNormalizada } from '@/lib/types';
import { avisosCalidad } from '@/lib/domain/analitica';
const PREFIX = 'incimmet-calidad-v2';
/** Automatic opening is confined to the first desktop dashboard, not propagated to every route. */
export function QualityNotice({ base, ruta }: { base: BaseNormalizada; ruta: string }) {
  const [preference, setPreference] = useState({ ruta: '', open: false });
  const id = useId();
  const open = preference.ruta === ruta && preference.open;
  const avisos = avisosCalidad(base);
  useEffect(() => {
    if (!ruta) return;
    const frame = requestAnimationFrame(() => {
      let expanded = false;
      try {
        const saved = sessionStorage.getItem(`${PREFIX}:${ruta}`);
        if (saved !== null) expanded = saved === 'abierto';
        else if (ruta === '/dashboard' && !sessionStorage.getItem(`${PREFIX}:dashboard-visto`)) {
          expanded = false;
          sessionStorage.setItem(`${PREFIX}:dashboard-visto`, 'si');
        }
      } catch {
        /* Read-only use remains available when sessionStorage is disabled. */
      }
      setPreference({ ruta, open: expanded });
    });
    return () => cancelAnimationFrame(frame);
  }, [ruta]);
  return (
    <section
      className="mb-5 rounded-lg border border-border bg-card px-4 py-2"
      aria-label="Calidad de datos"
    >
      <button
        type="button"
        className="min-h-11 w-full text-left text-sm font-semibold"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          setPreference({ ruta, open: !open });
          try {
            sessionStorage.setItem(`${PREFIX}:${ruta}`, open ? 'cerrado' : 'abierto');
          } catch {
            /* No persistence does not prevent reading the notices. */
          }
        }}
      >
        Calidad de datos · {avisos.length} avisos · {open ? 'Ocultar' : 'Ver'}
      </button>
      <div id={id} hidden={!open}>
        <ul className="my-3 list-disc space-y-1 pl-5 text-xs leading-relaxed text-secondary">
          {avisos.map((aviso) => (
            <li key={aviso}>{aviso}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
