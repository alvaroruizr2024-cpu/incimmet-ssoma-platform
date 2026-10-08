import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Seguimiento de acciones' };
import { Acciones } from '@/components/screens/acciones';
export default function Page() {
  return <Acciones />;
}
