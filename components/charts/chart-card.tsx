'use client';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { EChartsType } from 'echarts/core';
import type { Filtros } from '@/lib/types';
import type { ModeloGrafico } from '@/lib/analytics/modelos';
import { seleccionarMarca } from '@/lib/domain/analitica';
import { formatoFecha } from '@/lib/domain/fechas';
import { descargarCSV, descargarGraficoPNG } from '@/lib/client/descargas';
import { useFiltros } from '@/components/providers';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
const EChart = dynamic(() => import('./echart-view'), {
  ssr: false,
  loading: () => (
    <p className="flex min-h-[340px] items-center justify-center text-secondary" role="status">
      Preparando gráfico…
    </p>
  ),
});
export function ChartCard({
  modelo,
  corte,
  onSelect,
}: {
  modelo: ModeloGrafico;
  corte: string;
  onSelect?: (f: Partial<Filtros>) => void;
}) {
  const contenedor = useRef<HTMLElement>(null);
  const api = useRef<EChartsType | null>(null);
  const [visible, setVisible] = useState(false),
    [ready, setReady] = useState(false),
    [patterns, setPatterns] = useState(false),
    [tabla, setTabla] = useState(false),
    [error, setError] = useState('');
  const { resolvedTheme } = useTheme();
  const uid = useId();
  const filtros = useFiltros((s) => s.filtros);
  const actualizar = useFiltros((s) => s.actualizar);
  const sincronizar = useCallback((chart: EChartsType | null) => {
    api.current = chart;
    setReady(Boolean(chart));
  }, []);
  useEffect(() => {
    if (!contenedor.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' },
    );
    observer.observe(contenedor.current);
    return () => observer.disconnect();
  }, []);
  const select = useCallback(
    (f: Partial<Filtros>) => {
      if (onSelect) {
        onSelect(f);
        return;
      }
      const siguiente = seleccionarMarca(filtros, f);
      // actualizar merges: explicitly clear the keys removed by a repeated mark.
      const parche = { ...siguiente };
      for (const key of Object.keys(f) as (keyof Filtros)[])
        if (!(key in siguiente)) Object.assign(parche, { [key]: undefined });
      actualizar(parche);
    },
    [actualizar, filtros, onSelect],
  );
  const notas = [
    modelo.procedencia ?? 'Detalle documental — no oficial',
    `Corte: ${formatoFecha(corte)} · Contexto: ${filtros.contexto ?? 'base'}`,
    modelo.descripcion,
    `Filtros: ${JSON.stringify(filtros)}`,
  ];
  const exportarCSV = () =>
    descargarCSV(
      modelo.titulo,
      ['Categoría', 'Serie', 'Valor', '% acumulado', 'Detalle'],
      modelo.puntos.map((p) => [
        p.etiqueta,
        p.serie ?? '',
        p.valor,
        p.acumulado ?? '',
        p.detalle ?? '',
      ]),
      notas,
    );
  const png = async () => {
    if (!api.current) return;
    try {
      setError('');
      await descargarGraficoPNG(
        api.current.getDataURL({
          type: 'png',
          pixelRatio: 2,
          backgroundColor: resolvedTheme === 'dark' ? '#1E293B' : '#FFFFFF',
        }),
        modelo.titulo,
        notas,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo exportar PNG');
    }
  };
  return (
    <section ref={contenedor} className="min-w-0 h-full" aria-labelledby={`${uid}-titulo`}>
      <Card data-chart-panel className="h-full min-w-0 overflow-hidden p-5">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <h2 id={`${uid}-titulo`} className="text-base font-semibold leading-snug">
            {modelo.titulo}
          </h2>
          <span className="text-[11px] text-secondary">
            {modelo.procedencia ?? 'Detalle documental'}
          </span>
        </header>
        <p className="mt-2 text-xs leading-relaxed text-secondary">{modelo.descripcion}</p>
        <div className="mt-4 min-w-0">
          {visible ? (
            <EChart modelo={modelo} patterns={patterns} onSelect={select} onReady={sincronizar} />
          ) : (
            <div style={{ minHeight: modelo.alto ?? 340 }} className="bg-background" />
          )}
        </div>
        {!modelo.puntos.length && (
          <p className="py-3 text-sm" role="status">
            Sin registros para esta selección.
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <Button
            variant="outline"
            aria-expanded={tabla}
            aria-controls={`${uid}-datos`}
            onClick={() => setTabla(!tabla)}
          >
            Ver datos
          </Button>
          <Button
            variant="outline"
            onClick={exportarCSV}
            aria-label={`Exportar CSV: ${modelo.titulo}`}
          >
            CSV
          </Button>
          <Button
            variant="outline"
            disabled={!ready}
            onClick={() => {
              void png();
            }}
            aria-label={`Exportar PNG: ${modelo.titulo}`}
          >
            PNG
          </Button>
          <Button variant="outline" aria-pressed={patterns} onClick={() => setPatterns(!patterns)}>
            Patrones
          </Button>
          <span className="ml-auto text-[11px] text-secondary">{formatoFecha(corte)}</span>
        </div>
        {error && (
          <p className="mt-3 text-sm text-red-700 dark:text-red-300" role="alert">
            {error}
          </p>
        )}
        {tabla && (
          <div
            id={`${uid}-datos`}
            role="region"
            aria-label={`Datos de ${modelo.titulo}`}
            tabIndex={0}
            className="mt-4 max-h-96 min-w-0 overflow-auto rounded border border-border"
          >
            <table>
              <caption className="sr-only">
                {modelo.titulo}. {modelo.descripcion}
              </caption>
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th>Serie</th>
                  <th>Valor</th>
                  {modelo.tipo === 'pareto' && <th>% acumulado</th>}
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {modelo.puntos.map((p, i) => (
                  <tr key={`${p.serie ?? ''}-${p.etiqueta}-${i}`}>
                    <td>
                      {p.filtros ? (
                        <button
                          className="min-h-11 text-left text-brand-blue underline dark:text-brand-cyan"
                          onClick={() => select(p.filtros ?? {})}
                          aria-label={`Filtrar ${p.etiqueta}${p.serie ? `, ${p.serie}` : ''}`}
                        >
                          {p.etiqueta}
                        </button>
                      ) : (
                        p.etiqueta
                      )}
                    </td>
                    <td>{p.serie ?? '—'}</td>
                    <td className="font-mono">
                      {p.valor === null
                        ? modelo.tipo === 'heatmap'
                          ? 'Sin registros en esta base'
                          : 'No consta'
                        : Number.isInteger(p.valor)
                          ? p.valor
                          : p.valor.toFixed(4)}
                    </td>
                    {modelo.tipo === 'pareto' && (
                      <td>{p.acumulado?.toFixed(2) ?? 'No calculable'}</td>
                    )}
                    <td>{p.detalle ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </section>
  );
}
