import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cargarDocumento } from '@/lib/data/documental.server';
import { EventoDetalle } from '@/components/screens/evento-detalle';
export const dynamicParams = false;
export async function generateStaticParams() {
  return (await cargarDocumento()).eventos.map(({ id }) => ({ id }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const evento = (await cargarDocumento()).eventos.find((e) => e.id === id);
  return { title: evento ? `${evento.id} · ${evento.proyecto}` : 'Evento no encontrado' };
}
export default async function FichaEvento({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await cargarDocumento()).eventos.some((e) => e.id === id)) notFound();
  return <EventoDetalle id={id} />;
}
