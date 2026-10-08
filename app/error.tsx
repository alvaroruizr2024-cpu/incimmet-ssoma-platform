'use client';
import { Button } from '@/components/ui/button';
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section role="alert">
      <h1>No se pudo mostrar este módulo</h1>
      <p className="my-4">
        Los cambios guardados en IndexedDB no se borraron. Reintente la lectura.
      </p>
      <Button onClick={reset}>Reintentar</Button>
    </section>
  );
}
