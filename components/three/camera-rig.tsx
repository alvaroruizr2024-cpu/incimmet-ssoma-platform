'use client';
import { useEffect, useRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Spherical, Vector3, type PerspectiveCamera } from 'three';
import {
  aperturaCamara,
  desplazamientoMirada,
  giroDesdeArrastre,
  giroHaciaReposo,
  opticaCamara,
  poseCamara,
  progresoNarrativo,
  respiracionCamara,
  velocidadNarrativa,
  type Giro,
} from '@/lib/domain/cinematica';
import { useRelato3D } from '@/store/relato3d';
import { gestos } from './gestos';

export const EXPOSICION_BASE = 1.35;

/** Documento nativo: scrub suaviza la cámara, nunca captura el desplazamiento. */
export function CameraRig({
  active,
  onMotion,
  timeline,
  onProgreso,
  velocidadRef,
  punteroRef,
}: {
  active: boolean;
  onMotion: () => void;
  timeline: RefObject<number>;
  onProgreso: (p: number) => void;
  velocidadRef: RefObject<number>;
  punteroRef: RefObject<[number, number]>;
}) {
  const { camera, invalidate, events, gl } = useThree();
  const sobreCanvas = useRef(false);
  const look = useRef(new Vector3(0.5, 2.6, -5));
  const position = useRef(new Vector3());
  const target = useRef(new Vector3());
  const foco = useRef(new Vector3());
  const direccion = useRef(new Vector3());
  const esferica = useRef(new Spherical());
  const puntero = useRef<[number, number]>([0, 0]);
  const libre = useRef({ ox: 0, oy: 0, px: 0, py: 0 });
  const giro = useRef<Giro>({ yaw: 0, pitch: 0 });
  const giroSuave = useRef<Giro>({ yaw: 0, pitch: 0 });
  const arrastre = useRef({ activo: false, x: 0, y: 0, recorrido: 0 });
  const lente = useRef({ fov: 60, balanceo: 0, progreso: 0, velocidad: 0 });
  const apertura = useRef({ inicio: -1 });
  useEffect(() => {
    if (!active) return;
    const story = document.getElementById('cinematic-story');
    if (!story) return;
    gsap.registerPlugin(ScrollTrigger);
    let starts: number[] = [];
    const driver = { scroll: window.scrollY };
    const measure = () => {
      starts = Array.from(story.querySelectorAll<HTMLElement>('[data-intro-scene]')).map(
        (el) => el.getBoundingClientRect().top + window.scrollY,
      );
    };
    measure();
    const update = () => {
      if (document.hidden) return;
      onProgreso(progresoNarrativo(driver.scroll, starts));
      invalidate();
      onMotion();
    };
    const tween = gsap.fromTo(
      driver,
      { scroll: starts[0] ?? 0 },
      {
        scroll: () => starts.at(-1) ?? story.scrollHeight,
        ease: 'none',
        onUpdate: update,
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
    let frame = 0;
    const resize = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => tween.scrollTrigger?.refresh());
    });
    resize.observe(story);
    driver.scroll = window.scrollY;
    update();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [active, camera, invalidate, onMotion, onProgreso]);
  // Mirada libre solo con puntero fino: el tacto desplaza el documento y gira la cámara al arrastrar.
  useEffect(() => {
    if (!active) return;
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
  }, [active, invalidate]);
  // Arrastre sobre el canvas (ratón o dedo): gira la mirada; el desplazamiento vertical táctil sigue siendo del documento.
  useEffect(() => {
    if (!active) return;
    const canvas = gl.domElement;
    const bajar = (event: PointerEvent) => {
      if (event.button !== 0) return;
      arrastre.current = { activo: true, x: event.clientX, y: event.clientY, recorrido: 0 };
      gestos.arrastrando = true;
      gestos.distancia = 0;
      try {
        canvas.setPointerCapture(event.pointerId);
      } catch {
        // Sin captura, el arrastre termina al salir del canvas.
      }
    };
    const mover = (event: PointerEvent) => {
      const a = arrastre.current;
      if (!a.activo) return;
      const dx = event.clientX - a.x,
        dy = event.clientY - a.y;
      a.x = event.clientX;
      a.y = event.clientY;
      a.recorrido += Math.hypot(dx, dy);
      gestos.distancia = a.recorrido;
      if (a.recorrido > 6) canvas.style.cursor = 'grabbing';
      giro.current = giroDesdeArrastre(giro.current, dx, dy, window.innerWidth);
      if (event.pointerType === 'touch')
        puntero.current = [
          (event.clientX / window.innerWidth) * 2 - 1,
          1 - (event.clientY / window.innerHeight) * 2,
        ];
      onMotion();
      invalidate();
    };
    const soltar = (event: PointerEvent) => {
      const a = arrastre.current;
      if (!a.activo) return;
      a.activo = false;
      gestos.arrastrando = false;
      gestos.fin = performance.now();
      canvas.style.cursor = '';
      if (event.pointerType === 'touch') puntero.current = [0, 0];
      try {
        canvas.releasePointerCapture(event.pointerId);
      } catch {
        // Ya liberado.
      }
      invalidate();
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
      canvas.style.cursor = '';
      gestos.arrastrando = false;
    };
  }, [active, gl, invalidate, onMotion]);
  // El hover solo se refresca por frame mientras el puntero está sobre el canvas; fuera, nunca se reinyecta.
  useEffect(() => {
    const canvas = gl.domElement;
    const entrar = () => {
      sobreCanvas.current = true;
    };
    const salir = () => {
      sobreCanvas.current = false;
    };
    canvas.addEventListener('pointerenter', entrar);
    canvas.addEventListener('pointerleave', salir);
    return () => {
      canvas.removeEventListener('pointerenter', entrar);
      canvas.removeEventListener('pointerleave', salir);
    };
  }, [gl]);
  useFrame((state, delta) => {
    if (!active) return;
    const paso = Math.min(delta, 0.05);
    const ahora = state.clock.elapsedTime;
    const primera = apertura.current.inicio < 0;
    if (primera) apertura.current.inicio = ahora;
    const entrada = aperturaCamara(ahora - apertura.current.inicio);
    const progreso = timeline.current;
    const pose = poseCamara(progreso);
    const optica = opticaCamara(progreso);
    const arrastrando = arrastre.current.activo;
    const mirada = desplazamientoMirada(puntero.current, !arrastrando);
    const l = libre.current,
      k = lente.current;
    // Velocidad suavizada para polvo y niebla; decae sola cuando el documento se detiene.
    const instantanea = velocidadNarrativa(k.progreso, progreso, paso);
    k.progreso = progreso;
    k.velocidad += (instantanea - k.velocidad) * (1 - Math.exp(-3 * paso));
    velocidadRef.current = k.velocidad;
    const suave = 1 - Math.exp(-4 * paso);
    l.ox += (mirada.objetivo[0] - l.ox) * suave;
    l.oy += (mirada.objetivo[1] - l.oy) * suave;
    l.px += (mirada.posicion[0] - l.px) * suave;
    l.py += (mirada.posicion[1] - l.py) * suave;
    const respiro = respiracionCamara(ahora);
    position.current.set(
      pose.posicion[0] + l.px + respiro.x,
      pose.posicion[1] + l.py + respiro.y,
      pose.posicion[2],
    );
    target.current.set(pose.mirada[0] + l.ox, pose.mirada[1] + l.oy, pose.mirada[2]);
    const fijado = useRelato3D.getState().foco;
    if (fijado) {
      foco.current.set(fijado[0], fijado[1], fijado[2]);
      target.current.lerp(foco.current, 0.18);
    }
    // Giro por arrastre: sigue la mano mientras dura y vuelve al encuadre al soltar.
    if (!arrastrando) giro.current = giroHaciaReposo(giro.current, paso);
    const g = giroSuave.current,
      objetivoGiro = giro.current;
    const kGiro = 1 - Math.exp(-12 * paso);
    g.yaw += (objetivoGiro.yaw - g.yaw) * kGiro;
    g.pitch += (objetivoGiro.pitch - g.pitch) * kGiro;
    if (Math.abs(g.yaw) > 1e-4 || Math.abs(g.pitch) > 1e-4) {
      direccion.current.subVectors(target.current, position.current);
      const esf = esferica.current.setFromVector3(direccion.current);
      esf.theta += g.yaw;
      esf.phi = Math.min(Math.PI - 0.25, Math.max(0.25, esf.phi - g.pitch));
      direccion.current.setFromSpherical(esf);
      target.current.copy(position.current).add(direccion.current);
    }
    // Apertura: la cámara llega desde atrás y más baja mientras la exposición sube desde el negro.
    if (!entrada.terminada) {
      direccion.current.subVectors(target.current, position.current).normalize();
      position.current.addScaledVector(direccion.current, -entrada.retroceso);
      position.current.y -= entrada.descenso;
    }
    const exposicion = EXPOSICION_BASE * entrada.exposicion;
    const render = state.gl;
    if (Math.abs(render.toneMappingExposure - exposicion) > 0.0005)
      render.toneMappingExposure = exposicion;
    const alpha = primera ? 1 : 1 - Math.exp(-10 * paso);
    camera.position.lerp(position.current, alpha);
    look.current.lerp(target.current, alpha);
    k.fov += (optica.fov + entrada.fovExtra - k.fov) * alpha;
    k.balanceo += (optica.balanceo - k.balanceo) * alpha;
    camera.lookAt(look.current);
    camera.rotateZ(k.balanceo + respiro.giro);
    const lente3d = state.camera as PerspectiveCamera;
    if (lente3d.isPerspectiveCamera && Math.abs(lente3d.fov - k.fov) > 0.005) {
      lente3d.fov = k.fov;
      lente3d.updateProjectionMatrix();
    }
    const p = punteroRef.current;
    p[0] = puntero.current[0];
    p[1] = puntero.current[1];
    if (
      !entrada.terminada ||
      arrastrando ||
      camera.position.distanceToSquared(position.current) > 0.00001 ||
      look.current.distanceToSquared(target.current) > 0.00001 ||
      Math.abs(optica.fov + entrada.fovExtra - k.fov) > 0.01 ||
      Math.abs(optica.balanceo - k.balanceo) > 0.0005 ||
      Math.abs(objetivoGiro.yaw - g.yaw) > 0.0005 ||
      Math.abs(objetivoGiro.pitch - g.pitch) > 0.0005 ||
      k.velocidad > 0.01
    ) {
      invalidate();
      // La cámara se movió sin evento de puntero: se vuelve a trazar el hover para que realce y clic coincidan.
      if (sobreCanvas.current) events.update?.();
    }
  });
  return null;
}
