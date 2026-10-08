'use client';
import { useFiltros } from '@/components/providers';
import type { Filtros } from '@/lib/types';
const etiquetas: Record<string, string> = {
  anios: 'Año',
  meses: 'Mes',
  proyectos: 'Proyecto',
  clientes: 'Cliente',
  tipos: 'Tipo',
  grupos: 'Grupo',
  riesgos: 'Riesgo',
  actividades: 'Actividad',
  equipos: 'Equipo',
  niveles: 'Nivel',
  potenciales: 'Potencial',
  altoPotencial: 'Alto potencial',
  empresas: 'Empresa',
  eventoIds: 'Eventos seleccionados',
  estadosAccion: 'Estado de acción',
  jerarquias: 'Jerarquía',
  responsables: 'Rol responsable',
  busqueda: 'Búsqueda',
  contexto: 'Contexto',
  desde: 'Desde',
  hasta: 'Hasta',
  compromisoDesde: 'Compromiso desde',
  compromisoHasta: 'Compromiso hasta',
};
export function FiltroChips() {
  const filtros = useFiltros((s) => s.filtros);
  const actualizar = useFiltros((s) => s.actualizar);
  const entradas = Object.entries(filtros).filter(
    ([, v]) => v !== undefined && v !== '' && (!Array.isArray(v) || v.length),
  );
  if (!entradas.length)
    return <p className="mt-3 text-xs text-secondary">Sin filtros: base completa.</p>;
  return (
    <div className="mt-3 flex max-w-full flex-wrap gap-2" aria-label="Filtros activos">
      {entradas.flatMap(([key, value]) => {
        if (key === 'eventoIds' && Array.isArray(value))
          return [
            <button
              type="button"
              className="filter-chip"
              key={key}
              onClick={() => actualizar({ eventoIds: undefined })}
              aria-label="Quitar selección de eventos"
            >
              {value.length} eventos seleccionados <span aria-hidden="true">×</span>
            </button>,
          ];
        const valores: unknown[] = Array.isArray(value) ? value : [value];
        return valores.map((v, i) => {
          const contexto: Record<string, string> = {
            reproduccion: 'Reproducción histórica 2026',
            'base+local': 'Base + cambios locales',
            base: 'Base documental',
          };
          const texto =
            key === 'contexto'
              ? (contexto[String(v)] ?? String(v))
              : v === null
                ? 'No consta'
                : v === true
                  ? 'Sí'
                  : v === false
                    ? 'No marcado'
                    : String(v);
          return (
            <button
              type="button"
              className="filter-chip"
              key={`${key}-${i}`}
              aria-label={`Quitar ${etiquetas[key] ?? key}: ${texto}`}
              onClick={() => {
                const siguiente = Array.isArray(value) ? value.filter((x) => x !== v) : undefined;
                actualizar({
                  [key]: Array.isArray(siguiente) && !siguiente.length ? undefined : siguiente,
                } as Partial<Filtros>);
              }}
            >
              {etiquetas[key] ?? key}:{' '}
              <span className="max-w-64 truncate" title={texto}>
                {texto}
              </span>
              <span aria-hidden="true">×</span>
            </button>
          );
        });
      })}
    </div>
  );
}
