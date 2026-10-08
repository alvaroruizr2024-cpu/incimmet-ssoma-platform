'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Monitor,
  MoveRight,
  Orbit,
  RotateCcw,
} from 'lucide-react';
import {
  ESCENAS,
  MENSAJES_FALLBACK,
  modoInicial,
  type Calidad3D,
  type ModoGrafico,
  type MotivoFallback3D,
} from '@/lib/domain/cinematica';
import { catalogoInteractivo, vecinoEnEscena } from '@/lib/domain/interactivos3d';
import type { ResumenPresentacion } from '@/lib/domain/presentacion';
import { Wordmark } from '@/components/brand/wordmark';
import { useRelato3D } from '@/store/relato3d';
import { IntroMotionContext } from './motion-context';
import { usePageVisible, useReducedMotion } from './browser-state';
import { ContextLink } from './context-link';
import { DataInspector } from './data-inspector';
import { FallbackGallery } from './fallback-gallery';
import { HoverCard } from './hover-card';
const MineCanvas = dynamic(() => import('@/components/three/mine-canvas'), {
  ssr: false,
  loading: () => null,
});
class SceneBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
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
const qualityNames = { alta: 'Alta', equilibrada: 'Equilibrada', baja: 'Bajo consumo' };
export function CinematicExperience({
  children,
  data,
}: {
  children: ReactNode;
  data: ResumenPresentacion;
}) {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion(),
    visible = usePageVisible();
  const [inView, setInView] = useState(true),
    [manual2d, setManual2d] = useState(false);
  const [failure, setFailure] = useState<MotivoFallback3D | null>(null);
  const [activeScene, setActiveScene] = useState(0),
    [attempt, setAttempt] = useState(0),
    [ready, setReady] = useState(false);
  const [quality, setQuality] = useState<Calidad3D>('equilibrada');
  const [capability, setCapability] = useState<{
    mode: ModoGrafico;
    reason: string;
    webgl: boolean;
  }>({ mode: '2d', reason: 'Preparando presentación accesible.', webgl: false });
  const catalogo = useMemo(() => catalogoInteractivo(data), [data]);
  const datoFijado = useRelato3D((s) => s.seleccion !== null);
  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      const nav = navigator as NavigatorHints,
        forced = new URLSearchParams(window.location.search).get('intro') === '2d';
      const webgl = !reduced && supportsWebGL2();
      const mode = modoInicial({
        webgl,
        reducido: reduced,
        memoria: nav.deviceMemory,
        nucleos: nav.hardwareConcurrency,
        movil: matchMedia('(max-width:767px)').matches,
        ahorro: nav.connection?.saveData,
      });
      const reason = reduced
        ? 'Movimiento reducido: narrativa sin animaciones.'
        : !webgl
          ? 'WebGL2 no disponible: se conserva todo el contenido.'
          : mode === '2d'
            ? 'Versión ligera por capacidad del dispositivo o ahorro de datos.'
            : 'Recorrido ilustrativo con instalaciones basadas en los datos.';
      setCapability({ mode, reason, webgl });
      setManual2d(forced);
      if (mode !== '2d') setQuality(mode);
    });
    return () => cancelAnimationFrame(handle);
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
        const i = ESCENAS.findIndex((s) => s.id === entry.target.id);
        if (i >= 0) setActiveScene(i);
      },
      { rootMargin: '-35% 0px -35% 0px', threshold: 0 },
    );
    el.querySelectorAll('[data-intro-scene]').forEach((s) => scenes.observe(s));
    return () => {
      observer.disconnect();
      scenes.disconnect();
    };
  }, []);
  const onFallback = useCallback((reason: MotivoFallback3D) => {
    setFailure(reason);
    setReady(false);
  }, []);
  const onError = useCallback(() => onFallback('error'), [onFallback]);
  const onReady = useCallback(() => setReady(true), []);
  const is3d = capability.mode !== '2d' && !reduced && !manual2d && !failure;
  const activity = visible && inView;
  // Al cambiar de escena o salir del 3D, el dato fijado deja de corresponder al encuadre.
  useEffect(() => {
    const relato = useRelato3D.getState();
    relato.seleccionar(null);
    relato.fijarHover(null);
  }, [activeScene, is3d]);
  const reason = failure
    ? MENSAJES_FALLBACK[failure]
    : manual2d
      ? 'Versión 2D elegida. Puede activar 3D si está disponible.'
      : capability.reason;
  const available = capability.webgl && !reduced;
  const retry = () => {
    if (!available) return;
    setFailure(null);
    setManual2d(false);
    setReady(false);
    setQuality('baja');
    setCapability((c) => ({
      ...c,
      mode: 'baja',
      reason: 'Reintento 3D en calidad baja. Todos los datos permanecen disponibles.',
    }));
    setAttempt((a) => a + 1);
  };
  const goTo = (index: number) => {
    const scene = ESCENAS[index];
    if (!scene) return;
    const section = document.getElementById(scene.id);
    section?.focus({ preventScroll: true });
    section?.scrollIntoView({ behavior: reduced || manual2d ? 'auto' : 'smooth', block: 'start' });
  };
  const explorar = () => {
    const relato = useRelato3D.getState();
    relato.seleccionar(relato.seleccion ? null : vecinoEnEscena(catalogo, null, activeScene, 1));
  };
  return (
    <IntroMotionContext.Provider value={is3d && activity}>
      <div
        ref={root}
        className="intro-root"
        data-mode={is3d ? '3d' : '2d'}
        data-ready={ready ? 'yes' : 'no'}
        data-motion={is3d && activity ? 'on' : 'off'}
        data-ambient={!reduced && activity ? 'on' : 'off'}
        data-scene={activeScene}
      >
        <header className="intro-header">
          <Link prefetch={false} href="#inicio" aria-label="INCIMMET — inicio de la presentación">
            <Wordmark />
          </Link>
          <div className="intro-header-actions">
            <span className="intro-demo">DEMO DOCUMENTAL</span>
            <button
              type="button"
              className="intro-toggle"
              onClick={
                is3d
                  ? () => {
                      setManual2d(true);
                      setReady(false);
                    }
                  : retry
              }
              disabled={!is3d && !available}
              aria-describedby="intro-mode-reason"
            >
              {failure ? (
                <RotateCcw size={16} aria-hidden="true" />
              ) : (
                <Monitor size={16} aria-hidden="true" />
              )}
              <span>
                {is3d
                  ? 'Lectura 2D'
                  : !available
                    ? '3D no disponible'
                    : failure
                      ? 'Reintentar 3D'
                      : 'Activar 3D'}
              </span>
            </button>
            <ContextLink href="/dashboard" className="intro-skip">
              Saltar intro <MoveRight size={17} aria-hidden="true" />
            </ContextLink>
          </div>
          <p id="intro-mode-reason" className="intro-mode-reason">
            {is3d
              ? ready
                ? `3D · ${qualityNames[quality]}`
                : 'Cargando recorrido 3D; el contenido ya está disponible.'
              : reason}
          </p>
        </header>
        <div className="intro-rail" aria-hidden="true" />
        <div className="intro-backdrop" aria-hidden="true">
          <FallbackGallery data={data} scene={activeScene} />
          {is3d && (
            <SceneBoundary key={attempt} onError={onError}>
              <MineCanvas
                active={activity}
                initialQuality={quality}
                data={data}
                scene={activeScene}
                onFallback={onFallback}
                onQualityChange={setQuality}
                onReady={onReady}
              />
            </SceneBoundary>
          )}
          <div className="intro-vignette" />
        </div>
        <main id="contenido" className="intro-main">
          <div id="cinematic-story">{children}</div>
        </main>
        <nav className="intro-scene-nav" aria-label="Navegación por escenas">
          <button
            type="button"
            aria-label="Escena anterior"
            onClick={() => goTo(activeScene - 1)}
            disabled={activeScene === 0}
          >
            <ArrowLeft size={18} />
          </button>
          <div className="intro-scene-dots">
            {ESCENAS.map((s, i) => (
              <button
                type="button"
                key={s.id}
                aria-current={i === activeScene ? 'step' : undefined}
                aria-label={`${i + 1}. ${s.titulo}`}
                onClick={() => goTo(i)}
              >
                <span>{String(i + 1).padStart(2, '0')}</span>
              </button>
            ))}
          </div>
          {is3d && (
            <button
              type="button"
              id="intro-explorar"
              className="intro-explorar"
              aria-label="Explorar los datos 3D de esta escena"
              aria-pressed={datoFijado}
              onClick={explorar}
            >
              <Orbit size={18} aria-hidden="true" />
            </button>
          )}
          <label className="intro-scene-picker">
            <span className="sr-only">Ir a una escena</span>
            <select
              className="w-full min-w-0"
              value={activeScene}
              onChange={(e) => goTo(Number(e.target.value))}
            >
              {ESCENAS.map((s, i) => (
                <option value={i} key={s.id}>
                  {String(i + 1).padStart(2, '0')} / {ESCENAS.length} · {s.titulo}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            aria-label="Escena siguiente"
            onClick={() => goTo(activeScene + 1)}
            disabled={activeScene === ESCENAS.length - 1}
          >
            <ArrowRight size={18} />
          </button>
        </nav>
        {is3d && <HoverCard catalogo={catalogo} />}
        {is3d && <DataInspector catalogo={catalogo} escena={activeScene} />}
        <footer className="intro-footer">
          <p>{reason}</p>
          <p>
            Geometría ilustrativa, no representación de una unidad real.{' '}
            <Link prefetch={false} href="/privacidad">
              Privacidad y alcance de la demo
            </Link>
          </p>
          <button type="button" onClick={() => goTo(0)}>
            Volver al inicio <ArrowDown size={14} className="intro-up" aria-hidden="true" />
          </button>
        </footer>
      </div>
    </IntroMotionContext.Provider>
  );
}
