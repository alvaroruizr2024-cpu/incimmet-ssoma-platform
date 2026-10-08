'use client';
import { useQuery } from '@tanstack/react-query';
import { useVista } from '@/lib/hooks/use-base';
import { useDataSource } from '@/components/providers';
import { formatoFecha } from '@/lib/domain/fechas';
import type { EventoJson } from '@/lib/types';
import { Card, CardTitle } from '@/components/ui/card';
import { SourceChips } from '@/components/events/source-chips';
import { Titulo, EstadoConsulta, LinkContexto } from './shared';
const CAMPOS: Record<keyof EventoJson, string> = {
  id: 'Identificador',
  fecha: 'Fecha del evento',
  fecha_texto: 'Fecha indicada como texto',
  anio: 'Año',
  mes: 'Mes',
  hora: 'Hora',
  proyecto: 'Proyecto',
  cliente: 'Cliente según evento',
  area: 'Labor / área',
  actividad: 'Actividad',
  puesto_rol: 'Rol de persona afectada',
  equipo: 'Equipo',
  tipo: 'Tipo',
  tipo_grupo: 'Grupo',
  clasificacion_fuente: 'Clasificación de la fuente',
  nivel_incimmet: 'Nivel INCIMMET',
  pg_incimmet: 'Potencial de gravedad INCIMMET',
  nivel_cliente: 'Nivel del cliente',
  pg_cliente: 'Potencial de gravedad del cliente',
  severidad_texto: 'Severidad textual',
  alto_potencial: 'Alto potencial marcado',
  riesgo_critico: 'Riesgo crítico',
  zona_cuerpo: 'Zona corporal general',
  descripcion: 'Descripción original',
  causas_inmediatas: 'Causas inmediatas',
  causas_basicas: 'Causas básicas',
  dias_perdidos: 'Días perdidos consignados',
  costo: 'Costo consignado (moneda no estructurada)',
  costo_texto: 'Costo textual',
  penalidad: 'Penalidad textual',
  empresa_tipo: 'Tipo de empresa',
  empresa_detalle: 'Empresa según fuente',
  estado: 'Estado de origen',
  n_acciones: 'Número de acciones importado',
  lecciones: 'Referencias de lecciones',
  fuentes: 'Fuentes documentales',
  confianza: 'Nivel de confianza',
  observaciones: 'Observaciones de origen',
};
function valor(v: unknown): string {
  if (v === null || v === undefined) return 'No consta';
  if (Array.isArray(v)) return v.length ? v.join(' · ') : 'Sin vínculos registrados';
  if (typeof v === 'boolean') return v ? 'Sí' : 'No marcado';
  return String(v);
}
const ciclo = [
  'Reportado',
  'En investigación',
  'Investigado',
  'Acciones definidas',
  'En seguimiento',
  'Cerrado',
  'Lección publicada',
];
export function EventoDetalle({ id, local = false }: { id: string; local?: boolean }) {
  const v = useVista(local ? 'base+local' : undefined),
    source = useDataSource();
  const historial = useQuery({
    queryKey: ['historial', id],
    queryFn: () => source.getHistorial(id),
  });
  if (!v.base)
    return (
      <EstadoConsulta
        loading={v.isPending}
        error={v.error}
        retry={() => {
          void v.refetch();
        }}
      />
    );
  const e = v.base.eventos.find((x) => x.id === id);
  if (!e)
    return (
      <>
        <h1>Evento no disponible en este contexto</h1>
        <p className="mt-4">
          El contexto de proyecto o reproducción no incluye este registro. Los reportes locales solo
          existen en el dispositivo donde se guardaron.
        </p>
        <p className="mt-4">
          <LinkContexto href="/eventos">Volver a eventos</LinkContexto>
        </p>
      </>
    );
  const acciones = v.base.acciones.filter((a) => a.eventoId === id),
    lecciones = v.base.lecciones.filter((l) => l.eventoIds.includes(id));
  const campos = e.original
    ? Object.entries(e.original).filter(
        ([k]) => !['fuentes', 'lecciones', 'descripcion'].includes(k),
      )
    : Object.entries(e).filter(
        ([k]) => !['original', 'fuentes', 'descripcion', 'leccionIds'].includes(k),
      );
  return (
    <>
      <p className="mb-4">
        <LinkContexto href="/eventos">← Resultados</LinkContexto>
      </p>
      <Titulo
        titulo={e.id}
        subtitulo={`${e.proyectoCodigo} · ${formatoFecha(e.fecha)} · ${e.tipo} · ${e.origen === 'local' ? 'Demo local, sin envío al servidor' : 'Base documental'}`}
      />
      <div className="mb-5 flex flex-wrap gap-2">
        <span className="status-badge">Confianza: {e.confianza ?? 'No consta'}</span>
        <span className="status-badge">Estado de origen: {e.estadoOrigen ?? 'No consta'}</span>
        {e.altoPotencial && (
          <span className="rounded border border-amber-400 bg-amber-50 px-3 py-2 text-sm font-semibold text-slate-900">
            Alto potencial
          </span>
        )}
      </div>
      <Card>
        <CardTitle>Descripción de origen</CardTitle>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{e.descripcion}</p>
        <p className="mt-4 text-xs text-secondary">
          Se conservan las clasificaciones, inferencias y discrepancias del documento original. No
          se presume investigación concluida.
        </p>
      </Card>
      <Card className="mt-6">
        <CardTitle>Ficha completa</CardTitle>
        <dl className="mt-5 grid gap-5 text-sm sm:grid-cols-2">
          {campos.map(([k, x]) => (
            <div key={k} className="min-w-0 border-b border-border pb-3">
              <dt className="font-semibold">{CAMPOS[k as keyof EventoJson] ?? k}</dt>
              <dd className="mt-1 whitespace-pre-wrap break-words leading-relaxed text-secondary">
                {k === 'fecha' ? formatoFecha(x as string | null) : valor(x)}
              </dd>
            </div>
          ))}
        </dl>
      </Card>
      <Card className="mt-6">
        <CardTitle>Ciclo de vida</CardTitle>
        <p className="mt-2 text-sm text-secondary">
          Fecha del hecho: {formatoFecha(e.fecha)}. No equivale a la fecha de reporte o de cierre.
        </p>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {ciclo.map((etapa) => (
            <li className="rounded-md border border-border p-3 text-sm" key={etapa}>
              <p className="font-semibold">{etapa}</p>
              <p className="mt-2 text-xs text-secondary">
                {e.origen === 'local' && etapa === 'Reportado' && e.creadoEn
                  ? `Registro local: ${new Date(e.creadoEn).toLocaleString('es-PE', { timeZone: 'America/Lima' })}`
                  : 'Fecha de transición: No consta'}
              </p>
            </li>
          ))}
        </ol>
        <h3 className="mt-6 text-base font-semibold">Historial local registrado</h3>
        {historial.error ? (
          <p role="status" className="mt-2 text-sm">
            No se pudo leer el historial de este dispositivo: {historial.error.message}
          </p>
        ) : historial.isPending ? (
          <p role="status" className="mt-2 text-sm">
            Consultando historial…
          </p>
        ) : historial.data?.length ? (
          <ol className="mt-3 space-y-3">
            {historial.data.map((h) => (
              <li key={h.id} className="border-l-2 border-brand-accent pl-3 text-sm">
                <p>
                  {new Date(h.fecha).toLocaleString('es-PE', { timeZone: 'America/Lima' })} ·{' '}
                  {h.rol}
                </p>
                <p className="text-secondary">{h.descripcion}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-sm text-secondary">
            No hay transiciones locales registradas. No se inventa un historial retrospectivo.
          </p>
        )}
      </Card>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardTitle>Acciones vinculadas · {acciones.length}</CardTitle>
          {acciones.map((a) => (
            <div key={a.id} className="border-b border-border py-4 text-sm">
              <LinkContexto href={`/acciones?accion=${encodeURIComponent(a.id)}`}>
                {a.id}
              </LinkContexto>
              <p className="my-2">{a.descripcion}</p>
              <span className="status-badge" data-estado={a.estadoVerificado}>
                {a.estadoVerificado}
              </span>
              {a.coberturaParcial && (
                <p className="mt-2 font-medium">
                  Advertencia: evidencia documental de alcance parcial.
                </p>
              )}
            </div>
          ))}
          {!acciones.length && (
            <p className="mt-4 text-sm">Sin acciones registradas. Esto no acredita cierre.</p>
          )}
        </Card>
        <Card>
          <CardTitle>Lecciones vinculadas · {lecciones.length}</CardTitle>
          {lecciones.map((l) => (
            <div key={l.id} className="border-b border-border py-4 text-sm">
              <LinkContexto href={`/lecciones?leccion=${encodeURIComponent(l.id)}`}>
                {l.id} · {l.riesgoCritico}
              </LinkContexto>
              <p className="mt-2">{l.leccion}</p>
            </div>
          ))}
          {!lecciones.length && <p className="mt-4 text-sm">Sin lecciones vinculadas.</p>}
        </Card>
      </div>
      <Card className="mt-6">
        <CardTitle>Fuentes documentales</CardTitle>
        <div className="mt-4">
          <SourceChips referencias={e.fuentes} documentos={v.base.documentosFuente} />
        </div>
        <p className="mt-4 text-xs text-secondary">
          Los códigos identifican documentos; no abren archivos inexistentes. Se conserva su
          ubicación de origen.
        </p>
      </Card>
    </>
  );
}
