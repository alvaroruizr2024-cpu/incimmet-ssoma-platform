import { Activity, Gauge, Scale, type LucideIcon } from 'lucide-react';
import type { Indicadores } from '@/lib/types';
import { indicadoresOficiales } from '@/lib/domain/indicadores';
import { INDICADOR_NARRATIVO, formatoNarrativo } from '@/lib/domain/presentacion';

interface TarjetaIndice {
  id: 'if' | 'is' | 'ia';
  sigla: string;
  titulo: string;
  decimales: number;
  icono: LucideIcon;
}
const TARJETAS: readonly TarjetaIndice[] = [
  { id: 'if', sigla: 'IF', titulo: 'Índice de frecuencia', decimales: 2, icono: Activity },
  { id: 'is', sigla: 'IS', titulo: 'Índice de severidad', decimales: 2, icono: Gauge },
  { id: 'ia', sigla: 'IA', titulo: 'Índice de accidentabilidad', decimales: 3, icono: Scale },
];

/**
 * Banda de índices oficiales al estilo de los tableros EHS líderes (tasas tipo TRIFR primero):
 * los valores vienen del documento fuente, nunca recalculados sobre el detalle documental.
 */
export function IndicadoresStrip({ indicadores }: { indicadores: Indicadores }) {
  const oficiales = indicadoresOficiales(
    indicadores,
    INDICADOR_NARRATIVO.anio,
    INDICADOR_NARRATIVO.ambito,
  );
  // Una versión ambigua nunca se elige en silencio: se avisa y no se muestran cifras.
  const oficial = oficiales.length === 1 ? oficiales[0] : undefined;
  return (
    <section aria-label="Índices oficiales" className="rates-strip">
      <div className="rates-head">
        <h2>
          Índices oficiales · {INDICADOR_NARRATIVO.anio} ·{' '}
          {oficial?.ambito_nombre ?? INDICADOR_NARRATIVO.ambito}
        </h2>
        <p>{oficial?.fuente ?? 'Fuente no consta'}</p>
      </div>
      {oficial ? (
        <div className="rates-grid">
          {TARJETAS.map(({ id, sigla, titulo, decimales, icono: Icono }) => (
            <article key={id} className="rate-card" data-rate={id}>
              <header>
                <Icono size={16} aria-hidden="true" />
                <span>{titulo}</span>
              </header>
              <p className="rate-value" data-testid={`rate-${id}`}>
                {formatoNarrativo(oficial[id], decimales)}
              </p>
              <p className="rate-sigla">{sigla} · por millón HHT según fuente</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="rates-note" role="status">
          {oficiales.length > 1
            ? 'Existe más de una versión oficial para este año y ámbito; se requiere selección explícita en Análisis.'
            : 'Sin versión oficial para este año y ámbito en la base importada.'}
        </p>
      )}
      <p className="rates-note">
        Cifras oficiales del corte importado; no recalculadas sobre el detalle documental, que es
        incompleto.
      </p>
    </section>
  );
}
