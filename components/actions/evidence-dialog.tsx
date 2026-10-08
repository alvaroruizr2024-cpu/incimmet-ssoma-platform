'use client';
import * as Dialog from '@radix-ui/react-dialog';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { AccionLectura, BaseNormalizada, EvidenciaLocal } from '@/lib/types';
import { useDataSource, useFiltros, useSesion } from '@/components/providers';
import { descargarBlob } from '@/lib/client/descargas';
import { Button } from '@/components/ui/button';
function VistaArchivo({ evidencia }: { evidencia: EvidenciaLocal }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const objeto = URL.createObjectURL(evidencia.archivo.blob);
    const raf = requestAnimationFrame(() => setUrl(objeto));
    return () => {
      cancelAnimationFrame(raf);
      URL.revokeObjectURL(objeto);
    };
  }, [evidencia.archivo.blob]);
  return (
    <div className="mt-2">
      {evidencia.archivo.mime.startsWith('image/') && url && (
        <Image
          unoptimized
          width={320}
          height={220}
          src={url}
          alt={`Evidencia ${evidencia.archivo.nombre}`}
          className="max-h-56 max-w-full rounded object-contain"
        />
      )}
      <Button
        className="mt-2"
        variant="outline"
        onClick={() => descargarBlob(evidencia.archivo.blob, evidencia.archivo.nombre)}
      >
        Revisar archivo original
      </Button>
    </div>
  );
}
function Verificacion({
  ev,
  accion,
  base,
  onDone,
}: {
  ev: EvidenciaLocal;
  accion: AccionLectura;
  base: BaseNormalizada;
  onDone: (mensaje: string) => void;
}) {
  const source = useDataSource(),
    { actor } = useSesion(),
    actualizar = useFiltros((s) => s.actualizar);
  const [motivo, setMotivo] = useState(''),
    [cobertura, setCobertura] = useState<string[]>([]),
    [completo, setCompleto] = useState(false),
    [decision, setDecision] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const requeridos =
    accion.alcance === 'Todos los proyectos'
      ? base.proyectos.map((p) => p.codigo)
      : accion.alcance?.startsWith('OR, TA, UC')
        ? ['OR', 'TA', 'UC']
        : [accion.proyectoCodigo];
  const enviar = async () => {
    try {
      setBusy(true);
      setError('');
      if (!decision) throw new Error('Seleccione aceptar o rechazar');
      await source.validarEvidencia(
        ev.id,
        {
          aceptada: decision === 'aceptar',
          motivo,
          alcanceCompleto: completo,
          proyectosCubiertos: cobertura,
        },
        actor,
      );
      actualizar({ contexto: 'base+local' });
      onDone('Decisión registrada en la demo local; estado recalculado.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al validar');
    } finally {
      setBusy(false);
    }
  };
  if (ev.validacion)
    return (
      <div className="mt-3 rounded border border-border p-3 text-sm">
        <strong>{ev.validacion.aceptada ? 'Validada' : 'Rechazada'}</strong> · {ev.validacion.rol}
        <p className="mt-2">{ev.validacion.motivo}</p>
        <p className="mt-1 text-xs">
          {new Date(ev.validacion.fecha).toLocaleString('es-PE', { timeZone: 'America/Lima' })} ·
          Cobertura: {ev.validacion.proyectosCubiertos.join(', ') || 'No acreditada'}
        </p>
      </div>
    );
  if (actor.rol !== 'SSOMA corporativo')
    return <p className="mt-3 text-sm">Pendiente de validación por SSOMA corporativo.</p>;
  if (ev.subidoPorRol === actor.rol)
    return (
      <p className="mt-3 text-sm">
        No puede autovalidarse. La evidencia fue subida bajo el mismo rol. Registre la evidencia con
        el rol ejecutor y solicite revisión independiente.
      </p>
    );
  return (
    <fieldset className="mt-4 space-y-3 rounded border border-border p-4">
      <legend className="px-2 text-sm font-semibold">Validar evidencia</legend>
      <label className="grid gap-1 text-sm">
        Rol validador
        <select className="w-full min-w-0" value={actor.rol} aria-label="Rol validador" disabled>
          <option>SSOMA corporativo</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        Decisión
        <select
          className="w-full min-w-0"
          value={decision}
          onChange={(e) => setDecision(e.target.value)}
        >
          <option value="">Seleccione</option>
          <option value="aceptar">Aceptar</option>
          <option value="rechazar">Rechazar</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        Motivo de validación
        <textarea
          rows={3}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Pertinencia, suficiencia y observaciones de revisión. Sin datos personales."
        />
      </label>
      <p className="text-xs text-secondary">
        Alcance requerido: {requeridos.join(', ')}. La selección acredita únicamente lo revisado por
        el validador.
      </p>
      <div className="flex flex-wrap gap-2">
        {base.proyectos
          .filter((p) => requeridos.includes(p.codigo))
          .map((p) => (
            <label
              key={p.codigo}
              className="flex min-h-12 items-center gap-2 rounded border border-border px-3 text-sm"
            >
              <input
                type="checkbox"
                checked={cobertura.includes(p.codigo)}
                onChange={(e) =>
                  setCobertura(
                    e.target.checked
                      ? [...cobertura, p.codigo]
                      : cobertura.filter((v) => v !== p.codigo),
                  )
                }
              />
              {p.nombre}
            </label>
          ))}
      </div>
      <label className="flex min-h-12 items-start gap-3 text-sm">
        <input
          className="mt-1"
          type="checkbox"
          checked={completo}
          onChange={(e) => setCompleto(e.target.checked)}
        />
        Verifiqué el archivo, su pertinencia y la cobertura completa de la acción.
      </label>
      <Button
        disabled={busy}
        onClick={() => {
          void enviar();
        }}
      >
        Registrar validación
      </Button>
      {error && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
    </fieldset>
  );
}
export function EvidenceDialog({
  accion,
  base,
  onClose,
}: {
  accion: AccionLectura;
  base: BaseNormalizada;
  onClose: () => void;
}) {
  const source = useDataSource(),
    { actor } = useSesion(),
    actualizar = useFiltros((s) => s.actualizar);
  const fileRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null),
    [privacidad, setPrivacidad] = useState(false),
    [error, setError] = useState(''),
    [mensaje, setMensaje] = useState(''),
    [busy, setBusy] = useState(false),
    [rol, setRol] = useState(accion.responsableRol ?? ''),
    [fecha, setFecha] = useState(accion.fechaCompromiso ?? ''),
    [motivo, setMotivo] = useState('');
  const q = useQuery({
    queryKey: ['evidencias', accion.id],
    queryFn: () => source.getEvidencias(accion.id),
  });
  const historia = useQuery({
    queryKey: ['historial', accion.id],
    queryFn: () => source.getHistorial(accion.id),
  });
  const puedeAdjuntar =
    actor.rol === 'SSOMA corporativo' ||
    (actor.rol === 'Supervisor de campo' &&
      actor.proyectoCodigo === accion.proyectoCodigo &&
      !!actor.responsableRol &&
      actor.responsableRol === accion.responsableRol);
  const cargar = async () => {
    try {
      setBusy(true);
      setError('');
      setMensaje('');
      if (!archivo) throw new Error('Seleccione un archivo');
      if (!privacidad) throw new Error('Revise la privacidad del archivo antes de adjuntarlo');
      await source.adjuntarEvidencia(accion.id, archivo, actor);
      actualizar({ contexto: 'base+local' });
      setArchivo(null);
      setMensaje(
        'Archivo guardado en este dispositivo. Pendiente de validación; no enviado a un servidor.',
      );
      await q.refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo adjuntar');
    } finally {
      setBusy(false);
    }
  };
  const asignar = async () => {
    try {
      setBusy(true);
      setError('');
      await source.asignarAccion(accion.id, rol, fecha || null, motivo, actor);
      actualizar({ contexto: 'base+local' });
      setMensaje(
        'Asignación local guardada. El responsable de campo puede adjuntar con su contexto de proyecto y función.',
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo asignar');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/70" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90svh] w-[calc(100%_-_24px)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-xl border border-border bg-card p-5 text-foreground shadow-xl sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <Dialog.Title className="text-xl font-bold">
              Adjuntar evidencia · {accion.id}
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="outline" disabled={busy} aria-label="Cerrar evidencia">
                Cerrar
              </Button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-3 text-sm leading-relaxed text-secondary">
            {accion.descripcion} · {accion.proyectoCodigo}. Evidencia local de demostración, no
            certificación documental.
          </Dialog.Description>
          <p className="mt-3 text-sm">
            Estado mostrado: <strong>{accion.estadoVerificado}</strong>. Estado importado:{' '}
            {accion.estadoImportado}.
          </p>
          {accion.coberturaParcial && (
            <p className="mt-3 rounded border border-amber-500 bg-amber-50 p-3 text-sm text-slate-900">
              El cierre importado tiene alcance parcial. No acredita una nueva validación integral.
            </p>
          )}
          <p className="mt-3 text-xs text-secondary">
            Referencias históricas: {accion.referenciasEvidencia.join(', ') || 'Sin referencias'}.
            Son códigos, no archivos adjuntos.
          </p>
          {actor.rol === 'SSOMA corporativo' && (
            <details className="mt-5 rounded border border-border p-4">
              <summary className="cursor-pointer text-sm font-semibold">
                Asignación local de responsable y compromiso
              </summary>
              <div className="mt-3 space-y-3">
                <p className="text-xs text-secondary">
                  Origen: {accion.original.responsable_rol ?? 'No consta'}; fecha{' '}
                  {accion.original.fecha_compromiso ?? 'No consta'}. La modificación solo afecta la
                  demo local.
                </p>
                <label className="grid gap-1 text-sm">
                  Función responsable (no nombre personal)
                  <input value={rol} onChange={(e) => setRol(e.target.value)} />
                </label>
                <label className="grid gap-1 text-sm">
                  Fecha compromiso
                  <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                </label>
                <label className="grid gap-1 text-sm">
                  Motivo de asignación
                  <textarea rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
                </label>
                <Button
                  disabled={busy}
                  onClick={() => {
                    void asignar();
                  }}
                >
                  Guardar asignación local
                </Button>
              </div>
            </details>
          )}
          <section
            className="mt-5 space-y-3 rounded border border-border p-4"
            aria-label="Cargar archivo"
          >
            <h3 className="text-base font-semibold">Archivo y revisión de privacidad</h3>
            <p className="text-xs">
              JPEG, PNG, WebP o PDF; máximo 10 MB por archivo y 10 archivos por acción. No incluya
              nombres, DNI, diagnósticos ni rostros identificables.
            </p>
            <p className="text-sm">
              Rol ejecutor actual: {actor.rol}. Revisión posterior: SSOMA corporativo, con un rol
              distinto al de carga.
            </p>
            <label className="grid gap-2 text-sm">
              Archivo
              <input
                key={mensaje}
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                disabled={!puedeAdjuntar || busy}
                aria-label="Archivo de evidencia"
                onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                className="hidden"
              />
            </label>
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={!puedeAdjuntar || busy}
                onClick={() => fileRef.current?.click()}
              >
                Seleccionar archivo
              </Button>
              <span className="break-all text-sm">
                {archivo?.name ?? 'Ningún archivo seleccionado'}
              </span>
            </div>
            <label className="flex min-h-12 items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={privacidad}
                onChange={(e) => setPrivacidad(e.target.checked)}
                className="mt-1"
              />
              Revisé el archivo y no contiene información personal prohibida.
            </label>
            <Button
              disabled={!puedeAdjuntar || busy}
              onClick={() => {
                void cargar();
              }}
            >
              Guardar evidencia pendiente
            </Button>
            {!puedeAdjuntar && (
              <p className="text-sm">
                Seleccione el proyecto y la función responsable de esta acción; las acciones sin
                responsable requieren asignación por SSOMA.
              </p>
            )}
          </section>
          {mensaje && (
            <p role="status" className="mt-4 rounded border border-brand-accent p-3 text-sm">
              {mensaje}
            </p>
          )}
          {error && (
            <p role="alert" className="mt-4 rounded border border-red-500 p-3 text-sm">
              {error}
            </p>
          )}
          <h3 className="mt-6 text-base font-semibold">Archivos locales y validación</h3>
          {q.isPending && (
            <p role="status" className="mt-3 text-sm">
              Cargando evidencias…
            </p>
          )}
          {q.error && (
            <p role="alert" className="mt-3 text-sm">
              {q.error.message}
            </p>
          )}
          {q.data?.map((ev) => (
            <article key={ev.id} className="mt-4 rounded border border-border p-4">
              <p className="break-words text-sm font-semibold">
                {ev.archivo.nombre} · {(ev.archivo.bytes / 1024).toFixed(1)} KB
              </p>
              <p className="mt-2 text-xs text-secondary">
                Cargada como {ev.subidoPorRol} ·{' '}
                {new Date(ev.creadoEn).toLocaleString('es-PE', { timeZone: 'America/Lima' })}
              </p>
              <VistaArchivo evidencia={ev} />
              <Verificacion ev={ev} accion={accion} base={base} onDone={setMensaje} />
            </article>
          ))}
          {q.data?.length === 0 && (
            <p className="mt-3 text-sm">
              Sin archivos locales. Las referencias importadas no habilitan la validación.
            </p>
          )}
          <details className="mt-5 rounded border border-border p-3">
            <summary className="cursor-pointer text-sm font-semibold">Historial local</summary>
            {historia.data?.map((h) => (
              <p key={h.id} className="mt-3 text-xs leading-relaxed">
                {new Date(h.fecha).toLocaleString('es-PE', { timeZone: 'America/Lima' })} · {h.rol}:{' '}
                {h.descripcion}
              </p>
            ))}
            {!historia.data?.length && (
              <p className="mt-3 text-xs">Sin cambios locales registrados.</p>
            )}
          </details>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
