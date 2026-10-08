'use client';
import { useEffect, useState } from 'react';
import { useVista } from '@/lib/hooks/use-base';
import { formatoFecha, fechaLima } from '@/lib/domain/fechas';
import { semaforoFecha, ESTADOS_VERIFICADOS } from '@/lib/domain/estadoVerificado';
import { eventHref } from '@/lib/domain/analitica';
import type { AccionLectura } from '@/lib/types';
import { FiltrosPanel } from '@/components/shell/filtros-panel';
import { EvidenceDialog } from '@/components/actions/evidence-dialog';
import { ChartCard } from '@/components/charts/chart-card';
import { modeloComparado } from '@/lib/analytics/modelos';
import { Button } from '@/components/ui/button';
import { Titulo, EstadoConsulta, Tabla, LinkContexto } from './shared';
function Plazo({ accion, corte }: { accion: AccionLectura; corte: string }) {
  const plazo = semaforoFecha(accion.fechaCompromiso, corte);
  if (!accion.fechaCompromiso) return <p className="text-xs">Fecha compromiso: No consta</p>;
  return (
    <span className="block text-sm">
      <span>{formatoFecha(accion.fechaCompromiso)}</span>
      <span
        className="mt-2 block rounded border border-border p-2 text-xs deadline"
        data-plazo={plazo.estado}
      >
        {plazo.etiqueta}
        {accion.estadoVerificado === 'Cerrada con evidencia'
          ? ' · Acción cerrada según estado mostrado'
          : ''}
      </span>
    </span>
  );
}
function Estado({ a }: { a: AccionLectura }) {
  return (
    <>
      <span className="status-badge" data-estado={a.estadoVerificado}>
        {a.estadoVerificado}
      </span>
      {a.estadoOperativo && (
        <p className="mt-2 text-xs">Evaluación local · Origen: {a.estadoImportado}</p>
      )}
      {a.coberturaParcial && (
        <p className="mt-2 text-xs font-semibold">Advertencia: cobertura importada parcial</p>
      )}
    </>
  );
}
export function Acciones() {
  const v = useVista();
  const [vista, setVista] = useState<'lista' | 'kanban'>('lista'),
    [seleccionada, setSeleccionada] = useState(''),
    [estadoMovil, setEstadoMovil] = useState<string>('');
  useEffect(() => {
    const abrir = () =>
      setSeleccionada(new URLSearchParams(window.location.search).get('accion') ?? '');
    const raf = requestAnimationFrame(abrir);
    window.addEventListener('popstate', abrir);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('popstate', abrir);
    };
  }, []);
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
  const base = v.base,
    acciones = v.seleccion.acciones,
    cohorte = v.seleccion.cohorteAcciones;
  const corte = (a: AccionLectura) =>
    a.estadoOperativo ? fechaLima(new Date()) : base.meta.fecha_corte_estados;
  const elegida = base.acciones.find((a) => a.id === seleccionada);
  const cerrar = () => {
    setSeleccionada('');
    const url = new URL(window.location.href);
    url.searchParams.delete('accion');
    window.history.replaceState(window.history.state, '', url);
  };
  return (
    <>
      <Titulo
        titulo="Registro de acciones"
        subtitulo={`${acciones.length} acciones. Lista y kanban muestran el estado verificado, nunca editable por arrastre. Archivo + revisión independiente + alcance suficiente habilitan el cierre local.`}
      />
      <FiltrosPanel />
      <div className="mb-5 flex flex-wrap gap-3" role="group" aria-label="Vista de acciones">
        <Button
          variant={vista === 'lista' ? 'default' : 'outline'}
          aria-pressed={vista === 'lista'}
          onClick={() => setVista('lista')}
        >
          Lista
        </Button>
        <Button
          variant={vista === 'kanban' ? 'default' : 'outline'}
          aria-pressed={vista === 'kanban'}
          onClick={() => setVista('kanban')}
        >
          Kanban
        </Button>
        <span className="self-center text-xs text-secondary">
          Corte de origen: {formatoFecha(base.meta.fecha_corte_estados)} · Sin cambios al JSON
          original
        </span>
      </div>
      {vista === 'lista' ? (
        <Tabla titulo="Acciones y evidencias">
          <thead>
            <tr>
              <th>Acción / origen</th>
              <th>Estado</th>
              <th>Compromiso</th>
              <th>Rol / jerarquía</th>
              <th>Evidencia</th>
            </tr>
          </thead>
          <tbody>
            {acciones.map((a) => (
              <tr key={a.id}>
                <td className="min-w-64">
                  <strong>
                    {a.id} · {a.proyectoCodigo}
                  </strong>
                  <p className="my-2 max-w-md text-sm leading-relaxed">{a.descripcion}</p>
                  <LinkContexto href={eventHref(a.eventoId)}>{a.eventoId}</LinkContexto>
                </td>
                <td>
                  <Estado a={a} />
                </td>
                <td>
                  <Plazo accion={a} corte={corte(a)} />
                </td>
                <td>
                  {a.responsableRol ?? 'No consta'}
                  <p className="mt-2 text-xs text-secondary">
                    {a.jerarquia} · {a.alcance}
                  </p>
                </td>
                <td>
                  <p className="mb-3 text-xs">
                    {a.referenciasEvidencia.join(', ') || 'Sin referencias'}
                  </p>
                  <Button variant="outline" onClick={() => setSeleccionada(a.id)}>
                    Adjuntar evidencia
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Tabla>
      ) : (
        <>
          <label className="mb-4 grid gap-2 text-sm xl:hidden">
            Columna de estado
            <select
              className="w-full min-w-0"
              value={estadoMovil}
              onChange={(e) => setEstadoMovil(e.target.value)}
            >
              <option value="">Todos los estados</option>
              {ESTADOS_VERIFICADOS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <div
            role="region"
            aria-label="Kanban de acciones por estado verificado"
            tabIndex={0}
            className="grid min-w-0 items-start gap-4 xl:grid-cols-5"
          >
            {ESTADOS_VERIFICADOS.filter((s) => !estadoMovil || s === estadoMovil).map((s) => {
              const filas = acciones.filter((a) => a.estadoVerificado === s);
              return (
                <section key={s} className="min-w-0 rounded-lg border border-border bg-muted p-3">
                  <h2 className="mb-3 text-sm font-semibold leading-snug">
                    {s} <span className="ml-1">({filas.length})</span>
                  </h2>
                  <div className="max-h-[75vh] space-y-3 overflow-y-auto">
                    {filas.map((a) => (
                      <article
                        key={a.id}
                        className="kanban-card min-w-0 rounded-lg border border-border bg-card p-3"
                      >
                        <p className="text-sm font-semibold">
                          {a.id} · {a.proyectoCodigo}
                        </p>
                        <p className="my-3 text-xs leading-relaxed">{a.descripcion}</p>
                        {!a.fechaCompromiso &&
                        (!a.responsableRol || /^no consta/i.test(a.responsableRol)) ? (
                          <p className="mb-2 text-xs">Responsable y fecha: no constan</p>
                        ) : (
                          <>
                            <p className="mb-2 text-xs">
                              Responsable: {a.responsableRol ?? 'No consta'}
                            </p>
                            <Plazo accion={a} corte={corte(a)} />
                          </>
                        )}
                        {a.coberturaParcial && (
                          <p className="mt-2 text-xs font-semibold">Cobertura importada parcial</p>
                        )}
                        <div className="my-2 break-words text-xs">
                          <LinkContexto href={eventHref(a.eventoId)}>{a.eventoId}</LinkContexto>
                        </div>
                        <Button
                          variant="outline"
                          className="mt-2 w-full px-2 text-xs"
                          onClick={() => setSeleccionada(a.id)}
                        >
                          Adjuntar evidencia
                        </Button>
                      </article>
                    ))}
                    {!filas.length && <p className="py-5 text-xs">Sin acciones en esta columna.</p>}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}
      {!acciones.length && (
        <p className="mt-4" role="status">
          Sin acciones con estos filtros.
        </p>
      )}
      <div className="mt-8">
        <ChartCard modelo={modeloComparado(cohorte)} corte={base.meta.fecha_corte_estados} />
      </div>
      {elegida && <EvidenceDialog key={elegida.id} accion={elegida} base={base} onClose={cerrar} />}
    </>
  );
}
