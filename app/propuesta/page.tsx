import type { Metadata } from 'next';
import { cargarPresentacion } from '@/lib/data/presentacion.server';
import { PropuestaExperience } from '@/components/propuesta/propuesta-experience';
import './propuesta.css';

export const metadata: Metadata = {
  title: 'Propuesta cinematográfica · Gestión SSOMA',
  description:
    'Propuesta cinematográfica e interactiva INCIMMET: recorrido 3D con órbita libre y datos documentales en el espacio.',
};
export const dynamic = 'force-static';
export const runtime = 'nodejs';

export default async function Propuesta() {
  const data = await cargarPresentacion();
  return <PropuestaExperience data={data} />;
}
