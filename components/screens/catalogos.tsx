'use client';
import { useBase } from '@/lib/hooks/use-base';
import { Titulo, EstadoConsulta, Tabla } from './shared';
export function Catalogos() {
  const q = useBase();
  if (!q.data)
    return (
      <EstadoConsulta
        loading={q.isPending}
        error={q.error}
        retry={() => {
          void q.refetch();
        }}
      />
    );
  return (
    <>
      <Titulo
        titulo="Catálogos de la demo"
        subtitulo="Lectura del archivo original. Riesgos, actividades y responsables observados no equivalen a catálogos corporativos aprobados."
      />
      <Tabla titulo="Proyectos y metas TRIFR">
        <thead>
          <tr>
            <th>Código</th>
            <th>Proyecto</th>
            <th>Cliente</th>
            <th>Meta TRIFR 2026</th>
          </tr>
        </thead>
        <tbody>
          {q.data.proyectos.map((p) => (
            <tr key={p.codigo}>
              <td>{p.codigo}</td>
              <td>{p.nombre}</td>
              <td>{p.cliente}</td>
              <td>{p.meta_trifr_2026 ?? 'No consta'}</td>
            </tr>
          ))}
        </tbody>
      </Tabla>
      <h2 className="mt-6 text-lg font-semibold">Tipos de evento</h2>
      <p className="mt-3 text-sm leading-7">{q.data.catalogos.tipos_evento.join(' · ')}</p>
    </>
  );
}
