'use client';
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { useDataSource, useSesion } from '@/components/providers';
import { useBase } from '@/lib/hooks/use-base';
import type { DataJson } from '@/lib/types';
import { ColaCampo } from '@/lib/pwa/cola';
import { nuevoFormulario } from '@/lib/pwa/formulario';
import type { BorradorCampo, EnvioCampo } from '@/lib/pwa/types';
import { FormularioReporte } from '@/components/campo/formulario-campo';
import { PwaControls } from '@/components/campo/pwa-controls';
import { EvidenceDialog } from '@/components/actions/evidence-dialog';
import { Button } from '@/components/ui/button';
import { semaforoFecha } from '@/lib/domain/estadoVerificado';
import { fechaLima, formatoFecha } from '@/lib/domain/fechas';
import { Titulo, EstadoConsulta } from './shared';
const subscribeNetwork = (callback: () => void) => {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
};
const onlineSnapshot = () => navigator.onLine;
export function Campo() {
  const source = useDataSource(),
    { actor, cambiar, hidratado } = useSesion();
  const base = useBase('base+local');
  const connected = useSyncExternalStore(subscribeNetwork, onlineSnapshot, () => true);
  const [cola] = useState(() => new ColaCampo());
  const [borradores, setBorradores] = useState<BorradorCampo[]>([]),
    [envios, setEnvios] = useState<EnvioCampo[]>([]),
    [edit, setEdit] = useState<BorradorCampo | null>(null);
  const [tab, setTab] = useState('reportar'),
    [message, setMessage] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [accion, setAccion] = useState(''),
    [riesgo, setRiesgo] = useState('');
  const cargar = useCallback(async () => {
    try {
      const [drafts, queue] = await Promise.all([cola.borradores(actor), cola.envios(actor)]);
      setBorradores(drafts);
      setEnvios(queue);
    } catch {
      setError('No se pudo leer el almacenamiento local. No se confirma ningún guardado.');
    }
  }, [cola, actor]);
  const sincronizar = useCallback(async () => {
    if (!navigator.onLine) return;
    setBusy(true);
    try {
      const n = await cola.sincronizar(source, actor, true);
      if (n)
        setMessage(`${n} reporte(s) registrado(s) en la demo local. No enviados a un servidor.`);
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo procesar la cola.');
    } finally {
      setBusy(false);
    }
  }, [cola, source, actor, cargar]);
  useEffect(() => {
    const t = setTimeout(() => {
      void cargar();
    }, 0);
    return () => clearTimeout(t);
  }, [cargar]);
  useEffect(() => {
    if (!connected || !hidratado || !actor.proyectoCodigo) return;
    const t = setTimeout(() => {
      void sincronizar();
    }, 500);
    return () => clearTimeout(t);
  }, [connected, hidratado, actor.proyectoCodigo, sincronizar]);
  if (!base.data)
    return (
      <EstadoConsulta
        loading={base.isPending}
        error={base.error}
        retry={() => {
          void base.refetch();
        }}
      />
    );
  // Canonical raw document for validation; local overlays are never inserted into the original.
  const data: DataJson = {
    meta: base.data.meta,
    catalogos: base.data.catalogos,
    proyectos: base.data.proyectos,
    eventos: base.data.eventos.flatMap((e) => (e.original ? [e.original] : [])),
    acciones: base.data.acciones.map((a) => a.original),
    lecciones: base.data.lecciones.map((l) => l.original),
    indicadores: base.data.indicadores,
    documentos_fuente: base.data.documentosFuente,
  };
  const proyecto = base.data.proyectos.find((p) => p.codigo === actor.proyectoCodigo);
  const pendientes = envios.filter((e) => e.estado !== 'registrado_demo_local').length;
  const acciones = base.data.acciones.filter((a) => a.proyectoCodigo === actor.proyectoCodigo);
  const lecciones = base.data.lecciones.filter(
    (l) =>
      (l.proyectoCodigos.includes(actor.proyectoCodigo ?? '') ||
        l.aplicabilidad === 'Todos los proyectos') &&
      (!riesgo || l.riesgoCritico === riesgo),
  );
  const elegida = acciones.find((a) => a.id === accion);
  function nueva() {
    if (!proyecto) return;
    setEdit({
      id: crypto.randomUUID(),
      actor,
      formulario: nuevoFormulario(proyecto.codigo),
      paso: 0,
      fotos: [],
      actualizadoEn: new Date().toISOString(),
    });
  }
  return (
    <div className="campo-root">
      <Titulo
        titulo="Campo · Reporte y seguimiento"
        subtitulo="Reporte sin conexión, acciones del proyecto y lecciones aplicables. Demo local sin transmisión a un servidor."
      />
      <div
        className={`mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 text-sm ${connected ? 'border-border bg-card' : 'border-amber-500 bg-amber-50 text-slate-900'}`}
        role="status"
        aria-live="polite"
      >
        <strong>{connected ? 'Con conexión' : 'Sin conexión · Guardado local disponible'}</strong>
        <span>{pendientes} pendiente(s) de envío</span>
      </div>
      <PwaControls />
      {!edit && (
        <label className="mb-5 grid w-full min-w-0 gap-2 text-sm font-medium sm:max-w-md">
          Proyecto del supervisor
          <select
            className="w-full min-w-0"
            aria-label="Proyecto del supervisor"
            value={actor.proyectoCodigo ?? ''}
            onChange={(e) => {
              cambiar({ ...actor, proyectoCodigo: e.target.value || undefined });
              setMessage('');
              setError('');
            }}
          >
            <option value="">Seleccione proyecto</option>
            {base.data.proyectos.map((p) => (
              <option key={p.codigo} value={p.codigo}>
                {p.nombre}
              </option>
            ))}
          </select>
        </label>
      )}
      <div role="group" aria-label="Vistas de Campo" className="mb-5 flex flex-wrap gap-2">
        {[
          ['reportar', 'Reportar'],
          ['cola', `Cola (${pendientes})`],
          ['acciones', 'Mis acciones'],
          ['lecciones', 'Lecciones por riesgo'],
        ].map(([id, label]) => (
          <Button
            key={id}
            variant={tab === id ? 'default' : 'outline'}
            aria-pressed={tab === id}
            disabled={!!edit}
            onClick={() => setTab(id!)}
          >
            {label}
          </Button>
        ))}
      </div>
      {message && (
        <p
          role="status"
          aria-live="polite"
          className="mb-4 rounded border border-brand-accent p-4 text-sm"
        >
          {message}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mb-4 rounded border border-red-500 bg-red-50 p-4 text-sm text-red-900"
        >
          {error}
        </p>
      )}
      {!proyecto ? (
        <p className="rounded-xl border border-border p-5">
          Seleccione su proyecto para reportar y consultar acciones. El selector de rol no autentica
          su identidad.
        </p>
      ) : (
        <>
          {tab === 'reportar' &&
            (edit ? (
              <FormularioReporte
                key={edit.id}
                inicial={edit}
                data={data}
                actor={edit.actor}
                cola={cola}
                cancelar={() => {
                  setEdit(null);
                  void cargar();
                }}
                terminado={() => {
                  setEdit(null);
                  setTab('cola');
                  setMessage('Guardado en este dispositivo · Pendiente de envío.');
                  void cargar().then(() => {
                    if (navigator.onLine) void sincronizar();
                  });
                }}
              />
            ) : (
              <section className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-xl font-semibold">{proyecto.nombre}</h2>
                <p className="my-4 text-sm text-secondary">
                  Documente el hecho sin identidades ni diagnósticos. Las fotos son opcionales.
                </p>
                <Button className="min-h-14 w-full sm:w-auto" onClick={nueva}>
                  Nuevo reporte de evento
                </Button>
                <h3 className="mb-3 mt-7 font-semibold">Borradores de este proyecto</h3>
                {!borradores.length && (
                  <p className="text-sm text-secondary">No hay borradores guardados.</p>
                )}
                {borradores.map((b) => (
                  <article key={b.id} className="mb-3 rounded border border-border p-4 text-sm">
                    <p>
                      {b.formulario.area || 'Lugar pendiente'} · Paso {b.paso + 1} de 4
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => setEdit(b)}>
                        Continuar borrador
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (window.confirm('¿Eliminar este borrador y sus fotos?'))
                            void cola
                              .eliminarBorrador(b.id)
                              .then(cargar)
                              .catch(() => setError('No se pudo eliminar el borrador.'));
                        }}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </article>
                ))}
              </section>
            ))}
          {tab === 'cola' && (
            <section>
              <h2 className="mb-3 text-xl font-semibold">Cola de reportes</h2>
              <Button
                disabled={!connected || busy}
                onClick={() => {
                  void sincronizar();
                }}
              >
                {busy ? 'Procesando cola…' : 'Reintentar pendientes'}
              </Button>
              <p className="my-4 text-sm text-secondary">
                La conexión permite procesar la cola en esta demo; no se envían datos a SSOMA ni a
                otros dispositivos.
              </p>
              {!envios.length && <p>No hay reportes en la cola de este proyecto.</p>}
              {envios.map((e) => (
                <article
                  key={e.id}
                  className="mb-4 rounded-xl border border-border bg-card p-4 text-sm"
                >
                  <p className="font-semibold">
                    {e.reporte.area} · {formatoFecha(e.reporte.fecha)} {e.reporte.hora}
                  </p>
                  <p className="mt-2">
                    {e.estado === 'registrado_demo_local'
                      ? 'Registrado en la demo local'
                      : e.estado === 'error'
                        ? 'Pendiente de envío · Error de procesamiento'
                        : 'Pendiente de envío'}
                  </p>
                  <p className="mt-2 break-all text-xs text-secondary">
                    ID estable: {e.id} · Intentos: {e.intentos}
                  </p>
                  {e.ultimoError && (
                    <p className="mt-3" role="alert">
                      {e.ultimoError}
                    </p>
                  )}
                  {e.acuseLocal && (
                    <p className="mt-2 break-all text-xs">
                      Acuse local: {e.acuseLocal}. No es recepción por servidor.
                    </p>
                  )}
                </article>
              ))}
            </section>
          )}
          {tab === 'acciones' && (
            <section>
              <h2 className="mb-3 text-xl font-semibold">Mis acciones · {proyecto.nombre}</h2>
              <p className="mb-4 text-sm text-secondary">
                Se muestran las acciones del proyecto. Para adjuntar evidencia, seleccione su
                función responsable; las no asignadas requieren revisión SSOMA.
              </p>
              {acciones.map((a) => (
                <article key={a.id} className="mb-4 rounded-xl border border-border bg-card p-4">
                  <h3 className="font-semibold">{a.id}</h3>
                  <p className="my-3 text-sm">{a.descripcion}</p>
                  <span className="status-badge" data-estado={a.estadoVerificado}>
                    {a.estadoVerificado}
                  </span>
                  <p className="my-3 text-sm">
                    {!a.fechaCompromiso && !a.responsableRol
                      ? 'Responsable y fecha: no constan'
                      : `${a.responsableRol ?? 'Rol: No consta'} · ${semaforoFecha(a.fechaCompromiso, a.estadoOperativo ? fechaLima(new Date()) : base.data!.meta.fecha_corte_estados).etiqueta}`}
                  </p>
                  <Button variant="outline" onClick={() => setAccion(a.id)}>
                    Adjuntar evidencia
                  </Button>
                </article>
              ))}
              {!acciones.length && (
                <p>Sin acciones vinculadas en esta base; no acredita ausencia de obligaciones.</p>
              )}
            </section>
          )}
          {tab === 'lecciones' && (
            <section>
              <h2 className="mb-3 text-xl font-semibold">Lecciones por riesgo</h2>
              <label className="mb-4 grid min-w-0 gap-2 text-sm">
                Riesgo
                <select
                  className="w-full min-w-0"
                  value={riesgo}
                  onChange={(e) => setRiesgo(e.target.value)}
                >
                  <option value="">Todos los riesgos</option>
                  {[...new Set(base.data.lecciones.map((l) => l.riesgoCritico))].map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
              {lecciones.map((l) => (
                <article key={l.id} className="mb-4 rounded-xl border border-border bg-card p-5">
                  <h3 className="font-semibold">
                    {l.id} · {l.riesgoCritico}
                  </h3>
                  <p className="mt-3 text-sm">{l.quePaso}</p>
                  <p className="mt-3 text-sm font-medium">{l.leccion}</p>
                  <dl className="mt-4 grid gap-2 text-sm">
                    {Object.entries(l.controles).map(([k, v]) => (
                      <div key={k}>
                        <dt className="font-semibold">
                          {(
                            {
                              eliminacion: 'Eliminación',
                              sustitucion: 'Sustitución',
                              ingenieria: 'Ingeniería',
                              administrativos: 'Administrativos',
                              epp: 'EPP',
                            } as Record<string, string>
                          )[k] ?? k}
                        </dt>
                        <dd>{v ?? 'No consta'}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-3 text-xs text-secondary">
                    Catalogada · Aplicabilidad: {l.aplicabilidad}
                  </p>
                </article>
              ))}
              {!lecciones.length && <p>Sin lecciones para el contexto seleccionado.</p>}
            </section>
          )}
        </>
      )}
      {elegida && (
        <EvidenceDialog accion={elegida} base={base.data} onClose={() => setAccion('')} />
      )}
    </div>
  );
}
