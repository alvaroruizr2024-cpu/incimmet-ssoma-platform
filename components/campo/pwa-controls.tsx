'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
async function estadoWorker(worker: ServiceWorker): Promise<{ ready: boolean; assets: number }> {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => {
      channel.port1.close();
      reject(new Error('El worker no confirmó la preparación offline.'));
    }, 15000);
    channel.port1.onmessage = (e) => {
      clearTimeout(timer);
      channel.port1.close();
      resolve(e.data as { ready: boolean; assets: number });
    };
    worker.postMessage({ type: 'STATUS' }, [channel.port2]);
  });
}
export function PwaControls() {
  const [install, setInstall] = useState<InstallEvent | null>(null),
    [standalone, setStandalone] = useState(false);
  const [estado, setEstado] = useState('Preparando disponibilidad sin conexión…'),
    [update, setUpdate] = useState(false),
    [busy, setBusy] = useState(false);
  const reg = useRef<ServiceWorkerRegistration | null>(null),
    reload = useRef(false);
  const preparar = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) {
      setEstado('La preparación offline requiere HTTPS o localhost y un navegador compatible.');
      return;
    }
    if (process.env.NODE_ENV !== 'production') {
      setEstado(
        'Modo desarrollo: service worker desactivado. Pruebe offline con npm run build y npm start.',
      );
      return;
    }
    setBusy(true);
    try {
      const existing = await navigator.serviceWorker.getRegistration('/');
      const registration =
        !navigator.onLine && existing
          ? existing
          : await navigator.serviceWorker.register('/sw.js', {
              scope: '/',
              updateViaCache: 'none',
            });
      reg.current = registration;
      if (registration.waiting) setUpdate(true);
      registration.addEventListener(
        'updatefound',
        () => {
          const installing = registration.installing;
          installing?.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller)
              setUpdate(true);
          });
        },
        { once: true },
      );
      let timeout: ReturnType<typeof setTimeout> | undefined;
      let ready: ServiceWorkerRegistration;
      try {
        ready = registration.active
          ? registration
          : await Promise.race([
              navigator.serviceWorker.ready,
              new Promise<never>((_, reject) => {
                timeout = setTimeout(
                  () =>
                    reject(
                      new Error(
                        'No se completó la instalación offline. Compruebe la conexión y reintente.',
                      ),
                    ),
                  25000,
                );
              }),
            ]);
      } finally {
        if (timeout) clearTimeout(timeout);
      }
      const worker = ready.active;
      if (!worker) throw new Error('Worker todavía inactivo.');
      const status = await estadoWorker(worker);
      if (!status.ready) throw new Error('La caché no está completa. No se confirma uso offline.');
      setEstado(
        `Campo preparado sin conexión · ${status.assets} recursos verificados. Los reportes se guardan solo en este dispositivo.`,
      );
    } catch (error) {
      setEstado(error instanceof Error ? error.message : 'No se pudo preparar la PWA.');
    } finally {
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setStandalone(matchMedia('(display-mode: standalone)').matches);
      void preparar();
    });
    const before = (e: Event) => {
      e.preventDefault();
      setInstall(e as InstallEvent);
    };
    const installed = () => {
      setStandalone(true);
      setInstall(null);
    };
    const change = () => {
      if (reload.current) window.location.reload();
    };
    window.addEventListener('beforeinstallprompt', before);
    window.addEventListener('appinstalled', installed);
    navigator.serviceWorker?.addEventListener('controllerchange', change);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('beforeinstallprompt', before);
      window.removeEventListener('appinstalled', installed);
      navigator.serviceWorker?.removeEventListener('controllerchange', change);
    };
  }, [preparar]);
  async function instalar() {
    if (!install) return;
    try {
      await install.prompt();
      await install.userChoice;
      setInstall(null);
    } catch {
      setEstado('No se pudo abrir el instalador. Use el menú del navegador.');
    }
  }
  return (
    <details className="mb-5 rounded-xl border border-border bg-card p-4">
      <summary className="cursor-pointer text-sm font-semibold">
        Instalación y disponibilidad sin conexión
      </summary>
      <p className="my-3 text-sm" role="status" aria-live="polite">
        {estado}
      </p>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => {
            void preparar();
          }}
        >
          {busy ? 'Preparando…' : 'Verificar preparación offline'}
        </Button>
        {!standalone && install && (
          <Button
            type="button"
            onClick={() => {
              void instalar();
            }}
          >
            Instalar aplicación
          </Button>
        )}
        {update && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (
                window.confirm(
                  'Guarde su borrador antes de actualizar. ¿Recargar con la nueva versión?',
                )
              ) {
                reload.current = true;
                reg.current?.waiting?.postMessage({ type: 'SKIP_WAITING' });
              }
            }}
          >
            Actualizar aplicación
          </Button>
        )}
      </div>
      {!standalone && !install && (
        <p className="mt-3 text-xs text-secondary">
          Para instalar: use «Instalar aplicación» del menú del navegador. En Safari de iPhone/iPad:
          Compartir → Agregar a pantalla de inicio. La opción depende del navegador.
        </p>
      )}
      <p className="mt-3 text-xs text-secondary">
        La primera preparación necesita conexión. No borre los datos del sitio con reportes
        pendientes. El reconocimiento de voz puede requerir conexión; el formulario y el guardado
        no.
      </p>
    </details>
  );
}
