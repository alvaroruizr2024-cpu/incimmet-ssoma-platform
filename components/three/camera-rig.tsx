'use client';
import { useEffect, useRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Vector3, type PerspectiveCamera } from 'three';
import {
  desplazamientoMirada,
  opticaCamara,
  poseCamara,
  progresoNarrativo,
  velocidadNarrativa,
} from '@/lib/domain/cinematica';
import { useRelato3D } from '@/store/relato3d';

/** Documento nativo: scrub suaviza la cámara, nunca captura el desplazamiento. */
export function CameraRig({
  active,
  onMotion,
  timeline,
  onProgreso,
  velocidadRef,
}: {
  active: boolean;
  onMotion: () => void;
  timeline: RefObject<number>;
  onProgreso: (p: number) => void;
  velocidadRef: RefObject<number>;
}) {
  const { camera, invalidate, events, gl } = useThree();
  const sobreCanvas = useRef(false);
  const look = useRef(new Vector3(0.5, 2.6, -5));
  const position = useRef(new Vector3());
  const target = useRef(new Vector3());
  const foco = useRef(new Vector3());
  const puntero = useRef<[number, number]>([0, 0]);
  const libre = useRef({ ox: 0, oy: 0, px: 0, py: 0 });
  const lente = useRef({ fov: 60, balanceo: 0, progreso: 0, velocidad: 0 });
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
  // Mirada libre solo con puntero fino: el tacto desplaza el documento y no gira la cámara.
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
    const progreso = timeline.current;
    const pose = poseCamara(progreso);
    const optica = opticaCamara(progreso);
    const mirada = desplazamientoMirada(puntero.current);
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
    position.current.set(pose.posicion[0] + l.px, pose.posicion[1] + l.py, pose.posicion[2]);
    target.current.set(pose.mirada[0] + l.ox, pose.mirada[1] + l.oy, pose.mirada[2]);
    const fijado = useRelato3D.getState().foco;
    if (fijado) {
      foco.current.set(fijado[0], fijado[1], fijado[2]);
      target.current.lerp(foco.current, 0.18);
    }
    const alpha = 1 - Math.exp(-10 * paso);
    camera.position.lerp(position.current, alpha);
    look.current.lerp(target.current, alpha);
    k.fov += (optica.fov - k.fov) * alpha;
    k.balanceo += (optica.balanceo - k.balanceo) * alpha;
    camera.lookAt(look.current);
    camera.rotateZ(k.balanceo);
    const lente3d = state.camera as PerspectiveCamera;
    if (lente3d.isPerspectiveCamera && Math.abs(lente3d.fov - k.fov) > 0.005) {
      lente3d.fov = k.fov;
      lente3d.updateProjectionMatrix();
    }
    if (
      camera.position.distanceToSquared(position.current) > 0.00001 ||
      look.current.distanceToSquared(target.current) > 0.00001 ||
      Math.abs(optica.fov - k.fov) > 0.01 ||
      Math.abs(optica.balanceo - k.balanceo) > 0.0005 ||
      k.velocidad > 0.01
    ) {
      invalidate();
      // La cámara se movió sin evento de puntero: se vuelve a trazar el hover para que realce y clic coincidan.
      if (sobreCanvas.current) events.update?.();
    }
  });
  return null;
}
