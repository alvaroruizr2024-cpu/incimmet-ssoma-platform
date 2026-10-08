'use client';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart, HeatmapChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  VisualMapComponent,
  DataZoomComponent,
  MarkLineComponent,
  MarkAreaComponent,
  AriaComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsType } from 'echarts/core';
import type { Filtros } from '@/lib/types';
import type { ModeloGrafico } from '@/lib/analytics/modelos';
import { opcionesGrafico } from '@/lib/analytics/echarts-options';
import { useReducedMotion } from '@/components/marketing/browser-state';
echarts.use([
  BarChart,
  LineChart,
  PieChart,
  HeatmapChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  VisualMapComponent,
  DataZoomComponent,
  MarkLineComponent,
  MarkAreaComponent,
  AriaComponent,
  CanvasRenderer,
]);
const subscribeMobile = (cb: () => void) => {
  const q = matchMedia('(max-width:767px)');
  q.addEventListener('change', cb);
  return () => q.removeEventListener('change', cb);
};
const isMobile = () => matchMedia('(max-width:767px)').matches;
export default function EChartView({
  modelo,
  onSelect,
  onReady,
  patterns = false,
}: {
  modelo: ModeloGrafico;
  patterns?: boolean;
  onSelect: (filtros: Partial<Filtros>) => void;
  onReady: (chart: EChartsType | null) => void;
}) {
  const host = useRef<HTMLDivElement>(null),
    chart = useRef<EChartsType | null>(null);
  const { resolvedTheme } = useTheme();
  const reduced = useReducedMotion();
  const mobile = useSyncExternalStore(subscribeMobile, isMobile, () => false);
  const seleccionar = useRef(onSelect);
  useEffect(() => {
    seleccionar.current = onSelect;
  }, [onSelect]);
  useEffect(() => {
    if (!host.current) return;
    const instance = echarts.init(host.current, undefined, { renderer: 'canvas' });
    chart.current = instance;
    instance.on('click', (event: unknown) => {
      const payload = event as { data?: { filtros?: Partial<Filtros> } };
      if (payload.data?.filtros) seleccionar.current(payload.data.filtros);
    });
    const resize = new ResizeObserver(() => instance.resize());
    resize.observe(host.current);
    onReady(instance);
    return () => {
      resize.disconnect();
      onReady(null);
      instance.dispose();
      chart.current = null;
    };
  }, [onReady]);
  useEffect(() => {
    chart.current?.setOption(
      opcionesGrafico(modelo, resolvedTheme === 'dark', reduced, mobile, patterns),
      {
        notMerge: true,
        lazyUpdate: true,
      },
    );
  }, [modelo, resolvedTheme, reduced, mobile, patterns]);
  return (
    <div
      ref={host}
      className="w-full min-w-0"
      style={{ height: modelo.alto ?? 340 }}
      aria-label={modelo.titulo}
      role="img"
    />
  );
}
