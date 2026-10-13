'use client';
import { lazy, Suspense, useEffect, useMemo, useRef, type RefObject } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Fog,
  Group,
  InstancedMesh,
  Mesh,
  Object3D,
  PointLight,
  SRGBColorSpace,
  Vector3,
  type LineBasicMaterial,
  type PerspectiveCamera,
} from 'three';
import { desplazamientoMirada, type Calidad3D } from '@/lib/domain/cinematica';
import {
  INTRO_FIN,
  NUCLEO,
  TRAMO_ORBITA,
  posePropuesta,
  type NodoPropuesta,
} from '@/lib/domain/propuesta';
import { usePropuesta } from '@/store/propuesta';
import { TunnelGeometry } from '../three/tunnel-geometry';
import { Atmosphere } from '../three/atmosphere';
const HighBloom = lazy(() => import('../three/high-bloom'));

interface Props {
  activo: boolean;
  calidad: Extract<Calidad3D, 'alta' | 'equilibrada'>;
  nodos: NodoPropuesta[];
  onListo: () => void;
}

/** Arranque, travelling de entrada y control por desplazamiento con órbita libre al final. */
function Rig({
  activo,
  timelineRef,
  velocidadRef,
}: {
  activo: boolean;
  timelineRef: RefObject<number>;
  velocidadRef: RefObject<number>;
}) {
  const { camera, gl, invalidate } = useThree();
  const look = useRef(new Vector3(0, 2.3, -6));
  const destino = useRef(new Vector3());
  const destinoLook = useRef(new Vector3());
  const puntero = useRef<[number, number]>([0, 0]);
  const libre = useRef({ ox: 0, oy: 0 });
  const orbita = useRef({ actual: 0, destino: 0, giro: 0 });
  const lente = useRef({ fov: 68, progreso: 0 });
  const arrastre = useRef<{ id: number; x: number } | null>(null);
  useEffect(() => {
    if (!activo) return;
    const story = document.getElementById('propuesta-story');
    if (!story) return;
    gsap.registerPlugin(ScrollTrigger);
    let starts: number[] = [];
    let scrollP = 0;
    const intro = { p: 0 };
    const measure = () => {
      starts = Array.from(story.querySelectorAll<HTMLElement>('[data-pp-scene]')).map(
        (el) => el.getBoundingClientRect().top + window.scrollY,
      );
    };
    measure();
    const progresoDocumento = (scrollY: number) => {
      if (starts.length < 2) return 0;
      const first = starts[0] ?? 0;
      if (scrollY <= first) return 0;
      for (let i = 1; i < starts.length; i++) {
        const inicio = starts[i - 1] ?? first;
        const fin = starts[i] ?? inicio;
        if (scrollY < fin) {
          const local = Math.min(1, Math.max(0, (scrollY - inicio) / Math.max(1, fin - inicio)));
          return (i - 1 + local) / (starts.length - 1);
        }
      }
      return 1;
    };
    const aplicar = () => {
      if (document.hidden) return;
      timelineRef.current = Math.max(intro.p, scrollP);
      invalidate();
    };
    const driver = { scroll: window.scrollY };
    const tween = gsap.fromTo(
      driver,
      { scroll: starts[0] ?? 0 },
      {
        scroll: () => starts.at(-1) ?? story.scrollHeight,
        ease: 'none',
        onUpdate: () => {
          scrollP = progresoDocumento(driver.scroll);
          aplicar();
        },
        scrollTrigger: {
          trigger: story,
          start: 'top top',
          end: () => `+=${Math.max(1, (starts.at(-1) ?? 1) - (starts[0] ?? 0))}`,
          scrub: 0.65,
          invalidateOnRefresh: true,
          onRefreshInit: measure,
        },
      },
    );
    // Entrada en escena: la cámara avanza sola hasta INTRO_FIN; el primer gesto de scroll toma el mando.
    const entrada = gsap.to(intro, {
      p: INTRO_FIN,
      duration: 8,
      delay: 2.4,
      ease: 'power2.inOut',
      onUpdate: () => {
        if (scrollP > intro.p) {
          entrada.kill();
          return;
        }
        aplicar();
      },
    });
    let frame = 0;
    const resize = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => tween.scrollTrigger?.refresh());
    });
    resize.observe(story);
    driver.scroll = window.scrollY;
    scrollP = progresoDocumento(driver.scroll);
    aplicar();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      entrada.kill();
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [activo, invalidate, timelineRef]);
  // Mirada libre con puntero fino; en táctil el gesto desplaza el documento.
  useEffect(() => {
    if (!activo) return;
    const fino = window.matchMedia('(hover: hover) and (pointer: fine)');
    const mover = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || !fino.matches) return;
      puntero.current = [
        (event.clientX / window.innerWidth) * 2 - 1,
        1 - (event.clientY / window.innerHeight) * 2,
      ];
      invalidate();
    };
    const soltar = () => {
      puntero.current = [0, 0];
      invalidate();
    };
    window.addEventListener('pointermove', mover, { passive: true });
    document.documentElement.addEventListener('pointerleave', soltar);
    window.addEventListener('blur', soltar);
    return () => {
      window.removeEventListener('pointermove', mover);
      document.documentElement.removeEventListener('pointerleave', soltar);
      window.removeEventListener('blur', soltar);
    };
  }, [activo, invalidate]);
  // Arrastre horizontal sobre el canvas: giro libre de la órbita alrededor del núcleo.
  useEffect(() => {
    if (!activo) return;
    const canvas = gl.domElement;
    const bajar = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      if (timelineRef.current < TRAMO_ORBITA - 0.12) return;
      arrastre.current = { id: event.pointerId, x: event.clientX };
      canvas.setPointerCapture?.(event.pointerId);
    };
    const mover = (event: PointerEvent) => {
      const a = arrastre.current;
      if (!a || a.id !== event.pointerId) return;
      orbita.current.destino += (event.clientX - a.x) * 0.006;
      a.x = event.clientX;
      invalidate();
    };
    const soltar = (event: PointerEvent) => {
      if (arrastre.current?.id === event.pointerId) arrastre.current = null;
    };
    canvas.addEventListener('pointerdown', bajar);
    canvas.addEventListener('pointermove', mover);
    canvas.addEventListener('pointerup', soltar);
    canvas.addEventListener('pointercancel', soltar);
    return () => {
      canvas.removeEventListener('pointerdown', bajar);
      canvas.removeEventListener('pointermove', mover);
      canvas.removeEventListener('pointerup', soltar);
      canvas.removeEventListener('pointercancel', soltar);
    };
  }, [activo, gl, invalidate, timelineRef]);
  useFrame((state, delta) => {
    if (!activo) return;
    const paso = Math.min(delta, 0.05);
    const progreso = timelineRef.current;
    // Autorrotación lenta solo en la sala de datos.
    if (progreso > TRAMO_ORBITA) orbita.current.giro += paso * 0.1;
    const o = orbita.current;
    o.actual += (o.destino - o.actual) * (1 - Math.exp(-6 * paso));
    const pose = posePropuesta(progreso, o.actual + o.giro);
    const mirada = desplazamientoMirada(puntero.current);
    const l = libre.current;
    const suave = 1 - Math.exp(-4 * paso);
    l.ox += (mirada.objetivo[0] - l.ox) * suave;
    l.oy += (mirada.objetivo[1] - l.oy) * suave;
    // Micro-sway de cámara en mano: apenas perceptible, da vida al encuadre.
    const t = state.clock.elapsedTime;
    destino.current.set(
      pose.posicion[0],
      pose.posicion[1] + Math.sin(t * 0.9) * 0.015,
      pose.posicion[2],
    );
    destinoLook.current.set(
      pose.mirada[0] + l.ox * 0.6 + Math.sin(t * 0.6) * 0.03 + Math.sin(t * 1.7) * 0.012,
      pose.mirada[1] + l.oy * 0.6 + Math.cos(t * 0.8) * 0.02,
      pose.mirada[2],
    );
    const alpha = 1 - Math.exp(-8 * paso);
    camera.position.lerp(destino.current, alpha);
    look.current.lerp(destinoLook.current, alpha);
    const k = lente.current;
    k.fov += (pose.fov - k.fov) * alpha;
    velocidadRef.current = Math.abs(progreso - k.progreso) / Math.max(paso, 1 / 240);
    k.progreso = progreso;
    camera.lookAt(look.current);
    const lente3d = state.camera as PerspectiveCamera;
    if (lente3d.isPerspectiveCamera && Math.abs(lente3d.fov - k.fov) > 0.005) {
      lente3d.fov = k.fov;
      lente3d.updateProjectionMatrix();
    }
  });
  return null;
}

