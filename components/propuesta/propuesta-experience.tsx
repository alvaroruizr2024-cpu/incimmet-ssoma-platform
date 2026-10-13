'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Monitor,
  MousePointerClick,
  MoveRight,
  Orbit,
  Pause,
  Play,
  X,
} from 'lucide-react';
import { modoInicial, type ModoGrafico } from '@/lib/domain/cinematica';
import { formatoNarrativo, type ResumenPresentacion } from '@/lib/domain/presentacion';
import {
  CAPITULOS,
  constelacionPropuesta,
  vecinoNodo,
  type NodoPropuesta,
} from '@/lib/domain/propuesta';
import { usePropuesta } from '@/store/propuesta';
import { Wordmark } from '@/components/brand/wordmark';
import { usePageVisible, useReducedMotion } from '../marketing/browser-state';

const PropuestaCanvas = dynamic(() => import('./propuesta-canvas'), {
  ssr: false,
  loading: () => null,
});

interface NavigatorHints extends Navigator {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
}
function supportsWebGL2(): boolean {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** Cifra con conteo animado una sola vez al entrar en vista; el valor accesible permanece estable. */
function Cifra({
  valor,
  decimales = 0,
  sufijo = '',
}: {
  valor: number | null;
  decimales?: number;
  sufijo?: string;
}) {
  const visual = useRef<HTMLSpanElement>(null);
  const played = useRef(false);
  const final = formatoNarrativo(valor, decimales) + (valor === null ? '' : sufijo);
  useEffect(() => {
    const element = visual.current;
    if (!element) return;
    element.textContent = final;
    if (played.current || valor === null || !window.IntersectionObserver) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting) || played.current) return;
        played.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / 1100);
          element.textContent =
            formatoNarrativo(valor * (1 - (1 - progress) ** 3), decimales) + sufijo;
          if (progress < 1 && !document.hidden) raf = requestAnimationFrame(tick);
          else element.textContent = final;
        };
        raf = requestAnimationFrame(tick);
        observer.disconnect();
      },
      { threshold: 0.35 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
      element.textContent = final;
    };
  }, [valor, decimales, sufijo, final]);
  return (
    <span className="pp-cifra" data-value={valor ?? 'no-consta'}>
      <span className="sr-only">{final}</span>
      <span ref={visual} aria-hidden="true">
        {final}
      </span>
    </span>
  );
}

/** Rótulo decorativo que sigue al puntero cuando hay un dato señalado. */
function Rotulo({ nodos }: { nodos: NodoPropuesta[] }) {
  const hover = usePropuesta((s) => s.hover);
  const ref = useRef<HTMLDivElement>(null);
  const nodo = nodos.find((n) => n.clave === hover) ?? null;
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const mover = (event: PointerEvent) => {
      element.style.transform = `translate(${event.clientX + 16}px, ${event.clientY + 14}px)`;
    };
    window.addEventListener('pointermove', mover, { passive: true });
    return () => window.removeEventListener('pointermove', mover);
  }, []);
  return (
    <div ref={ref} className="pp-rotulo" data-visible={nodo ? 'si' : 'no'} aria-hidden="true">
      {nodo ? nodo.titulo : ''}
    </div>
  );
}

