'use client';
import { useVista } from '@/lib/hooks/use-base';
import { FiltrosPanel } from '@/components/shell/filtros-panel';
import { ChartCard } from '@/components/charts/chart-card';
import { Kpis } from '@/components/analytics/kpis';
import { ReproduccionControls } from '@/components/analytics/reproduccion-controls';
import {
  modeloConteo,
  modeloTendencia,
  modeloCumplimiento,
  modeloProyectos,
} from '@/lib/analytics/modelos';
import { Titulo, EstadoConsulta, LinkContexto } from './shared';
export function Dashboard() {
  const v = useVista();
  if (!v.seleccion || !v.base)
    return (
      <EstadoConsulta
        loading={v.isPending}
        error={v.error}
        retry={() => {
          void v.refetch();
        }}
      />
    );
  const { eventos, acciones, cohorteAcciones } = v.seleccion;
  const corte = v.base.meta.fecha_corte_estados;
  const accidentes = eventos.filter((e) => e.tipoGrupo === 'Accidente');
  const niveles = modeloConteo(accidentes, 'nivelIncimmet', 'Accidentes a personas por nivel');
  niveles.puntos = niveles.puntos.map((p) => ({
    ...p,
    filtros: { ...p.filtros, grupos: ['Accidente'] },
  }));
  const hpri = modeloConteo(
    eventos.filter((e) => e.altoPotencial === true),
    'proyectoCodigo',
    'Alto potencial por proyecto',
  );
  hpri.puntos = hpri.puntos.map((p) => ({ ...p, filtros: { ...p.filtros, altoPotencial: true } }));
  const lider = modeloProyectos(eventos, v.base.proyectos).puntos[0];
  const cerradas = cohorteAcciones.filter(
    (a) => a.estadoVerificado === 'Cerrada con evidencia',
  ).length;
  const sinInfo = cohorteAcciones.filter((a) => a.estadoVerificado === 'Sin información').length;
  return (
    <>
      <Titulo
        titulo="Dashboard ejecutivo"
        subtitulo={`${eventos.length} eventos y ${acciones.length} acciones en la selección. Volumen documental no equivale a tasa ajustada por exposición.`}
      />
      <Kpis eventos={eventos} acciones={cohorteAcciones} />
      <section
        aria-label="Lo que dicen los datos"
        className="executive-brief mb-5 rounded-xl border border-border bg-card p-4"
      >
        <h2 className="text-sm font-semibold">Lectura ejecutiva</h2>
        <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
          <p>
            {lider && eventos.length
              ? `${lider.etiqueta} concentra ${(((lider.valor ?? 0) / eventos.length) * 100).toFixed(1)}% de los registros seleccionados.`
              : 'Sin registros en esta selección.'}
          </p>
          <p>
            {cohorteAcciones.length
              ? `${((cerradas / cohorteAcciones.length) * 100).toFixed(1)}% con cierre según el estado mostrado (${cerradas}/${cohorteAcciones.length}).`
              : 'Sin acciones en la cohorte.'}
          </p>
          <p>
            {sinInfo} acciones sin información. No equivale a cumplimiento ni a ausencia de
            obligaciones.
          </p>
        </div>
      </section>
      <div className="workflow-links" aria-label="Accesos de gestión">
        <LinkContexto href="/eventos">Consultar eventos →</LinkContexto>
        <LinkContexto href="/acciones">Gestionar acciones →</LinkContexto>
        <LinkContexto href="/lecciones">Explorar lecciones →</LinkContexto>
      </div>
      <FiltrosPanel />
      <ReproduccionControls />
      {v.isPlaceholderData && (
        <p role="status" className="mb-4 text-sm">
          Actualizando contexto de datos…
        </p>
      )}
      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        {[
          modeloTendencia(eventos, 'anual'),
          modeloProyectos(eventos, v.base.proyectos),
          modeloConteo(eventos, 'tipoGrupo', 'Distribución por grupo', 'donut'),
          niveles,
          modeloCumplimiento(acciones, 'proyecto'),
          hpri,
        ].map((m) => (
          <ChartCard key={m.id} modelo={m} corte={corte} />
        ))}
      </div>
      <div className="mt-7 flex flex-wrap gap-5 text-sm">
        <LinkContexto href="/eventos">Ver eventos de la selección</LinkContexto>
        <LinkContexto href="/acciones">Revisar acciones y evidencia</LinkContexto>
        <LinkContexto href="/analisis">Indicadores oficiales y análisis avanzado</LinkContexto>
      </div>
    </>
  );
}
