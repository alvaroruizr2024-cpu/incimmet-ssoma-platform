'use client';
import { useId, useState } from 'react';
import type { DocumentoFuente } from '@/lib/types';
function SourceChip({
  referencia,
  documentos,
}: {
  referencia: string;
  documentos: readonly DocumentoFuente[];
}) {
  const id = useId(),
    [abierto, setAbierto] = useState(false);
  const codigo = referencia.split(' · ')[0] ?? referencia;
  const fuente = documentos.find((d) => d.codigo === codigo);
  return (
    <span
      className="relative inline-flex max-w-full flex-col items-start"
      onMouseEnter={() => setAbierto(true)}
      onMouseLeave={() => setAbierto(false)}
    >
      <button
        type="button"
        aria-expanded={abierto}
        aria-describedby={abierto ? id : undefined}
        onClick={() => setAbierto(true)}
        onFocus={() => setAbierto(true)}
        onBlur={() => setAbierto(false)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setAbierto(false);
        }}
        className="min-h-11 max-w-full break-words rounded-md border border-border bg-muted px-3 py-2 text-left text-xs font-semibold"
      >
        {codigo}
      </button>
      {abierto && (
        <span
          id={id}
          role="tooltip"
          className="z-20 mt-1 block w-full min-w-0 max-w-lg rounded-md border border-border bg-card p-3 text-xs font-normal leading-relaxed shadow-lg"
        >
          {fuente?.descripcion ?? 'Descripción de documento no disponible'}
          <br />
          {referencia}
          <br />
          <strong>Referencia documental; archivo original no adjunto.</strong>
        </span>
      )}
    </span>
  );
}
export function SourceChips({
  referencias,
  documentos,
}: {
  referencias: readonly string[];
  documentos: readonly DocumentoFuente[];
}) {
  return (
    <div className="flex flex-wrap items-start gap-2">
      {referencias.map((f, i) => (
        <SourceChip key={`${f}-${i}`} referencia={f} documentos={documentos} />
      ))}
      {!referencias.length && (
        <span className="text-sm text-secondary">Sin fuentes registradas</span>
      )}
    </div>
  );
}