/** Luz de corte cinematográfico: haz frío de inspección, contraluz ámbar y núcleo cálido. */
function Iluminacion({ timeline }: { timeline: RefObject<number> }) {
  const group = useRef<Group>(null);
  const light = useRef<PointLight>(null);
  const fog = useRef<Fog>(null);
  const navy = useMemo(() => new Color('#071427'), []);
  const warm = useMemo(() => new Color('#8a7457'), []);
  useFrame(({ camera, scene }) => {
    const p = timeline.current;
    const llegada = Math.min(1, Math.max(0, (p - TRAMO_ORBITA) / (1 - TRAMO_ORBITA)));
    if (group.current) {
      group.current.position.copy(camera.position);
      group.current.quaternion.copy(camera.quaternion);
    }
    if (fog.current) {
      fog.current.color.copy(navy).lerp(warm, llegada * 0.2);
      fog.current.far = 50 + llegada * 60;
      if (scene.background instanceof Color) scene.background.copy(fog.current.color);
    }
    if (light.current) light.current.intensity = 40 + llegada * 35;
  });
  return (
    <>
      <color attach="background" args={['#071427']} />
      <fog ref={fog} attach="fog" args={['#071427', 7, 50]} />
      <hemisphereLight args={['#b8cfe0', '#332c24', 0.85]} />
      <ambientLight intensity={0.18} />
      <group ref={group} name="haz-propuesta">
        <spotLight
          position={[0.2, 0.35, -0.4]}
          color="#d9eeff"
          intensity={110}
          distance={42}
          angle={0.5}
          penumbra={0.85}
          decay={2}
        />
        <pointLight
          ref={light}
          position={[2.1, 1.7, -6.5]}
          color="#6bbbef"
          intensity={40}
          distance={26}
          decay={2}
        />
        <mesh position={[0.2, 0.25, -6.5]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[3.2, 12, 20, 1, true]} />
          <meshBasicMaterial
            color="#a3d9ff"
            transparent
            opacity={0.028}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>
      <pointLight
        position={[NUCLEO.centro[0], NUCLEO.centro[1] + 0.6, NUCLEO.centro[2]]}
        color="#ffd59f"
        intensity={55}
        distance={16}
        decay={2}
      />
    </>
  );
}

