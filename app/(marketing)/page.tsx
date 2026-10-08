import type { Metadata } from 'next';
import { cargarPresentacion } from '@/lib/data/presentacion.server';
import { CinematicExperience } from '@/components/marketing/cinematic-experience';
import { Story } from '@/components/marketing/story';

export const metadata: Metadata = {
  title: 'Del reporte a la evidencia · Gestión SSOMA',
  description:
    'Presentación documental INCIMMET: proyectos, indicadores oficiales y trazabilidad de acciones.',
};
export const dynamic = 'force-static';
export const runtime = 'nodejs';

export default async function Presentacion() {
  const data = await cargarPresentacion();
  return (
    <CinematicExperience data={data}>
      <Story data={data} />
    </CinematicExperience>
  );
}
