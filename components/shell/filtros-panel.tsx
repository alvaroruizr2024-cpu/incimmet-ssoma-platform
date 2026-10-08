'use client';
import type {
  Filtros,
  GrupoEvento,
  EmpresaTipoJson,
  EstadoVerificado,
  JerarquiaControl,
} from '@/lib/types';
import { useFiltros } from '@/components/providers';
import { useBase } from '@/lib/hooks/use-base';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FiltroChips } from './filtro-chips';
import { Label } from '@/components/ui/label';
type Valor = string | number | null;
function Selector({
  titulo,
  valor = [],
  opciones,
  cambiar,
}: {
  titulo: string;
  valor?: readonly Valor[];
  opciones: { valor: Valor; texto: string }[];
  cambiar: (v: Valor[]) => void;
}) {
  return (
    <label className="grid min-w-0 gap-1 text-xs font-medium">
      {titulo}
      <select
        multiple
        aria-label={titulo}
        value={valor.map((v) => JSON.stringify(v))}
        className="min-h-24 w-full min-w-0"
        onChange={(e) =>
          cambiar([...e.target.selectedOptions].map((o) => JSON.parse(o.value) as Valor))
        }
      >
        {opciones.map((o) => (
          <option key={JSON.stringify(o.valor)} value={JSON.stringify(o.valor)}>
            {o.texto}
          </option>
        ))}
      </select>
    </label>
  );
}
export function FiltrosPanel() {
  const query = useBase('base');
  const cambios = useBase('base+local');
  const filtros = useFiltros((s) => s.filtros);
  const actualizar = useFiltros((s) => s.actualizar);
  const limpiar = useFiltros((s) => s.limpiar);
  const b = cambios.data ?? query.data;
  if (!b) return null;
  const textos = (valores: readonly (string | null | undefined)[]) =>
    [...new Set(valores.map((v) => v ?? null))]
      .sort((a, b) => String(a).localeCompare(String(b), 'es'))
      .map((v) => ({ valor: v, texto: v ?? 'No consta' }));
  const opcionesTexto = (
    clave: 'clientes' | 'riesgos' | 'actividades' | 'equipos' | 'empresas',
  ) => {
    const campo = {
      clientes: 'cliente',
      riesgos: 'riesgoCritico',
      actividades: 'actividad',
      equipos: 'equipo',
      empresas: 'empresaTipo',
    } as const;
    return textos(b.eventos.map((e) => e[campo[clave]]));
  };
  return (
    <section
      aria-label="Filtros cruzados"
      className="mb-6 rounded-lg border border-border bg-card p-4"
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[180px] flex-1">
          <Label htmlFor="buscar-eventos">Buscar en eventos</Label>
          <Input
            id="buscar-eventos"
            placeholder="Código, descripción, equipo…"
            maxLength={200}
            value={filtros.busqueda ?? ''}
            onChange={(e) => actualizar({ busqueda: e.target.value || undefined }, 'replace')}
          />
        </div>
        <label className="grid min-w-0 gap-1 text-xs font-medium">
          Contexto de datos
          <select
            className="w-full min-w-0"
            value={filtros.contexto ?? 'base'}
            onChange={(e) => actualizar({ contexto: e.target.value as Filtros['contexto'] })}
          >
            <option value="base">Base documental</option>
            <option value="base+local">Base + cambios locales</option>
            <option value="reproduccion">Reproducción histórica 2026</option>
          </select>
        </label>
        <Button variant="outline" onClick={limpiar}>
          Limpiar filtros
        </Button>
      </div>
      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-semibold">
          Filtrar por período, proyecto, evento y acciones
        </summary>
        <p className="mt-2 text-xs text-secondary">
          Dentro de una dimensión: O. Entre dimensiones: Y. Selección múltiple; use Ctrl/Cmd en
          escritorio. Año y mes corresponden al evento de origen.
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Selector
            titulo="Años"
            valor={filtros.anios}
            opciones={[...new Set(b.eventos.map((e) => e.anio))]
              .sort((a, c) => c - a)
              .map((v) => ({ valor: v, texto: String(v) }))}
            cambiar={(v) => actualizar({ anios: v as number[] })}
          />
          <Selector
            titulo="Meses"
            valor={filtros.meses}
            opciones={[
              ...Array.from({ length: 12 }, (_, i) => ({
                valor: (i + 1) as Valor,
                texto: String(i + 1).padStart(2, '0'),
              })),
              { valor: null, texto: 'Mes no consta' },
            ]}
            cambiar={(v) => actualizar({ meses: v as (number | null)[] })}
          />
          <Selector
            titulo="Proyectos"
            valor={filtros.proyectos}
            opciones={b.proyectos.map((p) => ({ valor: p.codigo, texto: p.nombre }))}
            cambiar={(v) => actualizar({ proyectos: v as string[] })}
          />
          <Selector
            titulo="Grupos"
            valor={filtros.grupos}
            opciones={textos(b.catalogos.grupos_tipo)}
            cambiar={(v) => actualizar({ grupos: v as GrupoEvento[] })}
          />
          <Selector
            titulo="Tipos"
            valor={filtros.tipos}
            opciones={textos(b.catalogos.tipos_evento)}
            cambiar={(v) => actualizar({ tipos: v as string[] })}
          />
          <Selector
            titulo="Cliente según evento"
            valor={filtros.clientes}
            opciones={opcionesTexto('clientes')}
            cambiar={(v) => actualizar({ clientes: v as string[] })}
          />
          <Selector
            titulo="Riesgo crítico"
            valor={filtros.riesgos}
            opciones={opcionesTexto('riesgos')}
            cambiar={(v) => actualizar({ riesgos: v as (string | null)[] })}
          />
          <Selector
            titulo="Actividad del evento"
            valor={filtros.actividades}
            opciones={opcionesTexto('actividades')}
            cambiar={(v) => actualizar({ actividades: v as (string | null)[] })}
          />
          <Selector
            titulo="Equipo"
            valor={filtros.equipos}
            opciones={opcionesTexto('equipos')}
            cambiar={(v) => actualizar({ equipos: v as (string | null)[] })}
          />
          <Selector
            titulo="Nivel INCIMMET"
            valor={filtros.niveles}
            opciones={textos(b.eventos.map((e) => e.nivelIncimmet))}
            cambiar={(v) => actualizar({ niveles: v as (string | null)[] })}
          />
          <Selector
            titulo="Potencial INCIMMET"
            valor={filtros.potenciales}
            opciones={textos(b.eventos.map((e) => e.pgIncimmet))}
            cambiar={(v) => actualizar({ potenciales: v as (string | null)[] })}
          />
          <Selector
            titulo="Evento de origen"
            valor={filtros.eventoIds}
            opciones={b.eventos.map((e) => ({
              valor: e.id,
              texto: `${e.id} · ${e.proyectoCodigo}`,
            }))}
            cambiar={(v) => actualizar({ eventoIds: v as string[] })}
          />
          <Selector
            titulo="Jerarquía de control"
            valor={filtros.jerarquias}
            opciones={b.catalogos.jerarquia_control.map((v) => ({ valor: v, texto: v }))}
            cambiar={(v) => actualizar({ jerarquias: v as JerarquiaControl[] })}
          />
          <Selector
            titulo="Rol responsable de acción"
            valor={filtros.responsables}
            opciones={textos(b.acciones.map((a) => a.responsableRol))}
            cambiar={(v) => actualizar({ responsables: v as (string | null)[] })}
          />
          <Selector
            titulo="Empresa"
            valor={filtros.empresas}
            opciones={opcionesTexto('empresas')}
            cambiar={(v) => actualizar({ empresas: v as EmpresaTipoJson[] })}
          />
          <Selector
            titulo="Estado de acciones"
            valor={filtros.estadosAccion}
            opciones={textos(b.catalogos.estados_verificados)}
            cambiar={(v) => actualizar({ estadosAccion: v as EstadoVerificado[] })}
          />
          <label className="grid content-start gap-1 text-xs font-medium">
            Alto potencial
            <select
              className="w-full min-w-0"
              value={filtros.altoPotencial === undefined ? 'todos' : String(filtros.altoPotencial)}
              onChange={(e) =>
                actualizar({
                  altoPotencial:
                    e.target.value === 'todos'
                      ? undefined
                      : e.target.value === 'null'
                        ? null
                        : e.target.value === 'true',
                })
              }
            >
              <option value="todos">Todos</option>
              <option value="true">Marcado Sí</option>
              <option value="false">Bandera false (no acredita potencial bajo)</option>
              <option value="null">Por confirmar — reportes locales</option>
            </select>
          </label>
        </div>
      </details>
      <FiltroChips />
    </section>
  );
}
