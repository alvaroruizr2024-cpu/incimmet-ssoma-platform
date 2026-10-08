import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Reportes de campo' };
import { Campo } from '@/components/screens/campo';
export default function Page() {
  return <Campo />;
}