/** Constelación de datos interactiva: señalar realza, un clic fija el dato para el panel DOM. */
function Constelacion({
  nodos,
  timeline,
}: {
  nodos: NodoPropuesta[];
  timeline: RefObject<number>;
}) {
  const mesh = useRef<InstancedMesh>(null);
  const halo = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const colores = useMemo(() => nodos.map((n) => new Color(n.color)), [nodos]);
  useEffect(() => {
    const m = mesh.current;
    const h = halo.current;
    if (!m || !h) return;
    nodos.forEach((_, i) => {
      const color = colores[i] ?? new Color('#ffffff');
      m.setColorAt(i, color);
      h.setColorAt(i, color);
    });
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    if (h.instanceColor) h.instanceColor.needsUpdate = true;
  }, [nodos, colores]);
  useEffect(
    () => () => {
      mesh.current?.dispose();
      halo.current?.dispose();
    },
    [],
  );
  useFrame(({ clock }) => {
    const m = mesh.current;
    const h = halo.current;
    if (!m || !h) return;
    const t = clock.elapsedTime;
    const p = timeline.current;
    const presencia = Math.min(1, Math.max(0, (p - (TRAMO_ORBITA - 0.14)) / 0.12));
    const ensamblaje = presencia * presencia * (3 - 2 * presencia);
    const estado = usePropuesta.getState();
    nodos.forEach((n, i) => {
      const flote = Math.sin(t * 0.9 + i * 1.37) * 0.06;
      const pulso = n.tipo === 'baliza' ? 1 + Math.sin(t * 2.2 + i) * 0.12 : 1;
      const realce = estado.hover === n.clave || estado.seleccion === n.clave ? 1.4 : 1;
      const escala = n.radio * pulso * realce * ensamblaje;
      dummy.position.set(n.posicion[0], n.posicion[1] + flote, n.posicion[2]);
      dummy.scale.setScalar(escala);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      dummy.scale.setScalar(escala * 2.1);
      dummy.updateMatrix();
      h.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
    h.instanceMatrix.needsUpdate = true;
  });
  const claveDe = (event: ThreeEvent<PointerEvent> | ThreeEvent<MouseEvent>) => {
    const i = event.instanceId;
    return i === undefined ? null : (nodos[i]?.clave ?? null);
  };
  return (
    <>
      <instancedMesh ref={halo} args={[undefined, undefined, nodos.length]} frustumCulled={false}>
        <sphereGeometry args={[1, 14, 10]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.14}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>
      <instancedMesh
        ref={mesh}
        args={[undefined, undefined, nodos.length]}
        frustumCulled={false}
        onPointerMove={(event) => {
          event.stopPropagation();
          usePropuesta.getState().fijarHover(claveDe(event));
        }}
        onPointerLeave={() => usePropuesta.getState().fijarHover(null)}
        onClick={(event) => {
          event.stopPropagation();
          const clave = claveDe(event);
          usePropuesta.getState().seleccionar(clave);
        }}
      >
        <sphereGeometry args={[1, 20, 14]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </instancedMesh>
    </>
  );
}

/** Hilos de luz que unen cada dato con el núcleo; se encienden con la presencia de la sala. */
function Enlaces({ nodos, timeline }: { nodos: NodoPropuesta[]; timeline: RefObject<number> }) {
  const geometria = useMemo(() => {
    const posiciones: number[] = [];
    nodos.forEach((n) => {
      if (n.tipo === 'cierre') return;
      posiciones.push(NUCLEO.centro[0], NUCLEO.centro[1], NUCLEO.centro[2], ...n.posicion);
    });
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(posiciones, 3));
    return g;
  }, [nodos]);
  useEffect(() => () => geometria.dispose(), [geometria]);
  const material = useRef<LineBasicMaterial>(null);
  useFrame(() => {
    const p = timeline.current;
    const presencia = Math.min(1, Math.max(0, (p - (TRAMO_ORBITA - 0.14)) / 0.12));
    if (material.current) material.current.opacity = 0.2 * presencia;
  });
  return (
    <lineSegments geometry={geometria}>
      <lineBasicMaterial
        ref={material}
        color="#52d0ff"
        transparent
        opacity={0}
        depthWrite={false}
      />
    </lineSegments>
  );
}

/** Anillos orbitales del núcleo: giro lento y continuo, con brillo para el bloom. */
function Anillos() {
  const verde = useRef<Mesh>(null);
  const ambar = useRef<Mesh>(null);
  useFrame((_, delta) => {
    const paso = Math.min(delta, 0.05);
    if (verde.current) verde.current.rotation.z += paso * 0.12;
    if (ambar.current) ambar.current.rotation.z -= paso * 0.18;
  });
  return (
    <group position={[...NUCLEO.centro]}>
      <mesh ref={verde} rotation={[Math.PI / 2.15, 0, 0]}>
        <torusGeometry args={[2.35, 0.014, 8, 96]} />
        <meshBasicMaterial color="#2fa385" transparent opacity={0.55} toneMapped={false} />
      </mesh>
      <mesh ref={ambar} rotation={[Math.PI / 1.85, 0.35, 0]}>
        <torusGeometry args={[1.55, 0.012, 8, 80]} />
        <meshBasicMaterial color="#ffc000" transparent opacity={0.4} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Listo({ onListo }: { onListo: () => void }) {
  const primero = useRef(false);
  useFrame(() => {
    if (!primero.current) {
      primero.current = true;
      onListo();
    }
  });
  return null;
}

/** Cursor de acción al señalar un dato. */
function CursorBridge() {
  const { gl } = useThree();
  useEffect(
    () =>
      usePropuesta.subscribe((estado, previo) => {
        if (estado.hover !== previo.hover)
          gl.domElement.style.cursor = estado.hover ? 'pointer' : '';
      }),
    [gl],
  );
  useEffect(
    () => () => {
      gl.domElement.style.cursor = '';
    },
    [gl],
  );
  return null;
}

export default function PropuestaCanvas({ activo, calidad, nodos, onListo }: Props) {
  const timelineRef = useRef(0);
  const velocidadRef = useRef(0);
  return (
    <div className="pp-canvas" data-testid="propuesta-canvas-root" data-nodos={nodos.length}>
      <Canvas
        dpr={[1, calidad === 'alta' ? 1.5 : 1.2]}
        frameloop={activo ? 'always' : 'never'}
        shadows={false}
        camera={{ position: [0, 2.3, 17], fov: 68, near: 0.1, far: 170 }}
        gl={{
          antialias: calidad === 'alta',
          alpha: false,
          powerPreference: calidad === 'alta' ? 'high-performance' : 'low-power',
          preserveDrawingBuffer: false,
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.18;
          gl.outputColorSpace = SRGBColorSpace;
          gl.domElement.setAttribute('data-renderer', 'incimmet-propuesta');
        }}
        onPointerMissed={() => usePropuesta.getState().seleccionar(null)}
      >
        <Listo onListo={onListo} />
        <CursorBridge />
        <Rig activo={activo} timelineRef={timelineRef} velocidadRef={velocidadRef} />
        <Iluminacion timeline={timelineRef} />
        <TunnelGeometry quality={calidad} />
        <Constelacion nodos={nodos} timeline={timelineRef} />
        <Enlaces nodos={nodos} timeline={timelineRef} />
        <Anillos />
        <Atmosphere quality={calidad} moving={activo} velocidadRef={velocidadRef} />
        {calidad === 'alta' && (
          <Suspense fallback={null}>
            <HighBloom />
          </Suspense>
        )}
      </Canvas>
    </div>
  );
}
