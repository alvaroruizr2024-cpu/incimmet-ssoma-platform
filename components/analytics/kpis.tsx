import {
  AlarmClock,
  BadgeCheck,
  CalendarClock,
  ClipboardList,
  Flame,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { resumenKPIs } from '@/lib/domain/analitica';
import type { AccionLectura, EventoLectura } from '@/lib/types';
import { Card } from '@/components/ui/card';

interface ItemKpi {
  id: string;
  titulo: string;
  valor: ReactNode;
  nota: string;
  icono: LucideIcon;
  extra?: ReactNode;
}

function Tarjeta({ item }: { item: ItemKpi }) {
  const Icono = item.icono;
  return (
    <Card data-kpi={item.id} className="kpi-card min-w-0 border-t-4 border-t-brand-blue p-5">
      <header className="kpi-head">
        <h2 className="text-sm font-medium text-secondary">{item.titulo}</h2>
        <Icono size={20} aria-hidden="true" className="kpi-icon" />
      </header>
      <p
        data-testid={`kpi-${item.id}`}
        className="mt-3 break-words text-3xl font-bold leading-tight tabular-nums"
      >
        {item.valor}
      </p>
      {item.extra}
      <p className="mt-3 text-xs leading-relaxed text-secondary">{item.nota}</p>
    </Card>
  );
}

export function Kpis({
  eventos,
  acciones,
}: {
  eventos: readonly EventoLectura[];
  acciones: readonly AccionLectura[];
}) {
  const r = resumenKPIs(eventos, acciones);
  const c = r.cumplimiento;
  const vencidas = c.estados.Vencida;
  const resultado: ItemKpi[] = [
    {
      id: 'eventos',
      titulo: 'Eventos documentados',
      valor: r.eventos,
      nota: 'Registros únicos del contexto seleccionado.',
      icono: ClipboardList,
    },
    {
      id: 'accidentes',
      titulo: 'Accidentes a personas',
      valor: r.accidentes,
      nota: 'El gráfico por nivel incluye «No consta».',
      icono: TriangleAlert,
    },
    {
      id: 'hpri',
      titulo: 'Alto potencial · HPRI',
      valor: r.hpri,
      nota: `Bandera del detalle; ${r.potencialDesconocido} por confirmar.`,
      icono: Flame,
    },
    {
      id: 'dias',
      titulo: 'Días perdidos consignados',
      valor: r.diasPerdidos.valor ?? 'No consta',
      nota: `${r.diasPerdidos.conDato}/${r.eventos} con dato. Detalle incompleto, no oficial.`,
      icono: CalendarClock,
    },
  ];
  const gestion: ItemKpi[] = [
    {
      id: 'cierre',
      titulo: 'Cierre verificado',
      valor: c.porcentajeCierre === null ? 'No calculable' : `${c.porcentajeCierre.toFixed(1)}%`,
      nota: `${c.cerradas}/${c.total} acciones; ${c.cierresImportadosParciales} cierres importados parciales. Cohorte antes del filtro de estado.`,
      icono: BadgeCheck,
      extra: (
        <div
          className="kpi-meter"
          aria-hidden="true"
          title={
            c.porcentajeCierre === null
              ? 'Cierre no calculable'
              : `${c.porcentajeCierre.toFixed(1)}% con cierre verificado`
          }
        >
          <span style={{ width: `${Math.min(100, Math.max(0, c.porcentajeCierre ?? 0))}%` }} />
        </div>
      ),
    },
    {
      id: 'vencidas',
      titulo: 'Acciones vencidas',
      valor: vencidas,
      nota: 'Según corte documental o evaluación local, según el contexto.',
      icono: AlarmClock,
      extra: (
        <p className="kpi-status" data-tono={vencidas > 0 ? 'alerta' : 'ok'}>
          <span className="kpi-status-dot" aria-hidden="true" />
          {vencidas > 0 ? 'Requiere atención inmediata' : 'Sin vencidas en la selección'}
        </p>
      ),
    },
  ];
  return (
    <div className="kpi-groups mb-7">
      <section aria-label="Indicadores de resultado" className="kpi-group">
        <h2 className="kpi-group-title">Resultado · lo que ocurrió</h2>
        <div className="kpi-grid grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {resultado.map((item) => (
            <Tarjeta key={item.id} item={item} />
          ))}
        </div>
      </section>
      <section aria-label="Indicadores de gestión" className="kpi-group">
        <h2 className="kpi-group-title">Gestión · lo que hacemos con lo ocurrido</h2>
        <div className="kpi-grid grid min-w-0 gap-4 sm:grid-cols-2">
          {gestion.map((item) => (
            <Tarjeta key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
