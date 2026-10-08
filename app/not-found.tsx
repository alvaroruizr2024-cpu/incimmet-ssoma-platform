import Link from 'next/link';
export default function NotFound() {
  return (
    <section>
      <h1>Página no encontrada</h1>
      <p className="mt-4">
        <Link className="underline" href="/dashboard">
          Volver al dashboard
        </Link>
      </p>
    </section>
  );
}
