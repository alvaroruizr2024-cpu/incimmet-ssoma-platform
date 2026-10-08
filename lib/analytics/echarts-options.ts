import type { EChartsOption, SeriesOption } from 'echarts';
import type { ModeloGrafico, PuntoGrafico } from './modelos';
import { COLORES_ESTADO, COLORES_GRUPO } from './modelos';
const colors = ['#0070C0', '#00B0F0', '#94B6D9', '#315F94', '#64748B', '#1D7DCC'];
const etiquetasCortas: Record<string, string> = {
  'Cerrada con evidencia': 'Con evidencia',
  'Declarada cerrada sin evidencia': 'Declarada sin evidencia',
  'Sin información': 'Sin información',
  'Daño a la propiedad': 'Daño material',
  'En investigación': 'En investigación',
};
const corta = (s: string) => etiquetasCortas[s] ?? s;
const color = (name: string, index: number) =>
  COLORES_ESTADO[name] ?? COLORES_GRUPO[name] ?? colors[index % colors.length];
/** All payloads are prepared in the domain. The chart never recomputes official rates. */
export function opcionesGrafico(
  modelo: ModeloGrafico,
  dark = false,
  reduced = false,
  mobile = false,
  patterns = false,
): EChartsOption {
  const foreground = dark ? '#E7E6E6' : '#0F172A';
  const border = dark ? '#475569' : '#E2E8F0';
  const cats = modelo.categorias ?? [...new Set(modelo.puntos.map((p) => p.etiqueta))];
  const seriesNames = [...new Set(modelo.puntos.flatMap((p) => (p.serie ? [p.serie] : [])))];
  const option: EChartsOption = {
    color: colors,
    backgroundColor: 'transparent',
    animation: !reduced,
    animationDuration: 250,
    animationDurationUpdate: reduced ? 0 : 180,
    textStyle: {
      color: foreground,
      fontFamily: 'Inter, system-ui, Arial, sans-serif',
      fontSize: 12,
    },
    aria: {
      enabled: true,
      description: `${modelo.titulo}. ${modelo.descripcion}`,
      decal: { show: patterns },
    },
    tooltip: { trigger: 'item', renderMode: 'richText', confine: true },
    grid: {
      top: modelo.id.startsWith('tendencia') ? 38 : 18,
      left: 12,
      right: 28,
      bottom: seriesNames.length ? (mobile ? 132 : 80) : 38,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: cats,
      axisLabel: {
        color: foreground,
        interval: 0,
        overflow: 'truncate',
        width: 95,
        rotate: cats.length > 6 ? 25 : 0,
      },
      axisLine: { lineStyle: { color: border } },
    },
    yAxis: {
      type: 'value',
      minInterval:
        modelo.procedencia || (modelo.unidad && modelo.unidad !== 'Registros') ? undefined : 1,
      min: 0,
      axisLabel: { color: foreground },
      splitLine: { lineStyle: { color: border } },
    },
  };
  const datum = (p: PuntoGrafico) => ({
    name: p.etiqueta,
    value: p.valor,
    filtros: p.filtros,
    detalle: p.detalle,
  });
  if (modelo.tipo === 'heatmap') {
    option.xAxis = {
      type: 'category',
      data: cats,
      splitArea: { show: true },
      axisLabel: { color: foreground, interval: 0, rotate: cats.length > 8 ? 45 : 0, fontSize: 11 },
    };
    option.yAxis = {
      type: 'category',
      data: modelo.filas,
      splitArea: { show: true },
      axisLabel: { color: foreground },
    };
    option.grid = { left: 85, top: 16, bottom: 95, right: 20, containLabel: true };
    option.visualMap = {
      min: 0,
      max: Math.max(1, ...modelo.puntos.map((p) => p.valor ?? 0)),
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      calculable: true,
      inRange: { color: ['#D5EAF7', '#1D7DCC', '#002060'] },
      textStyle: { color: foreground },
    };
    option.series = [
      {
        type: 'heatmap',
        data: modelo.puntos
          .filter((p) => p.valor !== null)
          .map((p) => ({
            value: [cats.indexOf(p.x ?? ''), (modelo.filas ?? []).indexOf(p.y ?? ''), p.valor ?? 0],
            filtros: p.filtros,
          })),
        label: { show: true, color: '#FFFFFF', textBorderColor: '#002060', textBorderWidth: 2 },
        emphasis: { itemStyle: { borderColor: '#00B0F0', borderWidth: 2 } },
      },
    ];
    return option;
  }
  if (modelo.tipo === 'donut') {
    delete option.xAxis;
    delete option.yAxis;
    option.legend = {
      type: 'plain',
      bottom: 0,
      left: 'center',
      width: '95%',
      formatter: corta,
      itemGap: 12,
      textStyle: { color: foreground, fontSize: 11 },
    };
    option.series = [
      {
        type: 'pie',
        radius: ['30%', '55%'],
        center: ['50%', '37%'],
        avoidLabelOverlap: true,
        label: { show: false },
        emphasis: { label: { show: true, color: foreground } },
        data: modelo.puntos.map((p, i) => ({
          ...datum(p),
          value: p.valor ?? 0,
          itemStyle: { color: color(p.etiqueta, i) },
        })),
      },
    ];
    return option;
  }
  if (modelo.tipo === 'pareto') {
    option.yAxis = [
      {
        type: 'value',
        min: 0,
        minInterval: 1,
        name: 'Registros',
        splitLine: { lineStyle: { color: border } },
      },
      { type: 'value', min: 0, max: 100, name: '% acumulado', splitLine: { show: false } },
    ];
    option.series = [
      {
        type: 'bar',
        name: 'Registros',
        data: modelo.puntos.map(datum),
        itemStyle: { color: '#0070C0' },
      },
      {
        type: 'line',
        name: '% acumulado',
        yAxisIndex: 1,
        symbolSize: 5,
        data: modelo.puntos.map((p) => ({ ...datum(p), value: p.acumulado ?? null })),
        itemStyle: { color: dark ? '#FFFFFF' : '#151F44' },
        markLine: {
          silent: true,
          symbol: 'none',
          data: [{ yAxis: 80, name: '80%' }],
          label: { formatter: '80%' },
          lineStyle: { type: 'dashed', color: '#1D7DCC' },
        },
      },
    ];
  } else if (seriesNames.length) {
    option.legend = {
      type: 'plain',
      bottom: 0,
      left: 'center',
      width: '95%',
      formatter: corta,
      itemGap: 12,
      textStyle: { color: foreground, fontSize: 11 },
    };
    option.series = seriesNames.map((serie, i): SeriesOption => {
      const shared = {
        name: serie,
        itemStyle: { color: color(serie, i) },
        data: cats.map((cat) => {
          const p = modelo.puntos.find((x) => x.etiqueta === cat && x.serie === serie);
          return p ? datum(p) : { name: cat, value: null };
        }),
      };
      return modelo.tipo === 'line'
        ? { ...shared, type: 'line', connectNulls: false, symbolSize: 4 }
        : {
            ...shared,
            type: 'bar',
            stack: modelo.tipo === 'stacked' ? 'total' : undefined,
            barMaxWidth: 50,
          };
    });
  } else {
    const shared = {
      name: modelo.unidad ?? 'Registros',
      data: modelo.puntos.map((p, i) => ({
        ...datum(p),
        itemStyle: { color: color(p.etiqueta, i) },
      })),
      ...(modelo.referencia === undefined
        ? {}
        : {
            markLine: {
              silent: true,
              symbol: 'none',
              data: [{ yAxis: modelo.referencia }],
              label: { formatter: 'Referencia fuente' },
            },
          }),
    };
    option.series =
      modelo.tipo === 'line'
        ? [{ ...shared, type: 'line', connectNulls: false }]
        : [{ ...shared, type: 'bar', barMaxWidth: 60 }];
  }
  if (modelo.horizontal) {
    option.xAxis = {
      type: 'value',
      min: 0,
      minInterval: 1,
      axisLabel: { color: foreground },
      splitLine: { lineStyle: { color: border } },
    };
    option.yAxis = {
      type: 'category',
      inverse: true,
      data: cats,
      axisLabel: {
        color: foreground,
        interval: 0,
        width: mobile ? 125 : 205,
        overflow: 'break',
        fontSize: 11,
      },
      axisLine: { show: false },
      axisTick: { show: false },
    };
    option.grid = { top: 12, left: 8, right: 35, bottom: 18, containLabel: true };
  }
  if (modelo.id.startsWith('tendencia')) {
    const monthly = modelo.id.endsWith('mensual');
    const series = option.series as SeriesOption[];
    if (series[0])
      Object.assign(series[0], {
        markArea: {
          silent: true,
          itemStyle: { color: dark ? 'rgba(29,125,204,.14)' : 'rgba(29,125,204,.07)' },
          label: { show: !mobile, color: foreground, fontSize: 10 },
          data: monthly
            ? [
                [{ name: 'Detalle 2024', xAxis: '2024-01' }, { xAxis: '2024-12' }],
                [{ name: 'Ene–may 2026', xAxis: '2026-01' }, { xAxis: '2026-05' }],
              ]
            : [
                [
                  { name: '2024: mayor cobertura · 2025 incompleto', xAxis: '2024' },
                  { xAxis: '2026' },
                ],
              ],
        },
      });
  }
  if (cats.length > 24 && !modelo.horizontal) {
    const temporal = modelo.id.startsWith('tendencia');
    const window = {
      startValue: temporal ? cats.length - 24 : 0,
      endValue: temporal ? cats.length - 1 : 23,
    };
    option.dataZoom = mobile
      ? [{ type: 'inside', ...window, zoomOnMouseWheel: false }]
      : [
          { type: 'slider', ...window, bottom: seriesNames.length ? 54 : 0, height: 16 },
          { type: 'inside', ...window, zoomOnMouseWheel: false },
        ];
  }
  return option;
}
