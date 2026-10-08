import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Registro de eventos' };
import { Eventos } from '@/components/screens/eventos';
export default function Page() {
  return <Eventos />;
}
