'use client';
import { useEffect, useState } from 'react';
import { useDataSource, useFiltros } from '@/components/providers';
import { Button } from '@/components/ui/button';
import { formatoFecha } from '@/lib/domain/fechas';
import type { EstadoSimulacion } from '@/lib/domain/reproduccion';
const inicial: EstadoSimulacion = {
  estado: 'detenida',
  anio: 2026,
  total: 0,
  visibles: [],
  ultimoId: null,
};
export function ReproduccionControls() {
  const source = useDataSource();
  const actualizar = useFiltros((s) => s.actualizar);
  const [estado, setEstado] = useState<EstadoSimulacion>(inicial),
    [mensaje, setMensaje] = useState(''),
    [error, setError] = useState('');
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const callback = () => setEstado(source.getEstadoSimulacion());
    const raf = requestAnimationFrame(callback);
    const unsubscribe = source.subscribe((cambio) => {
      if (cambio.tipo !== 'simulacion') return;
      callback();
      if (cambio.evento) {
        setMensaje(
          `Nuevo evento · ${cambio.evento.id} · ${formatoFecha(cambio.evento.fecha)} · Reproducción histórica`,
        );
        clearTimeout(timer);
        timer = setTimeout(() => setMensaje(''), 2800);
      }
    });
    const visibility = () => {
      if (document.hidden) source.pausarSimulacion();
    };
    document.addEventListener('visibilitychange', visibility);
    return () => {
      unsubscribe();
      clearTimeout(timer);
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', visibility);
      source.pausarSimulacion();
    };
  }, [source]);
  const comenzar = async () => {
    try {
      setError('');
      await source.iniciarSimulacion();
      actualizar({
        contexto: 'reproduccion',
        anios: [2026],
        meses: undefined,
        desde: undefined,
        hasta: undefined,
        eventoIds: undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar la reproducción');
    }
  };
  const salir = () => {
    source.detenerSimulacion();
    actualizar({ contexto: 'base', anios: undefined });
    setMensaje('');
  };
  return (
    <section
      aria-label="Reproducción histórica"
      className="mb-6 rounded-lg border border-border bg-card p-4"
    >
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={() => {
            void comenzar();
          }}
        >
          {estado.estado === 'detenida' ? 'Simular tiempo real' : 'Reiniciar reproducción'}
        </Button>
        {estado.estado === 'reproduciendo' && (
          <Button variant="outline" onClick={() => source.pausarSimulacion()}>
            Pausar
          </Button>
        )}
        {estado.estado === 'pausada' && (
          <Button variant="outline" onClick={() => source.reanudarSimulacion()}>
            Continuar
          </Button>
        )}
        {['pausada', 'reproduciendo'].includes(estado.estado) && (
          <Button variant="outline" onClick={() => source.avanzarSimulacion()}>
            Siguiente evento
          </Button>
        )}
        {estado.estado !== 'detenida' && (
          <Button variant="outline" onClick={salir}>
            Salir y restaurar base
          </Button>
        )}
        {estado.estado !== 'detenida' && (
          <span className="text-sm font-semibold" role="status">
            {estado.visibles.length}/{estado.total} · {estado.estado}
          </span>
        )}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-secondary">
        Reproduce exclusivamente los registros de 2026, sin duplicarlos ni alterar la base. No es
        una conexión en vivo. Los filtros activos siguen aplicándose.
      </p>
      {estado.estado !== 'detenida' && (
        <progress
          aria-label="Avance de reproducción"
          value={estado.visibles.length}
          max={Math.max(1, estado.total)}
          className="mt-3 w-full"
        />
      )}
      {mensaje && (
        <div
          role="status"
          className="mt-3 rounded-md border border-brand-accent bg-sky-50 p-3 text-sm text-slate-900"
        >
          {mensaje}
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}
