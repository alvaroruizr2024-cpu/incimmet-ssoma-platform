'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  Moon,
  Sun,
  ArrowRight,
  LayoutDashboard,
  ChartNoAxesCombined,
  ClipboardList,
  ListChecks,
  BookOpen,
  HardHat,
  Settings2,
  ShieldCheck,
} from 'lucide-react';
import { useMounted } from '@/lib/hooks/use-mounted';
import { QualityNotice } from './quality-notice';
import type { ReactNode } from 'react';
import type { RolDemo } from '@/lib/types';
import { useSesion, useDataSource, useFiltros } from '@/components/providers';
import { useBase } from '@/lib/hooks/use-base';
import { formatoFecha } from '@/lib/domain/fechas';
import { filtrosAParametros } from '@/lib/domain/filtrosURL';
import { inicioPorRol, navegacion, rutaPermitida } from '@/lib/config/navegacion';
import { mensajes } from '@/messages/es-PE';
import { Button } from '@/components/ui/button';
import { Wordmark } from '@/components/brand/wordmark';
const navIcons = {
  '/dashboard': LayoutDashboard,
  '/analisis': ChartNoAxesCombined,
  '/eventos': ClipboardList,
  '/acciones': ListChecks,
  '/lecciones': BookOpen,
  '/campo': HardHat,
  '/configuracion/catalogos': Settings2,
  '/privacidad': ShieldCheck,
};
export function AppShell({ children }: { children: ReactNode }) {
  const ruta = usePathname();
  return ruta === '/' || ruta === '/propuesta' ? (
    <>{children}</>
  ) : (
    <OperationalShell>{children}</OperationalShell>
  );
}
function OperationalShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const mounted = useMounted();
  const ruta = mounted ? pathname : '';
  const router = useRouter();
  const { actor, cambiar, hidratado } = useSesion();
  const { resolvedTheme, setTheme } = useTheme();
  const base = useBase('base');
  const asignaciones = useBase('base+local');
  const source = useDataSource();
  const filtros = useFiltros((s) => s.filtros);
  const consulta = filtrosAParametros(filtros).toString();
  const href = (path: string) => `${path}${consulta ? `?${consulta}` : ''}`;
  const elegirRol = (rol: RolDemo) => {
    cambiar({ ...actor, rol });
    const destino = inicioPorRol(rol);
    if (destino === '/campo' || ruta === '/campo') window.location.assign(href(destino));
    else router.push(href(destino));
  };
  return (
    <div className="portal-shell min-h-screen bg-background text-foreground">
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <header className="portal-header border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-4 lg:px-8">
          <Link
            href="/"
            onClick={(e) => {
              if (ruta === '/campo') {
                e.preventDefault();
                window.location.assign('/');
              }
            }}
            prefetch={false}
            className="rounded-md bg-white px-3 py-2 text-brand-navy"
            aria-label="INCIMMET, presentación"
          >
            <Wordmark />
          </Link>
          <div className="flex min-w-0 max-w-full flex-wrap items-end gap-3">
            <label className="grid min-w-0 w-full sm:w-56 gap-1 text-xs font-medium">
              Rol de demostración
              <select
                className="w-full min-w-0"
                aria-label="Rol de demostración"
                value={actor.rol}
                onChange={(e) => elegirRol(e.target.value as RolDemo)}
              >
                {(['Gerencia', 'SSOMA corporativo', 'Supervisor de campo'] as const).map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
            {actor.rol === 'Supervisor de campo' && (
              <label className="grid min-w-0 w-full sm:w-56 gap-1 text-xs font-medium">
                Contexto de proyecto
                <select
                  className="w-full min-w-0"
                  aria-label="Contexto de proyecto"
                  value={actor.proyectoCodigo ?? ''}
                  onChange={(e) =>
                    cambiar({ ...actor, proyectoCodigo: e.target.value || undefined })
                  }
                >
                  <option value="">Seleccione proyecto</option>
                  {base.data?.proyectos.map((p) => (
                    <option key={p.codigo} value={p.codigo}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {actor.rol === 'Supervisor de campo' && (
              <label className="grid w-full min-w-0 sm:w-56 max-w-full gap-1 text-xs font-medium">
                Función responsable
                <select
                  className="w-full min-w-0"
                  aria-label="Función responsable"
                  value={actor.responsableRol ?? ''}
                  onChange={(e) =>
                    cambiar({ ...actor, responsableRol: e.target.value || undefined })
                  }
                >
                  <option value="">Seleccione función</option>
                  {[
                    ...new Set(
                      (asignaciones.data?.acciones ?? [])
                        .filter((a) => a.proyectoCodigo === actor.proyectoCodigo)
                        .map((a) => a.responsableRol)
                        .filter((s): s is string => !!s && !/^no consta/i.test(s)),
                    ),
                  ]
                    .sort()
                    .map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                </select>
              </label>
            )}
            <Button
              variant="outline"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              aria-label="Cambiar tema claro u oscuro"
            >
              <Moon size={18} className="dark:hidden" />
              <Sun size={18} className="hidden dark:block" />
              <span className="sr-only">Cambiar tema</span>
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1600px] grid-cols-[minmax(0,1fr)] lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="portal-sidebar min-w-0 border-b border-border p-3 lg:min-h-[calc(100vh-112px)] lg:border-b-0 lg:border-r lg:p-5">
          <p className="mb-3 hidden text-xs font-semibold uppercase tracking-widest text-secondary lg:block">
            Gestión SSOMA
          </p>
          <nav aria-label="Navegación principal" className="flex gap-2 overflow-x-auto lg:flex-col">
            {navegacion
              .filter((n) => n.roles.includes(actor.rol))
              .map((n) => (
                <Link
                  prefetch={false}
                  onClick={(event) => {
                    if (n.href === '/campo' || ruta === '/campo') {
                      event.preventDefault();
                      window.location.assign(href(n.href));
                    }
                  }}
                  href={href(n.href)}
                  key={n.href}
                  aria-current={ruta.startsWith(n.href) ? 'page' : undefined}
                  className={`flex min-h-12 shrink-0 items-center justify-between gap-2 rounded-md px-3 text-sm font-medium ${ruta.startsWith(n.href) ? 'bg-brand-deep text-white' : 'hover:bg-muted'}`}
                >
                  <span className="nav-label">
                    {(() => {
                      const Icon = navIcons[n.href as keyof typeof navIcons];
                      return Icon ? <Icon size={19} aria-hidden="true" /> : null;
                    })()}
                    {n.titulo}
                  </span>
                  {ruta.startsWith(n.href) && <ArrowRight size={14} aria-hidden="true" />}
                </Link>
              ))}
          </nav>
          <div className="sidebar-purpose hidden lg:block">
            <HardHat size={24} aria-hidden="true" />
            <p>Seguridad en cada operación</p>
            <span>Eventos, acciones y aprendizaje para una gestión trazable.</span>
          </div>
          <p className="mt-6 hidden text-xs leading-relaxed text-secondary lg:block">
            El selector de rol cambia la interfaz. No autentica ni protege el JSON público.
          </p>
        </aside>
        <main id="contenido" className="portal-main min-w-0 px-4 py-6 lg:px-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2 text-xs font-medium">
            <span className="rounded border border-brand-accent px-2 py-1">{mensajes.demo}</span>
            <span>
              Corte documental:{' '}
              {base.data ? formatoFecha(base.data.meta.fecha_corte_estados) : 'Cargando…'} ·
              America/Lima
            </span>
          </div>
          {base.data && <QualityNotice base={base.data} ruta={ruta} />}
          {source.getAvisoPersistencia() && (
            <p role="status" className="mb-4 rounded border border-border p-3 text-sm">
              {source.getAvisoPersistencia()}
            </p>
          )}
          {!hidratado || !mounted ? (
            <p role="status">Recuperando contexto de demostración…</p>
          ) : rutaPermitida(ruta, actor.rol) ? (
            children
          ) : (
            <section>
              <h1>Módulo no disponible para el rol seleccionado</h1>
              <p>Cambie el rol de demo o regrese al inicio de campo.</p>
              <Button asChild className="mt-4">
                <Link
                  prefetch={false}
                  href={href(inicioPorRol(actor.rol))}
                  onClick={(e) => {
                    if (inicioPorRol(actor.rol) === '/campo' || ruta === '/campo') {
                      e.preventDefault();
                      window.location.assign(href(inicioPorRol(actor.rol)));
                    }
                  }}
                >
                  Ir al inicio
                </Link>
              </Button>
            </section>
          )}
          <footer className="mt-12 border-t border-border pt-4 text-xs text-secondary">
            {mensajes.etapa} · Sin backend ni transmisión de reportes.{' '}
            <Link
              prefetch={false}
              href="/privacidad"
              className="underline"
              onClick={(e) => {
                if (ruta === '/campo') {
                  e.preventDefault();
                  window.location.assign('/privacidad');
                }
              }}
            >
              Privacidad
            </Link>
          </footer>
        </main>
      </div>
    </div>
  );
}
