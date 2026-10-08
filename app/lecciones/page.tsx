import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Lecciones aprendidas' };
import { Lecciones } from '@/components/screens/lecciones';
export default function Page() {
  return <Lecciones />;
}
