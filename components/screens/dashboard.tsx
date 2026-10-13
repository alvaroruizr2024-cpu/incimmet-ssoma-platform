'use client';
import { Crosshair, LayoutList, PieChart, Target } from 'lucide-react';
import { useVista } from '@/lib/hooks/use-base';
import { FiltrosPanel } from '@/components/shell/filtros-panel';
import { ChartCard } from '@/components/charts/chart-card';
import { Kpis } from '@/components/analytics/kpis';
import { IndicadoresStrip } from '@/components/analytics/indicadores-strip';
import { ReproduccionControls } from '@/components/analytics/reproduccion-controls';
import {
  modeloConteo,
  modeloTendencia,
  modeloCumplimiento,
  modeloProyectos,
  modeloMatriz,
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
      <IndicadoresStrip indicadores={v.base.indicadores} />
      <Kpis eventos={eventos} acciones={cohorteAcciones} />
      <section
        aria-label="Lo que dicen los datos"
        className="executive-brief mb-5 rounded-xl border border-border bg-card p-4"
      >
        <h2 className="text-sm font-semibold">Lectura ejecutiva</h2>
        <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
          <p className="brief-item">
            <Target size={18} aria-hidden="true" />
            {lider && eventos.length
              ? `${lider.etiqueta} concentra ${(((lider.valor ?? 0) / eventos.length) * 100).toFixed(1)}% de los registros seleccionados.`
              : 'Sin registros en esta selección.'}
          </p>
          <p className="brief-item">
            <Crosshair size={18} aria-hidden="true" />
            {cohorteAcciones.length
              ? `${((cerradas / cohorteAcciones.length) * 100).toFixed(1)}% con cierre según el estado mostrado (${cerradas}/${cohorteAcciones.length}).`
              : 'Sin acciones en la cohorte.'}
          </p>
          <p className="brief-item">
            <LayoutList size={18} aria-hidden="true" />
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
      <section className="dash-section" aria-labelledby="dash-riesgo">
        <header className="dash-section-head">
          <h2 id="dash-riesgo">
            <PieChart size={18} aria-hidden="true" /> Perfil de riesgo
          </h2>
          <p>Tendencia, severidad × potencial y composición de los eventos seleccionados.</p>
        </header>
        <div className="grid min-w-0 gap-6 xl:grid-cols-2">
          {[
            modeloTendencia(eventos, 'anual'),
            modeloMatriz(eventos),
            modeloConteo(eventos, 'tipoGrupo', 'Distribución por grupo', 'donut'),
            niveles,
          ].map((m) => (
            <ChartCard key={m.id} modelo={m} corte={corte} />
          ))}
        </div>
      </section>
      <section className="dash-section" aria-labelledby="dash-gestion">
        <header className="dash-section-head">
          <h2 id="dash-gestion">
            <Crosshair size={18} aria-hidden="true" /> Gestión de acciones y frentes de trabajo
          </h2>
          <p>Estado verificado por proyecto, señales de alto potencial y carga por frente.</p>
        </header>
        <div className="grid min-w-0 gap-6 xl:grid-cols-2">
          {[modeloCumplimiento(acciones, 'proyecto'), hpri, modeloProyectos(eventos, v.base.proyectos)].map(
            (m) => (
              <ChartCard key={m.id} modelo={m} corte={corte} />
            ),
          )}
        </div>
      </section>
      <div className="mt-7 flex flex-wrap gap-5 text-sm">
        <LinkContexto href="/eventos">Ver eventos de la selección</LinkContexto>
        <LinkContexto href="/acciones">Revisar acciones y evidencia</LinkContexto>
        <LinkContexto href="/analisis">Indicadores oficiales y análisis avanzado</LinkContexto>
      </div>
    </>
  );
}
