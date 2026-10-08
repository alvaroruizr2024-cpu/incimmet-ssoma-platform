import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Catálogos' };
import { Catalogos } from '@/components/screens/catalogos';
export default function Page() {
  return <Catalogos />;
}
