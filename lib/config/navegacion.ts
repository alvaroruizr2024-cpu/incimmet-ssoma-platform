import type { RolDemo } from '../types';
const todos: RolDemo[] = ['Gerencia', 'SSOMA corporativo', 'Supervisor de campo'];
export const navegacion = [
  { href: '/dashboard', titulo: 'Dashboard', roles: todos },
  {
    href: '/analisis',
    titulo: 'Análisis avanzado',
    roles: ['Gerencia', 'SSOMA corporativo'] as RolDemo[],
  },
  { href: '/eventos', titulo: 'Eventos', roles: todos },
  { href: '/acciones', titulo: 'Acciones', roles: todos },
  { href: '/lecciones', titulo: 'Lecciones', roles: todos },
  {
    href: '/campo',
    titulo: 'Campo',
    roles: ['SSOMA corporativo', 'Supervisor de campo'] as RolDemo[],
  },
  {
    href: '/configuracion/catalogos',
    titulo: 'Catálogos',
    roles: ['SSOMA corporativo'] as RolDemo[],
  },
  { href: '/privacidad', titulo: 'Privacidad', roles: todos },
];
export function inicioPorRol(rol: RolDemo) {
  return rol === 'Supervisor de campo'
    ? '/campo'
    : rol === 'SSOMA corporativo'
      ? '/analisis'
      : '/dashboard';
}
export function rutaPermitida(ruta: string, rol: RolDemo) {
  if (ruta === '/') return true;
  const item = navegacion.find((n) => ruta === n.href || ruta.startsWith(`${n.href}/`));
  return item ? item.roles.includes(rol) : true;
}
