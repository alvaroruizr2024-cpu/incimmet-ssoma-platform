'use client';
import Link from 'next/link';
import type { ComponentProps } from 'react';
import { useFiltros, useSesion } from '@/components/providers';
import { enlaceConContexto } from '@/lib/domain/links';
export function ContextLink({
  href,
  children,
  ...props
}: Omit<ComponentProps<typeof Link>, 'href'> & { href: string }) {
  const filtros = useFiltros((s) => s.filtros);
  const { cambiar } = useSesion();
  return (
    <Link
      {...props}
      prefetch={false}
      href={enlaceConContexto(href, filtros)}
      onClick={(event) => {
        // El CTA de campo activa explícitamente el rol de demostración apropiado.
        if (href === '/campo') {
          cambiar({ rol: 'Supervisor de campo' });
          event.preventDefault();
          window.location.assign('/campo?origen=pwa');
        }
        props.onClick?.(event);
      }}
    >
      {children}
    </Link>
  );
}
