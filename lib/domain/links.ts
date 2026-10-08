import type { Filtros } from '../types';
import { filtrosAParametros } from './filtrosURL';
export function enlaceConContexto(href: string, filtros: Filtros) {
  const url = new URL(href, 'https://incimmet.invalid');
  const query = filtrosAParametros(filtros, url.searchParams).toString();
  return `${url.pathname}${query ? `?${query}` : ''}${url.hash}`;
}
