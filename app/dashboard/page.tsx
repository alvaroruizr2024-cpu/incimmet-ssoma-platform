import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Dashboard ejecutivo' };
import { Dashboard } from '@/components/screens/dashboard';
export default function Page() {
  return <Dashboard />;
}
