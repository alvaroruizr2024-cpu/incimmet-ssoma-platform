'use client';
import { useState } from 'react';
import type { BaseNormalizada, Registro } from '@/lib/types';
import type { ModeloGrafico } from '@/lib/analytics/modelos';
import { recalcularResumenPBIX } from '@/lib/domain/indicadores';
import { ChartCard } from '@/components/charts/chart-card';
import { Tabla } from '@/components/screens/shared';
import { useFiltros } from '@/components/providers';
const medidas = ['if', 'is', 'ia', 'trifr'] as const;
const valor = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
function modeloRegistro(id: string, titulo: string, filas: Registro[]): ModeloGrafico {
  return {
    id,
    titulo,
    tipo: 'bar',
    procedencia: 'Oficial (documento fuente)',
    descripcion:
      'Se mantienen período, ámbito, nota y versión de la fuente. No es un recálculo del detalle.',
    puntos: filas.map((f) => ({
      etiqueta: f.ambito,
      valor: valor(f.valor),
      detalle: `${f.periodo} · ${f.indicador} · ${f.nota ?? ''} · ${f.fuente}`,
    })),
  };
}
export function IndicadoresPanel({ base }: { base: BaseNormalizada }) {
  const [ambito, setAmbito] = useState('PERU'),
    [anio, setAnio] = useState('todos'),
    [buscar, setBuscar] = useState('');
  const globales = useFiltros((s) => s.filtros);
  const i = base.indicadores;
  const filas = i.anual_por_ambito.filter(
    (f) => f.ambito === ambito && (anio === 'todos' || String(f.anio) === anio),
  );
  const indices: ModeloGrafico[] = medidas.map((m) => ({
    id: `oficial-${m}`,
    titulo: `${m.toUpperCase()} · ${ambito}`,
    tipo: 'line',
    procedencia: 'Oficial (documento fuente)',
    descripcion:
      'Valor original. No se promedian tasas ni se combinan totales corporativos con proyectos.',
    puntos: filas.map((f) => ({
      etiqueta: String(f.anio),
      valor: f[m] ?? null,
      detalle: `${f.ambito_nombre} · ${f.fuente}`,
    })),
  }));
  const metas = [...new Set(i.metas_2026.map((r) => r.indicador))].map((m) => {
    const modelo = modeloRegistro(
      `meta-${m}`,
      `${m} · Meta 2026`,
      i.metas_2026.filter((r) => r.indicador === m),
    );
    modelo.descripcion = 'META: no es resultado. Cada indicador tiene su propia escala y ámbito.';
    return modelo;
  });
  const movil = i.doce_meses_feb_2026.map((r) => {
    const m = modeloRegistro(`movil-${r.indicador}`, `${r.indicador} · 12 meses a febrero 2026`, [
      r,
    ]);
    const match = r.nota?.match(/Límite\/meta mostrado:\s*([0-9.]+)/);
    const referencia = match ? Number(match[1]) : NaN;
    m.referencia = Number.isFinite(referencia) ? referencia : undefined;
    m.descripcion = `${r.periodo}. ${r.nota ?? 'Referencia: No consta'}. Ventana móvil, no resultado anual ni dato de febrero aislado.`;
    return m;
  });
  const resumenes = i.hh_semanal_pbix_resumen.filter(
    (r) =>
      (!globales.proyectos?.length || globales.proyectos.includes(r.proyecto)) &&
      (!globales.anios?.length || globales.anios.includes(r.anio)),
  );
  const pbix: ModeloGrafico[] = (['is', 'trifr'] as const).map((m) => ({
    id: `pbix-${m}`,
    titulo: `${m.toUpperCase()} recalculado · PBIX`,
    tipo: 'bar',
    procedencia: 'No oficial — resumen PBIX',
    descripcion:
      'Solo resumen, proyecto y período compatibles. IF e IA no calculables: falta numerador específico Nv IV–VI. No se completa con el detalle de eventos.',
    puntos: resumenes.map((r) => ({
      etiqueta: `${r.proyecto} ${r.anio}`,
      valor: recalcularResumenPBIX(r)[m],
      detalle: `${r.desde} a ${r.hasta} · ${r.semanas} semanas · HHT ${r.hht} · ${r.fuente}`,
    })),
  }));
  const versiones = i.registros_oficiales.filter((r) =>
    `${r.periodo} ${r.ambito} ${r.indicador} ${r.fuente}`
      .toLocaleLowerCase('es')
      .includes(buscar.toLocaleLowerCase('es')),
  );
  const seleccionarOficial = () => {
    /* Sin filtro cruzado de detalle: no hay desagregación por riesgo, equipo o tipo. */
  };
  return (
    <div className="space-y-7">
      <div className="rounded-lg border border-brand-accent bg-card p-5">
        <p className="text-sm font-semibold">
          Indicadores oficiales según documento fuente; los conteos del detalle pueden no coincidir
          con los agregados.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-secondary">
          Estos gráficos usan los selectores de ámbito y año siguientes. No son desagregables por
          los filtros de riesgo, tipo, empresa, estado o equipo del detalle.
        </p>
        <div className="mt-4 flex flex-wrap gap-4">
          <label className="grid min-w-0 gap-2 text-sm">
            Ámbito oficial
            <select
              className="w-full min-w-0"
              value={ambito}
              onChange={(e) => setAmbito(e.target.value)}
            >
              {[
                ...new Map(i.anual_por_ambito.map((r) => [r.ambito, r.ambito_nombre])).entries(),
              ].map(([k, n]) => (
                <option key={k} value={k}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            Año oficial
            <select
              className="w-full min-w-0"
              value={anio}
              onChange={(e) => setAnio(e.target.value)}
            >
              <option value="todos">Todos los años disponibles</option>
              {[...new Set(i.anual_por_ambito.map((r) => r.anio))].sort().map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        {indices.map((m) => (
          <ChartCard
            key={m.id}
            modelo={m}
            corte={base.meta.fecha_corte_estados}
            onSelect={seleccionarOficial}
          />
        ))}
      </div>
      <details className="rounded-lg border border-border bg-card p-5">
        <summary className="cursor-pointer font-semibold">Metas 2026 — no son resultados</summary>
        <div className="mt-5 grid min-w-0 gap-6 xl:grid-cols-2">
          {metas.map((m) => (
            <ChartCard
              key={m.id}
              modelo={m}
              corte={base.meta.fecha_corte_estados}
              onSelect={seleccionarOficial}
            />
          ))}
        </div>
      </details>
      <details className="rounded-lg border border-border bg-card p-5">
        <summary className="cursor-pointer font-semibold">
          Acumulado de 12 meses a febrero de 2026
        </summary>
        <div className="mt-5 grid min-w-0 gap-6 xl:grid-cols-2">
          {movil.map((m) => (
            <ChartCard
              key={m.id}
              modelo={m}
              corte={base.meta.fecha_corte_estados}
              onSelect={seleccionarOficial}
            />
          ))}
        </div>
      </details>
      <details className="rounded-lg border border-border bg-card p-5">
        <summary className="cursor-pointer font-semibold">Recálculos PBIX — no oficiales</summary>
        <div className="mt-5 grid min-w-0 gap-6 xl:grid-cols-2">
          {pbix.map((m) => (
            <ChartCard
              key={m.id}
              modelo={m}
              corte={base.meta.fecha_corte_estados}
              onSelect={seleccionarOficial}
            />
          ))}
        </div>
      </details>
      <details className="rounded-lg border border-border bg-card p-5">
        <summary className="cursor-pointer font-semibold">
          Versiones y registros oficiales de origen · {i.registros_oficiales.length}
        </summary>
        <p className="mt-3 text-xs">
          Se conservan las discrepancias de fuente. Las metas y los cuadros repetidos no se suman
          como nuevos hechos.
        </p>
        <label className="mt-4 grid gap-2 text-sm">
          Buscar período, ámbito, medida o documento
          <input
            className="rounded-md border border-border bg-background p-3"
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
          />
        </label>
        <Tabla titulo="Registros oficiales por versión">
          <thead>
            <tr>
              <th>Período</th>
              <th>Ámbito</th>
              <th>Indicador</th>
              <th>Valor original</th>
              <th>Nota / fuente</th>
            </tr>
          </thead>
          <tbody>
            {versiones.map((r, idx) => (
              <tr key={idx}>
                <td>{r.periodo}</td>
                <td>{r.ambito}</td>
                <td>{r.indicador}</td>
                <td>{r.valor}</td>
                <td>
                  {r.nota ?? 'No consta'}
                  <br />
                  {r.fuente}
                </td>
              </tr>
            ))}
          </tbody>
        </Tabla>
      </details>
    </div>
  );
}
