import { resumenKPIs } from '@/lib/domain/analitica';
import type { AccionLectura, EventoLectura } from '@/lib/types';
import { Card } from '@/components/ui/card';
export function Kpis({
  eventos,
  acciones,
}: {
  eventos: readonly EventoLectura[];
  acciones: readonly AccionLectura[];
}) {
  const r = resumenKPIs(eventos, acciones);
  const c = r.cumplimiento;
  const items = [
    {
      id: 'eventos',
      titulo: 'Eventos documentados',
      valor: r.eventos,
      nota: 'Registros únicos del contexto seleccionado.',
    },
    {
      id: 'accidentes',
      titulo: 'Accidentes a personas',
      valor: r.accidentes,
      nota: 'El gráfico por nivel incluye «No consta».',
    },
    {
      id: 'hpri',
      titulo: 'Alto potencial · HPRI',
      valor: r.hpri,
      nota: `Bandera del detalle; ${r.potencialDesconocido} por confirmar.`,
    },
    {
      id: 'dias',
      titulo: 'Días perdidos consignados',
      valor: r.diasPerdidos.valor ?? 'No consta',
      nota: `${r.diasPerdidos.conDato}/${r.eventos} con dato. Detalle incompleto, no oficial.`,
    },
    {
      id: 'cierre',
      titulo: 'Cierre verificado',
      valor: c.porcentajeCierre === null ? 'No calculable' : `${c.porcentajeCierre.toFixed(1)}%`,
      nota: `${c.cerradas}/${c.total} acciones; ${c.cierresImportadosParciales} cierres importados parciales. Cohorte antes del filtro de estado.`,
    },
    {
      id: 'vencidas',
      titulo: 'Acciones vencidas',
      valor: c.estados.Vencida,
      nota: 'Según corte documental o evaluación local, según el contexto.',
    },
  ];
  return (
    <section
      aria-label="Indicadores de la selección"
      className="kpi-grid mb-7 grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      {items.map((item) => (
        <Card
          key={item.id}
          data-kpi={item.id}
          className="kpi-card min-w-0 border-t-4 border-t-brand-blue p-5"
        >
          <h2 className="text-sm font-medium text-secondary">{item.titulo}</h2>
          <p
            data-testid={`kpi-${item.id}`}
            className="mt-3 break-words text-3xl font-bold leading-tight tabular-nums"
          >
            {item.valor}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-secondary">{item.nota}</p>
        </Card>
      ))}
    </section>
  );
}
