'use client';
import { useMemo, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useVista } from '@/lib/hooks/use-base';
import type { EventoLectura } from '@/lib/types';
import { formatoFecha } from '@/lib/domain/fechas';
import { eventHref } from '@/lib/domain/analitica';
import { descargarCSV } from '@/lib/client/descargas';
import { useFiltros } from '@/components/providers';
import { FiltrosPanel } from '@/components/shell/filtros-panel';
import { Button } from '@/components/ui/button';
import { Titulo, EstadoConsulta, Tabla, LinkContexto } from './shared';
const VACIO: EventoLectura[] = [];
export function Eventos() {
  'use no memo'; // TanStack Table usa un objeto mutable; React Compiler no debe memoizar este adaptador.
  const v = useVista(),
    actualizar = useFiltros((s) => s.actualizar);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'fecha', desc: true }]);
  const columnas = useMemo<ColumnDef<EventoLectura>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'Evento',
        cell: ({ row }) => (
          <LinkContexto href={eventHref(row.original.id)}>{row.original.id}</LinkContexto>
        ),
      },
      {
        accessorKey: 'fecha',
        header: 'Fecha',
        cell: ({ row }) => (
          <span className="whitespace-nowrap">{formatoFecha(row.original.fecha)}</span>
        ),
        sortUndefined: 'last',
      },
      { accessorKey: 'proyectoCodigo', header: 'Proyecto' },
      { accessorKey: 'tipo', header: 'Tipo' },
      {
        accessorKey: 'nivelIncimmet',
        header: 'Nivel INCIMMET',
        cell: ({ row }) => row.original.nivelIncimmet ?? 'No consta',
      },
      {
        accessorKey: 'altoPotencial',
        header: 'Alto potencial',
        cell: ({ row }) =>
          row.original.altoPotencial === true
            ? 'Sí, marcado'
            : row.original.altoPotencial === null
              ? 'Por confirmar'
              : 'No marcado',
      },
      {
        accessorKey: 'confianza',
        header: 'Confianza',
        cell: ({ row }) => row.original.confianza ?? 'No consta',
      },
    ],
    [],
  );
  const table = useReactTable({
    data: v.seleccion?.eventos ?? VACIO,
    columns: columnas,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
    autoResetPageIndex: true,
  });
  if (!v.seleccion || !v.base)
    return (
      <EstadoConsulta
        loading={v.isPending}
        error={v.error}
        retry={() => {
          void v.refetch();
        }}
      />
    );
  const exportar = () => {
    const rows = table.getSortedRowModel().rows.map((x) => x.original);
    descargarCSV(
      'Eventos SSOMA filtrados',
      [
        'ID',
        'Fecha',
        'Hora',
        'Proyecto',
        'Cliente',
        'Grupo',
        'Tipo',
        'Nivel INCIMMET',
        'Potencial INCIMMET',
        'HPRI',
        'Riesgo',
        'Labor',
        'Actividad',
        'Equipo',
        'Descripción',
        'Días perdidos',
        'Estado origen',
        'Confianza',
        'Fuentes',
      ],
      rows.map((e) => [
        e.id,
        e.fecha,
        e.hora,
        e.proyectoCodigo,
        e.cliente,
        e.tipoGrupo,
        e.tipo,
        e.nivelIncimmet,
        e.pgIncimmet,
        e.altoPotencial,
        e.riesgoCritico,
        e.area,
        e.actividad,
        e.equipo,
        e.descripcion,
        e.diasPerdidos,
        e.estadoOrigen,
        e.confianza,
        e.fuentes,
      ]),
      [
        'Conteos del detalle; no son indicadores oficiales.',
        `Corte documental: ${v.base?.meta.fecha_corte_estados}`,
        `Filtros: ${JSON.stringify(v.filtros)}`,
      ],
    );
  };
  return (
    <>
      <Titulo
        titulo="Eventos"
        subtitulo={`${v.seleccion.eventos.length} registros de la selección. El orden y la exportación incluyen todo el resultado filtrado, no solo la página visible.`}
      />
      <FiltrosPanel />
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <label className="grid min-w-0 flex-1 gap-2 text-sm">
          Buscar en eventos
          <input
            type="search"
            className="min-w-0"
            value={v.filtros.busqueda ?? ''}
            onChange={(e) => actualizar({ busqueda: e.target.value || undefined }, 'replace')}
            placeholder="Código, descripción, actividad…"
          />
        </label>
        <Button onClick={exportar}>Exportar eventos CSV</Button>
      </div>
      <Tabla titulo="Eventos documentados">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th
                  key={h.id}
                  aria-sort={
                    h.column.getIsSorted() === 'asc'
                      ? 'ascending'
                      : h.column.getIsSorted() === 'desc'
                        ? 'descending'
                        : 'none'
                  }
                >
                  <button
                    type="button"
                    className="min-h-11 text-left"
                    onClick={h.column.getToggleSortingHandler()}
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}{' '}
                    {h.column.getIsSorted() === 'asc'
                      ? '↑'
                      : h.column.getIsSorted() === 'desc'
                        ? '↓'
                        : '↕'}
                  </button>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </Tabla>
      {!v.seleccion.eventos.length && (
        <p className="mt-4" role="status">
          Sin registros para esta selección. Pruebe limpiar los filtros.
        </p>
      )}
      <nav aria-label="Paginación de eventos" className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.firstPage()}
        >
          Primera
        </Button>
        <Button
          variant="outline"
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
        >
          Anterior
        </Button>
        <span className="px-2 text-sm" role="status">
          Página {table.getState().pagination.pageIndex + 1} de {Math.max(1, table.getPageCount())}
        </span>
        <Button
          variant="outline"
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
        >
          Siguiente
        </Button>
        <Button
          variant="outline"
          disabled={!table.getCanNextPage()}
          onClick={() => table.lastPage()}
        >
          Última
        </Button>
        <label className="ml-auto flex items-center gap-2 text-sm">
          Filas
          <select
            className="w-full min-w-0"
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </nav>
    </>
  );
}
