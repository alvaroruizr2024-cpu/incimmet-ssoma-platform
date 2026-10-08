import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
export function numero(valor: number | null | undefined, decimales = 0): string {
  return valor === null || valor === undefined
    ? 'No consta'
    : valor.toLocaleString('en-US', {
        maximumFractionDigits: decimales,
        minimumFractionDigits: decimales,
      });
}
