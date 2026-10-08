'use client';
import Fuse from 'fuse.js';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useVista } from '@/lib/hooks/use-base';
import { textoLeccion, JERARQUIA_LECCION } from '@/lib/domain/lecciones';
import { textoBusqueda } from '@/lib/domain/filtros';
import { eventHref } from '@/lib/domain/analitica';
import { formatoFecha } from '@/lib/domain/fechas';
import { FiltrosPanel } from '@/components/shell/filtros-panel';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SourceChips } from '@/components/events/source-chips';
import { Titulo, EstadoConsulta, LinkContexto } from './shared';
const VACIAS: NonNullable<ReturnType<typeof useVista>['seleccion']>['lecciones'] = [];
export function Lecciones() {
  const v = useVista();
  const [q, setQ] = useState(''),
    [riesgo, setRiesgo] = useState(''),
    [actividad, setActividad] = useState(''),
    [proyecto, setProyecto] = useState(''),
    [ficha, setFicha] = useState(''),
    [error, setError] = useState(''),
    [generando, setGenerando] = useState('');
  const lecciones = v.seleccion?.lecciones ?? VACIAS;
  const index = useMemo(
    () =>
      new Fuse(
        lecciones.map((l) => ({ id: l.id, texto: textoLeccion(l), leccion: l })),
        { keys: ['texto'], threshold: 0.27, ignoreLocation: true },
      ),
    [lecciones],
  );
  const resultados = useMemo(
    () =>
      (q.trim() ? index.search(textoBusqueda(q)).map((r) => r.item.leccion) : lecciones).filter(
        (l) =>
          (!riesgo || l.riesgoCritico === riesgo) &&
          (!actividad || l.actividadCritica === actividad) &&
          (!proyecto || l.proyectoCodigos.includes(proyecto)) &&
          (!ficha || l.id === ficha),
      ),
    [q, index, lecciones, riesgo, actividad, proyecto, ficha],
  );
  useEffect(() => {
    const cargar = () => setFicha(new URLSearchParams(window.location.search).get('leccion') ?? '');
    const raf = requestAnimationFrame(cargar);
    window.addEventListener('popstate', cargar);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('popstate', cargar);
    };
  }, []);
  if (!v.base || !v.seleccion)
    return (
      <EstadoConsulta
        loading={v.isPending}
        error={v.error}
        retry={() => {
          void v.refetch();
        }}
      />
    );
  const base = v.base;
  const difundir = async (id: string) => {
    const l = lecciones.find((x) => x.id === id);
    if (!l) return;
    try {
      setError('');
      setGenerando(id);
      const { generarFichaDifusion } = await import('@/lib/client/ficha-difusion');
      await generarFichaDifusion(l, formatoFecha(base.meta.fecha_corte_estados));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear la ficha');
    } finally {
      setGenerando('');
    }
  };
  const limpiarBiblioteca = () => {
    setQ('');
    setRiesgo('');
    setActividad('');
    setProyecto('');
    setFicha('');
    const url = new URL(window.location.href);
    url.searchParams.delete('leccion');
    window.history.replaceState(window.history.state, '', url);
  };
  return (
    <>
      <Titulo
        titulo="Lecciones aprendidas"
        subtitulo={`${resultados.length} de ${lecciones.length} lecciones en el contexto. Catalogadas: no se infiere publicación formal ni eficacia de controles.`}
      />
      <FiltrosPanel />
      <section
        aria-label="Buscar en la biblioteca"
        className="mb-6 grid min-w-0 gap-4 rounded-lg border border-border bg-card p-5 sm:grid-cols-2 xl:grid-cols-4"
      >
        <label className="grid min-w-0 gap-2 text-sm sm:col-span-2">
          Búsqueda de texto completo
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Voladura, malla, equipos móviles…"
          />
        </label>
        <label className="grid min-w-0 gap-2 text-sm">
          Riesgo de la lección
          <select
            className="w-full min-w-0"
            value={riesgo}
            onChange={(e) => setRiesgo(e.target.value)}
          >
            <option value="">Todos</option>
            {[...new Set(lecciones.map((l) => l.riesgoCritico))].sort().map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="grid min-w-0 gap-2 text-sm">
          Actividad crítica
          <select
            className="w-full min-w-0"
            value={actividad}
            onChange={(e) => setActividad(e.target.value)}
          >
            <option value="">Todas</option>
            {[...new Set(lecciones.map((l) => l.actividadCritica))].sort().map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="grid min-w-0 gap-2 text-sm">
          Proyecto de origen
          <select
            className="w-full min-w-0"
            value={proyecto}
            onChange={(e) => setProyecto(e.target.value)}
          >
            <option value="">Todos</option>
            {base.proyectos.map((p) => (
              <option key={p.codigo} value={p.codigo}>
                {p.nombre}
              </option>
            ))}
          </select>
        </label>
        <Button variant="outline" onClick={limpiarBiblioteca}>
          Limpiar biblioteca
        </Button>
        {ficha && <p className="text-sm">Ficha seleccionada: {ficha}</p>}
      </section>
      {error && (
        <p role="alert" className="mb-4 rounded border border-red-500 p-3">
          {error}
        </p>
      )}
      <div className="grid items-start gap-5 xl:grid-cols-2">
        {resultados.map((l) => (
          <Card key={l.id} className="min-w-0">
            <p className="mb-2 text-xs font-semibold text-secondary">
              {l.id} · {l.proyectoCodigos.join(', ')} · Catalogada
            </p>
            <CardTitle>{l.riesgoCritico}</CardTitle>
            <p className="mt-3 text-sm leading-relaxed">
              <strong>Qué pasó:</strong> {l.quePaso}
            </p>
            <p className="mt-3 text-sm leading-relaxed">
              <strong>Por qué:</strong> {l.porQue}
            </p>
            <p className="mt-3 text-sm leading-relaxed">
              <strong>Lección:</strong> {l.leccion}
            </p>
            <div className="mt-6">
              <h3 className="mb-3 text-sm font-semibold">Jerarquía de controles</h3>
              <ol className="control-pyramid">
                {JERARQUIA_LECCION.map(([key, label], i) => (
                  <li key={key} style={{ '--nivel': i } as CSSProperties}>
                    <h4>{label}</h4>
                    <p>{l.controles[key] ?? 'No consta'}</p>
                  </li>
                ))}
              </ol>
            </div>
            <p className="mt-4 text-sm">
              <strong>Actividad:</strong> {l.actividadCritica}
            </p>
            <p className="mt-3 text-sm">
              <strong>Aplicabilidad:</strong> {l.aplicabilidad}
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              {l.eventoIds.map((id) => (
                <LinkContexto key={id} href={eventHref(id)}>
                  {id}
                </LinkContexto>
              ))}
            </div>
            <div className="mt-4">
              <SourceChips referencias={l.fuentes} documentos={base.documentosFuente} />
            </div>
            <Button
              className="mt-5 w-full"
              disabled={!!generando}
              onClick={() => {
                void difundir(l.id);
              }}
            >
              {generando === l.id ? 'Generando ficha…' : 'Generar ficha de difusión'}
            </Button>
            <p className="mt-2 text-xs text-secondary">
              PNG generado en este navegador. No se transmite información ni se acredita
              capacitación.
            </p>
          </Card>
        ))}
      </div>
      {!resultados.length && (
        <p role="status" className="rounded border border-border p-6">
          No hay lecciones con estos criterios. Pruebe otros términos o limpie los filtros.
        </p>
      )}
    </>
  );
}
