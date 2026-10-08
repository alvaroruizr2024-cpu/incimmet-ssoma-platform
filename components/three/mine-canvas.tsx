'use client';
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei/core/PerformanceMonitor';
import {
  ACESFilmicToneMapping,
  Color,
  Fog,
  Group,
  Object3D,
  PointLight,
  SpotLight,
  SRGBColorSpace,
} from 'three';
import {
  acentoEscena,
  degradarCalidad,
  perfilCalidad,
  puedeMedirRendimiento,
  realceLlegada,
  type Calidad3D,
  type MotivoFallback3D,
} from '@/lib/domain/cinematica';
import type { ResumenPresentacion } from '@/lib/domain/presentacion';
import { useRelato3D } from '@/store/relato3d';
import { TunnelGeometry } from './tunnel-geometry';
import { CameraRig } from './camera-rig';
import { Atmosphere } from './atmosphere';
import { DataMoments } from './data-moments';
import { AnclasProyectadas } from './anclas-proyectadas';
import { clicTrasArrastre } from './gestos';
const HighBloom = lazy(() => import('./high-bloom'));
const acentoTemporal = new Color();
interface Props {
  active: boolean;
  initialQuality: Calidad3D;
  data: ResumenPresentacion;
  scene: number;
  onFallback: (reason: MotivoFallback3D) => void;
  onQualityChange: (quality: Calidad3D) => void;
  onReady: () => void;
}
function ContextGuard({ onFallback, onReady }: Pick<Props, 'onFallback' | 'onReady'>) {
  const { gl } = useThree();
  const first = useRef(false);
  useFrame(() => {
    if (!first.current) {
      first.current = true;
      onReady();
    }
  });
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => {
      event.preventDefault();
      onFallback('contexto');
    };
    canvas.addEventListener('webglcontextlost', lost);
    canvas.setAttribute('data-renderer', 'incimmet-three');
    return () => canvas.removeEventListener('webglcontextlost', lost);
  }, [gl, onFallback]);
  return null;
}
/** Señalar o fijar un dato pide una ventana breve de render continuo y muestra el cursor de acción. */
function InteraccionBridge({ onMotion }: { onMotion: () => void }) {
  const { gl, invalidate } = useThree();
  useEffect(
    () =>
      useRelato3D.subscribe((estado, previo) => {
        if (estado.hover !== previo.hover)
          gl.domElement.style.cursor = estado.hover ? 'pointer' : '';
        if (
          estado.hover !== previo.hover ||
          estado.seleccion !== previo.seleccion ||
          estado.foco !== previo.foco
        ) {
          onMotion();
          invalidate();
        }
      }),
    [gl, invalidate, onMotion],
  );
  useEffect(
    () => () => {
      gl.domElement.style.cursor = '';
    },
    [gl],
  );
  return null;
}
/** El calentamiento empieza en el primer frame real, no durante la descarga. */
function Warmup({ done }: { done: () => void }) {
  const first = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useFrame(() => {
    if (!first.current) {
      first.current = true;
      timer.current = setTimeout(done, 2200);
    }
  });
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return null;
}
function Lighting({
  timeline,
  punteroRef,
}: {
  timeline: RefObject<number>;
  punteroRef: RefObject<[number, number]>;
}) {
  const group = useRef<Group>(null);
  const light = useRef<PointLight>(null);
  const fog = useRef<Fog>(null);
  const colors = useMemo(
    () => ({
      navy: new Color('#071427'),
      amber: new Color('#42351b'),
      warm: new Color('#9b8773'),
    }),
    [],
  );
  const objetivo = useRef<Object3D>(null);
  const haz = useRef<SpotLight>(null);
  // El objetivo del haz es un objeto propio del grupo; se mueve por frame sin pasar por React.
  useEffect(() => {
    const spot = haz.current,
      blanco = objetivo.current;
    if (spot && blanco) spot.target = blanco;
  }, []);
  useFrame(({ camera, scene }) => {
    const p = timeline.current * 7,
      risk = Math.max(0, 1 - Math.abs(p - 4)),
      exit = Math.max(0, p - 6);
    const acento = acentoEscena(timeline.current);
    const llegada = realceLlegada(timeline.current);
    // El haz de inspección sigue la mano: el puntero fino, o el dedo al arrastrar, orientan la luz.
    const [px, py] = punteroRef.current;
    const blanco = objetivo.current;
    if (blanco) {
      blanco.position.x += (1 + px * 5 - blanco.position.x) * 0.08;
      blanco.position.y += (py * 3 - blanco.position.y) * 0.08;
    }
    if (group.current) {
      group.current.position.copy(camera.position);
      group.current.quaternion.copy(camera.quaternion);
    }
    if (light.current) {
      // La luz de acompañamiento toma el acento de la escena que llega, al ritmo del tramo.
      light.current.color.set(acento.desde).lerp(acentoTemporal.set(acento.hasta), acento.mezcla);
      // Al asentarse la cámara en una escena, su luz se enciende un instante.
      light.current.intensity = 55 + exit * 45 + llegada * 70;
    }
    if (fog.current) {
      fog.current.color
        .copy(colors.navy)
        .lerp(colors.amber, risk * 0.32)
        .lerp(colors.warm, exit * 0.55);
      fog.current.far = 54 + exit * 72;
    }
    if (scene.background instanceof Color && fog.current) scene.background.copy(fog.current.color);
  });
  return (
    <>
      <color attach="background" args={['#071427']} />
      <fog ref={fog} attach="fog" args={['#071427', 8, 54]} />
      <hemisphereLight args={['#c0d5e2', '#393128', 0.9]} />
      <ambientLight intensity={0.2} />
      <group ref={group} name="haz-de-inspeccion">
        <object3D ref={objetivo} position={[1, 0, -16]} name="objetivo-del-haz" />
        <spotLight
          ref={haz}
          position={[0.2, 0.3, -0.3]}
          color="#d9eeff"
          intensity={100}
          distance={40}
          angle={0.52}
          penumbra={0.82}
          decay={2}
          castShadow={false}
        />
        <pointLight
          ref={light}
          position={[2.2, 1.8, -7]}
          color="#6bbbef"
          intensity={55}
          distance={25}
          decay={2}
        />
        <mesh position={[0.2, 0.25, -6.5]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[3.1, 12, 20, 1, true]} />
          <meshBasicMaterial
            color="#a3d9ff"
            transparent
            opacity={0.025}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>
      <pointLight
        position={[1.5, 3, -97]}
        color="#ffd59f"
        intensity={260}
        distance={32}
        decay={2}
      />
    </>
  );
}
/** En reposo el canvas sigue vivo a ritmo bajo: polvo, niebla, luminarias y respiración de cámara. */
function AmbientClock({ activo, fps }: { activo: boolean; fps: number }) {
  const { invalidate } = useThree();
  useEffect(() => {
    if (!activo) return;
    const periodo = 1000 / fps;
    let id = window.setTimeout(function latido() {
      invalidate();
      id = window.setTimeout(latido, periodo);
    }, periodo);
    return () => window.clearTimeout(id);
  }, [activo, fps, invalidate]);
  return null;
}
/** Inactivo: never; arranque/movimiento/balizas/interacción: always; lectura: demand con latido ambiental. */
export default function MineCanvas({
  active,
  initialQuality,
  data,
  scene,
  onFallback,
  onQualityChange,
  onReady,
}: Props) {
  const [quality, setQuality] = useState<Calidad3D>(initialQuality);
  const [moving, setMoving] = useState(false);
  const [warming, setWarming] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDecline = useRef(0);
  const timeline = useRef(0);
  const velocidad = useRef(0);
  const puntero = useRef<[number, number]>([0, 0]);
  const onProgreso = useCallback((p: number) => {
    timeline.current = p;
  }, []);
  const onMotion = useCallback(() => {
    setMoving(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMoving(false), 1600);
  }, []);
  const warmed = useCallback(() => setWarming(false), []);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const decline = useCallback(() => {
    const now = performance.now();
    if (now - lastDecline.current < 7000 || warming) return;
    lastDecline.current = now;
    const next = degradarCalidad(quality);
    if (next === '2d') {
      onFallback('rendimiento');
      return;
    }
    setWarming(true);
    setQuality(next);
    onQualityChange(next);
  }, [quality, warming, onFallback, onQualityChange]);
  const pulse = scene === 4 && quality !== 'baja';
  const busy = active && (warming || moving || pulse);
  const loop = !active ? 'never' : busy ? 'always' : 'demand';
  return (
    <div
      className="intro-canvas"
      data-testid="mine-canvas-root"
      data-quality={quality}
      data-render-loop={loop}
      data-event-lights={data.puntosEventos.length}
      data-action-cards={data.tarjetasAcciones.length}
      data-beacons={data.balizas.length}
    >
      <Canvas
        dpr={[1, Math.min(1.5, perfilCalidad(quality).dprMax)]}
        frameloop={loop}
        shadows={false}
        camera={{ position: [-1.35, 1.9, 5.5], fov: 60, near: 0.1, far: 150 }}
        gl={{
          antialias: initialQuality === 'alta',
          alpha: false,
          powerPreference: initialQuality === 'alta' ? 'high-performance' : 'low-power',
          preserveDrawingBuffer: false,
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.35;
          gl.outputColorSpace = SRGBColorSpace;
        }}
        style={{ touchAction: 'pan-y pinch-zoom' }}
        onPointerMissed={() => {
          if (!clicTrasArrastre()) useRelato3D.getState().seleccionar(null);
        }}
      >
        <ContextGuard onFallback={onFallback} onReady={onReady} />
        <InteraccionBridge onMotion={onMotion} />
        <Warmup key={`warm-${quality}`} done={warmed} />
        <CameraRig
          active={active}
          onMotion={onMotion}
          timeline={timeline}
          onProgreso={onProgreso}
          velocidadRef={velocidad}
          punteroRef={puntero}
        />
        <Lighting timeline={timeline} punteroRef={puntero} />
        <TunnelGeometry quality={quality} />
        <DataMoments data={data} timeline={timeline} pulse={active && pulse} />
        <AnclasProyectadas escena={scene} />
        <AmbientClock activo={active} fps={quality === 'baja' ? 24 : 30} />
        <Atmosphere quality={quality} moving={busy} velocidadRef={velocidad} />
        {quality === 'alta' && (
          <Suspense fallback={null}>
            <HighBloom />
          </Suspense>
        )}
        {puedeMedirRendimiento(active, warming, moving || pulse) && (
          <PerformanceMonitor
            key={quality}
            ms={500}
            iterations={8}
            threshold={0.9}
            factor={1}
            bounds={() => (initialQuality === 'alta' ? [30, 60] : [24, 50])}
            onDecline={decline}
          />
        )}
      </Canvas>
    </div>
  );
}
