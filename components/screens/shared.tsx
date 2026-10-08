'use client';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useFiltros } from '@/components/providers';
import { enlaceConContexto } from '@/lib/domain/links';
import { Button } from '@/components/ui/button';
export function Titulo({ titulo, subtitulo }: { titulo: string; subtitulo: string }) {
  return (
    <div className="page-heading mb-6">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
        INCIMMET / SSOMA
      </p>
      <h1>{titulo}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-secondary">{subtitulo}</p>
    </div>
  );
}
export function EstadoConsulta({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error: Error | null;
  retry: () => void;
}) {
  if (loading)
    return (
      <p role="status" className="rounded-lg border border-border p-6">
        Cargando base documental…
      </p>
    );
  if (error)
    return (
      <div role="alert" className="rounded-lg border border-red-400 p-6">
        <h2 className="font-semibold">No se pudo cargar la base documental</h2>
        <p className="my-3 text-sm">{error.message}</p>
        <Button onClick={retry}>Reintentar</Button>
      </div>
    );
  return null;
}
export function LinkContexto({ href, children }: { href: string; children: ReactNode }) {
  const f = useFiltros((s) => s.filtros);
  return (
    <Link
      prefetch={false}
      className="font-medium text-brand-blue underline dark:text-brand-cyan"
      href={enlaceConContexto(href, f)}
    >
      {children}
    </Link>
  );
}
export function Tabla({ children, titulo }: { children: ReactNode; titulo: string }) {
  return (
    <div
      role="region"
      aria-label={titulo}
      tabIndex={0}
      className="mt-4 max-h-[65vh] overflow-auto rounded-lg border border-border"
    >
      <table>
        <caption className="sr-only">{titulo}</caption>
        {children}
      </table>
    </div>
  );
}
