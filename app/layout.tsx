import type { Metadata, Viewport } from 'next';
import { Providers } from '@/components/providers';
import { AppShell } from '@/components/shell/app-shell';
import './globals.css';
import './(marketing)/presentacion.css';
export const metadata: Metadata = {
  title: { default: 'INCIMMET · Gestión SSOMA', template: '%s | INCIMMET' },
  description: 'Demo local de gestión de incidentes SSOMA. Base documental y trazabilidad.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'INCIMMET', statusBarStyle: 'default' },
  icons: { apple: '/icons/apple-touch-icon.png' },
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#151F44' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-PE" suppressHydrationWarning>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
