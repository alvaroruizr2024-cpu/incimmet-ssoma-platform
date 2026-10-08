import { mensajes } from '@/messages/es-PE';
export function Wordmark({ compacto = false }: { compacto?: boolean }) {
  return (
    <span
      className="incimmet-wordmark"
      role="img"
      aria-label={`${mensajes.marca}. ${mensajes.lema}`}
      data-compacto={compacto || undefined}
    >
      <span className="incimmet-wordmark-nombre" aria-hidden="true">
        {mensajes.marca}
      </span>
      <span className="incimmet-wordmark-lema" aria-hidden="true">
        {mensajes.lema}
      </span>
    </span>
  );
}