const TITULO_TIPO: Record<NodoPropuesta['tipo'], string> = {
  proyecto: 'Proyecto',
  baliza: 'Alto potencial',
  indice: 'Índice oficial',
  cierre: 'Cumplimiento',
};
/** Panel «Dato fijado»: identidad, detalle, enlace a la plataforma y recorrido por teclado. */
function Inspector({ nodos }: { nodos: NodoPropuesta[] }) {
  const seleccion = usePropuesta((s) => s.seleccion);
  const panel = useRef<HTMLDivElement>(null);
  const nodo = nodos.find((n) => n.clave === seleccion) ?? null;
  useEffect(() => {
    if (nodo) panel.current?.focus();
  }, [nodo]);
  useEffect(() => {
    const teclas = (event: KeyboardEvent) => {
      const estado = usePropuesta.getState();
      if (!estado.seleccion) return;
      if (event.key === 'Escape') estado.seleccionar(null);
      if (event.key === 'ArrowRight') estado.seleccionar(vecinoNodo(nodos, estado.seleccion, 1));
      if (event.key === 'ArrowLeft') estado.seleccionar(vecinoNodo(nodos, estado.seleccion, -1));
    };
    window.addEventListener('keydown', teclas);
    return () => window.removeEventListener('keydown', teclas);
  }, [nodos]);
  if (!nodo) return null;
  return (
    <div
      ref={panel}
      className="pp-inspector"
      role="dialog"
      aria-modal="false"
      aria-label={`Dato fijado: ${nodo.titulo}`}
      tabIndex={-1}
      data-tipo={nodo.tipo}
    >
      <p className="pp-inspector-tipo">{TITULO_TIPO[nodo.tipo]}</p>
      <h3>{nodo.titulo}</h3>
      <p className="pp-inspector-detalle">{nodo.detalle}</p>
      <div className="pp-inspector-acciones">
        <button
          type="button"
          aria-label="Dato anterior"
          onClick={() => usePropuesta.getState().seleccionar(vecinoNodo(nodos, nodo.clave, -1))}
        >
          <ArrowLeft size={16} aria-hidden="true" />
        </button>
        <Link prefetch={false} href={nodo.href} className="pp-inspector-link">
          Ver en la plataforma <MoveRight size={15} aria-hidden="true" />
        </Link>
        <button
          type="button"
          aria-label="Dato siguiente"
          onClick={() => usePropuesta.getState().seleccionar(vecinoNodo(nodos, nodo.clave, 1))}
        >
          <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Cerrar panel"
          className="pp-inspector-cerrar"
          onClick={() => usePropuesta.getState().seleccionar(null)}
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function PropuestaExperience({ data }: { data: ResumenPresentacion }) {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const visible = usePageVisible();
  const [inView, setInView] = useState(true);
  const [ready, setReady] = useState(false);
  const [cartel, setCartel] = useState(true);
  const [capitulo, setCapitulo] = useState(0);
  const [forzar3d, setForzar3d] = useState(false);
  const [cine, setCine] = useState(false);
  const [modo, setModo] = useState<{ modo: ModoGrafico; razon: string; webgl: boolean }>({
    modo: '2d',
    razon: 'Preparando la propuesta accesible.',
    webgl: false,
  });
  const nodos = useMemo(() => constelacionPropuesta(data), [data]);
  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      const nav = navigator as NavigatorHints;
      const glOk = supportsWebGL2();
      const webgl = !reduced && glOk;
      const inicial = modoInicial({
        webgl,
        reducido: reduced,
        memoria: nav.deviceMemory,
        nucleos: nav.hardwareConcurrency,
        movil: matchMedia('(max-width:767px)').matches,
        ahorro: nav.connection?.saveData,
      });
      setModo({
        modo: inicial,
        webgl: glOk,
        razon: reduced
          ? 'Movimiento reducido: active el 3D con el botón «Ver en 3D» si lo desea.'
          : !glOk
            ? 'WebGL2 no disponible: se conserva todo el contenido.'
            : inicial === '2d'
              ? 'Versión ligera por capacidad del dispositivo o ahorro de datos; puede forzar 3D.'
              : 'Recorrido cinematográfico con los datos documentales en el espacio 3D.',
      });
    });
    return () => cancelAnimationFrame(handle);
  }, [reduced]);
  useEffect(() => {
    const timer = setTimeout(() => setCartel(false), reduced ? 0 : 3400);
    return () => clearTimeout(timer);
  }, [reduced]);
  useEffect(() => {
    const el = root.current;
    if (!el || !window.IntersectionObserver) return;
    const observer = new IntersectionObserver(([entry]) =>
      setInView(Boolean(entry?.isIntersecting)),
    );
    observer.observe(el);
    const scenes = new IntersectionObserver(
      (entries) => {
        const entry = entries.find((e) => e.isIntersecting);
        if (!entry) return;
        const i = CAPITULOS.findIndex((c) => c.id === entry.target.id);
        if (i >= 0) setCapitulo(i);
      },
      { rootMargin: '-35% 0px -35% 0px', threshold: 0 },
    );
    el.querySelectorAll('[data-pp-scene]').forEach((s) => scenes.observe(s));
    return () => {
      observer.disconnect();
      scenes.disconnect();
    };
  }, []);
  // Al cambiar de capítulo el dato fijado deja de corresponder al encuadre.
  useEffect(() => {
    usePropuesta.getState().seleccionar(null);
    usePropuesta.getState().fijarHover(null);
  }, [capitulo]);
  // Modo cine: autorrecorrido suave de todos los capítulos; cualquier gesto lo detiene.
  const cineActivo = useRef(false);
  const cineRaf = useRef(0);
  const detenerCine = useCallback(() => {
    cineActivo.current = false;
    setCine(false);
    cancelAnimationFrame(cineRaf.current);
  }, []);
  useEffect(() => {
    if (!cine) return;
    cineActivo.current = true;
    let ultimo = performance.now();
    const paso = (ahora: number) => {
      if (!cineActivo.current) return;
      const dt = Math.min(50, ahora - ultimo);
      ultimo = ahora;
      const max = Math.max(0, document.body.scrollHeight - window.innerHeight);
      const y = Math.min(max, window.scrollY + dt * 0.095);
      window.scrollTo(0, y);
      if (y >= max) {
        detenerCine();
        return;
      }
      cineRaf.current = requestAnimationFrame(paso);
    };
    cineRaf.current = requestAnimationFrame(paso);
    window.addEventListener('wheel', detenerCine, { passive: true });
    window.addEventListener('touchstart', detenerCine, { passive: true });
    window.addEventListener('keydown', detenerCine);
    return () => {
      cancelAnimationFrame(cineRaf.current);
      window.removeEventListener('wheel', detenerCine);
      window.removeEventListener('touchstart', detenerCine);
      window.removeEventListener('keydown', detenerCine);
    };
  }, [cine, detenerCine]);
  // Un gesto explícito del usuario activa el 3D aunque el sistema pida movimiento reducido.
  const es3d = (modo.modo !== '2d' && !reduced) || (forzar3d && modo.webgl);
  const activo = es3d && visible && inView;
  const onListo = useCallback(() => setReady(true), []);
  const irA = (index: number) => {
    const c = CAPITULOS[index];
    if (!c) return;
    document
      .getElementById(c.id)
      ?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  };
  const explorar = () => {
    const estado = usePropuesta.getState();
    estado.seleccionar(estado.seleccion ? null : vecinoNodo(nodos, null, 1));
  };
  const topProyecto = data.proyectosDetalle[0] ?? null;
  return (
    <div
      ref={root}
      className="pp-root"
      data-mode={es3d ? '3d' : '2d'}
      data-ready={ready ? 'yes' : 'no'}
      data-cartel={cartel ? 'on' : 'off'}
      data-capitulo={capitulo}
    >
      <div className="pp-letterbox" aria-hidden="true">
        <div className="pp-bar pp-bar-top" />
        <div className="pp-bar pp-bar-bottom" />
        <div className="pp-cartel">
          <p className="pp-cartel-kicker">INCIMMET · Gestión SSOMA</p>
          <p className="pp-cartel-titulo">Del reporte a la evidencia</p>
          <p className="pp-cartel-sub">Una propuesta cinematográfica e interactiva</p>
        </div>
      </div>
      <button type="button" className="pp-saltar-cartel" onClick={() => setCartel(false)}>
        Saltar presentación
      </button>
      <header className="pp-header">
        <Link prefetch={false} href="#apertura" aria-label="INCIMMET — inicio de la propuesta">
          <Wordmark />
        </Link>
        <div className="pp-header-actions">
          <span className="pp-demo">PROPUESTA · DEMO DOCUMENTAL</span>
          {modo.webgl &&
            (es3d && forzar3d ? (
              <button type="button" className="pp-forzar3d" onClick={() => setForzar3d(false)}>
                <Monitor size={16} aria-hidden="true" />
                <span>Lectura 2D</span>
              </button>
            ) : !es3d ? (
              <button
                type="button"
                className="pp-forzar3d"
                onClick={() => {
                  setForzar3d(true);
                  setCartel(false);
                }}
              >
                <Orbit size={16} aria-hidden="true" />
                <span>Ver en 3D</span>
              </button>
            ) : null)}
          <Link prefetch={false} href="/dashboard" className="pp-skip">
            Ir a la plataforma <MoveRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <p className="pp-mode-reason">
          {es3d
            ? ready
              ? forzar3d
                ? '3D cinematográfico · activado manualmente'
                : '3D cinematográfico'
              : 'Cargando recorrido 3D; el contenido ya está disponible.'
            : modo.razon}
        </p>
      </header>
      <div className="pp-backdrop" aria-hidden="true">
        {es3d && (
          <PropuestaCanvas
            activo={activo}
            calidad={modo.modo === 'alta' ? 'alta' : 'equilibrada'}
            nodos={nodos}
            onListo={onListo}
          />
        )}
        <div className="pp-grain" />
        <div className="pp-vignette" />
      </div>
      <main id="propuesta-story" className="pp-main">
        <section id="apertura" data-pp-scene className="pp-scene pp-scene-centro" tabIndex={-1}>
          <p className="pp-kicker">Base documental verificada · Corte {data.corte}</p>
          <h1>Del reporte a la evidencia</h1>
          <p className="pp-lead">
            Un recorrido cinematográfico por la gestión SSOMA: cada cifra de esta escena nace de la
            base documental y enlaza con su ficha en la plataforma.
          </p>
          <p className="pp-hint">Desplácese para iniciar el recorrido</p>
          {!es3d && modo.webgl && (
            <button
              type="button"
              className="pp-forzar3d pp-forzar3d-hero"
              onClick={() => {
                setForzar3d(true);
                setCartel(false);
              }}
            >
              <Orbit size={17} aria-hidden="true" />
              <span>Activar experiencia 3D</span>
            </button>
          )}
        </section>
        <section id="operacion" data-pp-scene className="pp-scene" tabIndex={-1}>
          <p className="pp-kicker">01 · La operación en cifras</p>
          <p className="pp-big">
            <Cifra valor={data.eventos} />
          </p>
          <p className="pp-caption">
            eventos documentales registrados entre {data.desde ?? 'No consta'} y{' '}
            {data.hasta ?? 'No consta'}
          </p>
        </section>
        <section id="proyectos" data-pp-scene className="pp-scene pp-scene-derecha" tabIndex={-1}>
          <p className="pp-kicker">02 · Frentes de trabajo</p>
          <p className="pp-big">
            <Cifra valor={data.proyectos} />
          </p>
          <p className="pp-caption">
            proyectos con actividad documental
            {topProyecto
              ? ` · Mayor registro: ${topProyecto.nombre} (${formatoNarrativo(topProyecto.eventos)} eventos)`
              : ''}
          </p>
        </section>
        <section id="indices" data-pp-scene className="pp-scene" tabIndex={-1}>
          <p className="pp-kicker">
            03 · Índices oficiales {data.indicadores.anio} · {data.indicadores.ambitoNombre}
          </p>
          <div className="pp-indices">
            <p>
              <span className="pp-indice-num">
                <Cifra valor={data.indicadores.if} decimales={2} />
              </span>
              <span className="pp-indice-etq">IF</span>
            </p>
            <p>
              <span className="pp-indice-num">
                <Cifra valor={data.indicadores.is} decimales={2} />
              </span>
              <span className="pp-indice-etq">IS</span>
            </p>
            <p>
              <span className="pp-indice-num">
                <Cifra valor={data.indicadores.ia} decimales={3} />
              </span>
              <span className="pp-indice-etq">IA</span>
            </p>
          </div>
          <p className="pp-caption">
            {data.indicadores.fuente ?? 'Fuente no consta'} · cifras oficiales del corte importado
          </p>
        </section>
        <section id="potencial" data-pp-scene className="pp-scene pp-scene-derecha" tabIndex={-1}>
          <p className="pp-kicker">04 · Alto potencial</p>
          <p className="pp-big pp-amber">
            <Cifra valor={data.altoPotencial} />
          </p>
          <p className="pp-caption">
            eventos de alto potencial señalados en la base; cada baliza ámbar de la escena enlaza
            con su ficha
          </p>
        </section>
        <section id="nucleo" data-pp-scene className="pp-scene pp-scene-centro" tabIndex={-1}>
          <p className="pp-kicker">05 · La sala de datos</p>
          <h2>Explore el núcleo</h2>
          <p className="pp-lead">
            <Orbit size={18} aria-hidden="true" /> Arrastre para orbitar alrededor del núcleo ·{' '}
            <MousePointerClick size={18} aria-hidden="true" /> Toque un dato para fijarlo y abrir su
            ficha
          </p>
          <p className="pp-caption">
            <Cifra valor={data.porcentajeCierre} decimales={1} sufijo="%" /> de acciones con cierre
            verificado según el corte importado
          </p>
          <div className="pp-cta">
            <Link prefetch={false} href="/dashboard" className="pp-cta-principal">
              Entrar a la plataforma <MoveRight size={17} aria-hidden="true" />
            </Link>
            <Link prefetch={false} href="/" className="pp-cta-secundario">
              Ver versión documental
            </Link>
          </div>
        </section>
      </main>
      <nav className="pp-nav" aria-label="Capítulos de la propuesta">
        <div className="pp-nav-dots">
          {CAPITULOS.map((c, i) => (
            <button
              type="button"
              key={c.id}
              aria-current={i === capitulo ? 'step' : undefined}
              aria-label={`${i + 1}. ${c.titulo}`}
              onClick={() => irA(i)}
            >
              <span>{String(i + 1).padStart(2, '0')}</span>
            </button>
          ))}
        </div>
        {es3d && (
          <button
            type="button"
            className="pp-explorar"
            aria-label="Explorar los datos 3D de la escena"
            onClick={explorar}
          >
            <Orbit size={18} aria-hidden="true" />
          </button>
        )}
        {!reduced && (
          <button
            type="button"
            className="pp-cine"
            aria-label={cine ? 'Detener el modo cine' : 'Modo cine: recorrido automático'}
            aria-pressed={cine}
            data-activo={cine ? 'si' : 'no'}
            onClick={() => (cine ? detenerCine() : setCine(true))}
          >
            {cine ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
          </button>
        )}
      </nav>
      {es3d && <Rotulo nodos={nodos} />}
      {es3d && <Inspector nodos={nodos} />}
      <footer className="pp-footer">
        <p>{modo.razon}</p>
        <p>
          Geometría ilustrativa, no representación de una unidad real.{' '}
          <Link prefetch={false} href="/privacidad">
            Privacidad y alcance de la demo
          </Link>
        </p>
      </footer>
    </div>
  );
}
