'use client';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import {
  CanvasTexture,
  Color,
  Group,
  InstancedMesh,
  Matrix4,
  Object3D,
  SRGBColorSpace,
  Vector3,
  type Mesh,
} from 'three';
import { formatoNarrativo, type ResumenPresentacion } from '@/lib/domain/presentacion';
import {
  lucesEventos,
  tarjetasEvidencia,
  estacionesProyectos,
  panelesIndicadores,
  type InstanciaDato,
} from '@/lib/domain/momentos3d';
import { acotar, presenciaMomento, type Vec3 } from '@/lib/domain/cinematica';
import { mismaReferencia, type ReferenciaDato, type TipoDato } from '@/lib/domain/interactivos3d';
import { useRelato3D } from '@/store/relato3d';
import { Halo } from './halo';
import { claveAncla, claveMomento, registrarObjeto } from './anclas';
import { Marcador } from './marker';

// Auxiliares del módulo: evitan asignar objetos por frame; nunca se entregan a React.
const auxiliar = new Object3D();
const tono = new Color();
const blanco = new Color('#ffffff');
const matriz = new Matrix4();
const mundo = new Vector3();
const referencia = (tipo: TipoDato, clave: string, escena: number): ReferenciaDato => ({
  tipo,
  clave,
  escena,
});

/** Instancias de datos: se encienden de forma escalonada con la presencia y realzan el dato señalado o fijado. */
function Glyphs({
  datos,
  esfera = false,
  emisivo = false,
  nombre,
  tipo,
  escena,
  presenciaRef,
}: {
  datos: readonly InstanciaDato[];
  esfera?: boolean;
  emisivo?: boolean;
  nombre: string;
  tipo: TipoDato;
  escena: number;
  presenciaRef: RefObject<number>;
}) {
  const ref = useRef<InstancedMesh>(null);
  const estado = useRef({ presencia: -1, hover: '', seleccion: '' });
  const aplicar = useCallback(
    (p: number, hover: string, seleccion: string) => {
      const mesh = ref.current;
      if (!mesh) return;
      const ultimo = Math.max(1, datos.length - 1);
      datos.forEach((d, i) => {
        const umbral = (i / ultimo) * 0.6;
        const local = acotar((p - umbral) / Math.max(0.0001, 1 - umbral));
        const aparicion = local * local * (3 - 2 * local);
        const realce = d.id === seleccion ? 2.2 : d.id === hover ? 1.7 : 1;
        const factor = Math.max(0.0001, aparicion) * realce;
        auxiliar.position.set(...d.posicion);
        auxiliar.scale.set(d.escala[0] * factor, d.escala[1] * factor, d.escala[2] * factor);
        auxiliar.rotation.set(...(d.rotacion ?? [0, 0, 0]));
        auxiliar.updateMatrix();
        mesh.setMatrixAt(i, auxiliar.matrix);
        tono.set(d.color).multiplyScalar(emisivo ? (d.intensidad ?? 1) : 1);
        if (realce > 1) tono.lerp(blanco, 0.5);
        mesh.setColorAt(i, tono);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    },
    [datos, emisivo],
  );
  useLayoutEffect(() => {
    aplicar(1, '', '');
    estado.current = { presencia: 1, hover: '', seleccion: '' };
  }, [aplicar]);
  useFrame(() => {
    const { hover, seleccion, foco, fijarFoco } = useRelato3D.getState();
    const h = hover?.tipo === tipo ? hover.clave : '';
    const s = seleccion?.tipo === tipo ? seleccion.clave : '';
    const mesh = ref.current;
    if (s && !foco && mesh) {
      const i = datos.findIndex((d) => d.id === s);
      if (i >= 0) {
        mesh.getMatrixAt(i, matriz);
        mundo.setFromMatrixPosition(matriz);
        mesh.localToWorld(mundo);
        fijarFoco([mundo.x, mundo.y, mundo.z]);
      }
    }
    const p = presenciaRef.current,
      e = estado.current;
    if (Math.abs(e.presencia - p) < 0.002 && e.hover === h && e.seleccion === s) return;
    estado.current = { presencia: p, hover: h, seleccion: s };
    aplicar(p, h, s);
  });
  const senalar = (event: ThreeEvent<PointerEvent>) => {
    if (event.instanceId === undefined) return;
    event.stopPropagation();
    const d = datos[event.instanceId];
    if (d) useRelato3D.getState().fijarHover(referencia(tipo, d.id, escena));
  };
  const soltar = () => {
    const actual = useRelato3D.getState();
    if (actual.hover?.tipo === tipo) actual.fijarHover(null);
  };
  const fijar = (event: ThreeEvent<MouseEvent>) => {
    const mesh = ref.current;
    if (event.instanceId === undefined || !mesh || event.delta > 6) return;
    event.stopPropagation();
    const d = datos[event.instanceId];
    if (!d) return;
    mesh.getMatrixAt(event.instanceId, matriz);
    mundo.setFromMatrixPosition(matriz);
    mesh.localToWorld(mundo);
    useRelato3D.getState().seleccionar(referencia(tipo, d.id, escena), [mundo.x, mundo.y, mundo.z]);
  };
  if (!datos.length) return null;
  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, datos.length]}
      name={nombre}
      frustumCulled={false}
      onPointerMove={senalar}
      onPointerOut={soltar}
      onClick={fijar}
    >
      {esfera ? <sphereGeometry args={[1, 8, 6]} /> : <boxGeometry args={[1, 1, 1]} />}
      {emisivo ? (
        <meshBasicMaterial toneMapped={false} />
      ) : (
        <meshStandardMaterial roughness={0.6} metalness={0.2} />
      )}
    </instancedMesh>
  );
}
/** Texturas locales, sin fuentes remotas ni texto renderizado en un servicio externo. */
function Label({
  titulo,
  valor = '',
  detalle = '',
  position = [0, 0, 0],
  width = 1.2,
  height = 0.65,
}: {
  titulo: string;
  valor?: string;
  detalle?: string;
  position?: Vec3;
  width?: number;
  height?: number;
}) {
  const { gl, size } = useThree();
  const showLabels = size.width >= 768;
  const texture = useMemo(() => {
    if (!showLabels) return null;
    const canvas = document.createElement('canvas');
    canvas.width = 1536;
    canvas.height = 768;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo dibujar el rótulo 3D');
    ctx.scale(2, 2);
    ctx.fillStyle = '#0C1931';
    ctx.fillRect(0, 0, 768, 384);
    ctx.strokeStyle = '#1D7DCC';
    ctx.lineWidth = 5;
    ctx.strokeRect(5, 5, 758, 374);
    ctx.fillStyle = '#E7F3FF';
    ctx.font = 'bold 34px Arial';
    ctx.fillText(titulo, 35, 64, 698);
    ctx.fillStyle = '#52D0FF';
    ctx.font = 'bold 116px Arial';
    ctx.fillText(valor, 35, 220, 698);
    ctx.fillStyle = '#B9CBE0';
    ctx.font = '29px Arial';
    const palabras = detalle.split(' ');
    let fila = '',
      y = 287;
    for (const palabra of palabras) {
      const proxima = fila ? `${fila} ${palabra}` : palabra;
      if (ctx.measureText(proxima).width > 698 && fila) {
        ctx.fillText(fila, 35, y);
        fila = palabra;
        y += 40;
      } else fila = proxima;
    }
    if (fila) ctx.fillText(fila, 35, y, 698);
    const tx = new CanvasTexture(canvas);
    tx.colorSpace = SRGBColorSpace;
    tx.anisotropy = gl.capabilities.getMaxAnisotropy();
    return tx;
  }, [titulo, valor, detalle, gl, showLabels]);
  useEffect(() => () => texture?.dispose(), [texture]);
  if (!texture) return null;
  return (
    <mesh position={position} name={`rotulo-${titulo}`}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}
function Portal({
  width = 1.1,
  height = 2.3,
  color = '#1D7DCC',
}: {
  width?: number;
  height?: number;
  color?: string;
}) {
  return (
    <group>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[(side * width) / 2, height / 2, 0]}>
          <boxGeometry args={[0.09, height, 0.1]} />
          <meshStandardMaterial color="#273D55" metalness={0.8} roughness={0.35} />
        </mesh>
      ))}
      <mesh position={[0, height, 0]}>
        <boxGeometry args={[width + 0.09, 0.09, 0.12]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.7}
          toneMapped={false}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0.1]}>
        <planeGeometry args={[width, 0.8]} />
        <meshStandardMaterial color="#253650" roughness={0.5} metalness={0.4} />
      </mesh>
    </group>
  );
}
/** Envuelve una instalación: señalarla la realza, un clic la fija; el realce solo pide frames mientras cambia. */
function Hotspot({
  dato,
  realce,
  children,
  marcador = true,
  indice = 0,
}: {
  dato: ReferenciaDato;
  realce: { ancho: number; alto: number; posicion: Vec3; color?: string };
  children: ReactNode;
  marcador?: boolean;
  indice?: number;
}) {
  const grupo = useRef<Group>(null);
  const nivel = useRef(0);
  const { invalidate } = useThree();
  const { tipo, clave, escena } = dato;
  // El botón DOM de este dato se proyecta desde el grupo; se da de baja al desmontar.
  useEffect(() => {
    const g = grupo.current;
    if (!g) return;
    return registrarObjeto(claveAncla({ tipo, clave, escena }), g);
  }, [tipo, clave, escena]);
  useFrame((_state, delta) => {
    const { hover, seleccion, foco, fijarFoco } = useRelato3D.getState();
    const elegido = mismaReferencia(seleccion, dato);
    const g = grupo.current;
    if (elegido && !foco && g) {
      g.getWorldPosition(mundo);
      fijarFoco([mundo.x, mundo.y, mundo.z]);
    }
    const objetivo = elegido ? 1 : mismaReferencia(hover, dato) ? 0.55 : 0;
    const actual = nivel.current;
    if (Math.abs(objetivo - actual) < 0.001) {
      if (actual !== objetivo) {
        nivel.current = objetivo;
        invalidate();
      }
      return;
    }
    nivel.current = actual + (objetivo - actual) * (1 - Math.exp(-9 * Math.min(delta, 0.05)));
    g?.scale.setScalar(1 + nivel.current * 0.025);
    invalidate();
  });
  const senalar = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    useRelato3D.getState().fijarHover(dato);
  };
  const soltar = () => {
    const actual = useRelato3D.getState();
    if (mismaReferencia(actual.hover, dato)) actual.fijarHover(null);
  };
  const fijar = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    // Soltar tras arrastrar la mirada no fija el dato.
    if (event.delta > 6) return;
    const g = grupo.current;
    if (!g) return;
    g.getWorldPosition(mundo);
    useRelato3D.getState().seleccionar(dato, [mundo.x, mundo.y, mundo.z]);
  };
  return (
    <group
      ref={grupo}
      name={`dato-${dato.tipo}-${dato.clave}`}
      onPointerOver={senalar}
      onPointerOut={soltar}
      onClick={fijar}
    >
      {children}
      <Halo {...realce} nivel={nivel} />
      {marcador && (
        <Marcador
          posicion={[
            realce.posicion[0],
            realce.posicion[1] + Math.min(realce.alto / 2 + 0.16, 2.2),
            realce.posicion[2] + 0.35,
          ]}
          color={realce.color ?? '#62cdff'}
          indice={indice}
          nivelRef={nivel}
        />
      )}
    </group>
  );
}
function Beacon({
  position,
  id,
  index,
  pulse,
  dato,
}: {
  position: Vec3;
  id: string;
  index: number;
  pulse: boolean;
  dato: ReferenciaDato;
}) {
  const tip = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (!pulse || !tip.current) return;
    const scale = 1 + Math.sin(clock.elapsedTime * 1.6 + index * 0.25) * 0.12;
    tip.current.scale.setScalar(scale);
  });
  return (
    <group position={position} name={`baliza-${id}`}>
      <Hotspot
        dato={dato}
        indice={index}
        realce={{ ancho: 0.95, alto: 1.8, posicion: [0, 0.85, -0.3], color: '#FFC000' }}
      >
        <mesh position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.06, 0.09, 1.1, 10]} />
          <meshStandardMaterial color="#263749" roughness={0.7} metalness={0.5} />
        </mesh>
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.22, 0.28, 0.16, 14]} />
          <meshStandardMaterial color="#151F44" roughness={0.7} />
        </mesh>
        <mesh ref={tip} position={[0, 1.25, 0]}>
          <sphereGeometry args={[0.16, 14, 10]} />
          <meshBasicMaterial color="#FFC000" toneMapped={false} />
        </mesh>
        <mesh position={[0, 1.07, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.26, 12]} />
          <meshStandardMaterial color="#FFC000" emissive="#FFC000" emissiveIntensity={1.4} />
        </mesh>
        <Label
          titulo={id}
          detalle="Alto potencial documentado"
          position={[0, 0.8, 0.16]}
          width={0.58}
          height={0.3}
        />
      </Hotspot>
    </group>
  );
}
function CieloSalida() {
  return (
    <mesh position={[0, 3, -14]}>
      <planeGeometry args={[35, 22]} />
      <shaderMaterial
        toneMapped={false}
        uniforms={{}}
        vertexShader={`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
        fragmentShader={`varying vec2 vUv; void main(){vec3 sky=mix(vec3(.98,.76,.46),vec3(.22,.56,.83),smoothstep(.2,.9,vUv.y));float sun=exp(-length((vUv-vec2(.61,.61))*vec2(1.6,1.))*18.);gl_FragColor=vec4(sky+vec3(1.,.85,.56)*sun*1.6,1.);}`}
      />
    </mesh>
  );
}
/** Cada instalación aparece por presencia: visible dentro de la ventana y, si se ensambla, crece con el progreso. */
function Momento({
  indice,
  timeline,
  children,
  position = [0, 0, 0],
  name,
  ensamblar = true,
  presenciaRef,
}: {
  indice: number;
  timeline: RefObject<number>;
  children: ReactNode;
  position?: Vec3;
  name: string;
  ensamblar?: boolean;
  presenciaRef?: RefObject<number>;
}) {
  const ref = useRef<Group>(null);
  const estado = useRef({ visible: true, escala: -1 });
  // La instalación completa también es un ancla: las escenas con cientos de instancias usan un solo botón.
  useEffect(() => {
    const g = ref.current;
    if (!g) return;
    return registrarObjeto(claveMomento(indice), g);
  }, [indice]);
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const p = presenciaMomento(indice, timeline.current);
    if (presenciaRef) presenciaRef.current = p;
    const e = estado.current,
      visible = p > 0;
    if (visible !== e.visible) {
      e.visible = visible;
      g.visible = visible;
      // Fuera de la ventana tampoco recibe el puntero: la capa 1 no se traza ni se dibuja.
      g.traverse((objeto) => objeto.layers.set(visible ? 0 : 1));
    }
    if (ensamblar && visible && Math.abs(p - e.escala) > 0.001) {
      e.escala = p;
      g.scale.setScalar(Math.max(0.001, p));
    }
  });
  return (
    <group ref={ref} position={position} name={name}>
      {children}
    </group>
  );
}
export function DataMoments({
  data,
  timeline,
  pulse,
}: {
  data: ResumenPresentacion;
  timeline: RefObject<number>;
  pulse: boolean;
}) {
  const puntos = useMemo(() => lucesEventos(data), [data]);
  const tarjetas = useMemo(() => tarjetasEvidencia(data), [data]);
  const estaciones = useMemo(() => estacionesProyectos(data), [data]);
  const indicadores = useMemo(() => panelesIndicadores(data), [data]);
  const cerradas = useMemo(
    () => tarjetas.filter((x) => data.tarjetasAcciones.find((a) => a.id === x.id)?.cerrada),
    [tarjetas, data.tarjetasAcciones],
  );
  const abiertas = useMemo(
    () => tarjetas.filter((x) => !data.tarjetasAcciones.find((a) => a.id === x.id)?.cerrada),
    [tarjetas, data.tarjetasAcciones],
  );
  const presenciaEventos = useRef(1);
  const presenciaEvidencia = useRef(1);
  return (
    <group name="relato-tridimensional-de-datos">
      <Momento
        indice={0}
        timeline={timeline}
        position={[0.8, 0, -3]}
        name="momento-01-portal-documental"
      >
        <Hotspot
          dato={referencia('portal', 'portal', 0)}
          realce={{ ancho: 5.1, alto: 5.3, posicion: [0, 2.45, -0.3], color: '#00B0F0' }}
        >
          <Portal width={4.2} height={4.6} color="#00B0F0" />
          <Label
            titulo="INCIMMET · SSOMA"
            valor={`${data.anioDesde ?? '—'}—${data.anioHasta ?? '—'}`}
            detalle={`${data.eventos} registros · ${data.proyectos} proyectos`}
            position={[0, 3.35, 0.04]}
            width={2.8}
            height={1.35}
          />
          {data.proyectosDetalle.map((p, i) => {
            const a = ((i + 0.5) / Math.max(1, data.proyectos)) * Math.PI;
            return (
              <mesh
                key={p.codigo}
                position={[Math.cos(a) * 2.2, 1.8 + Math.sin(a) * 2.3, 0.1]}
                name={`luz-portal-${p.codigo}`}
              >
                <sphereGeometry args={[0.05, 8, 6]} />
                <meshBasicMaterial color={[0.1, 1.1, 2]} toneMapped={false} />
              </mesh>
            );
          })}
        </Hotspot>
      </Momento>
      <Momento
        indice={1}
        timeline={timeline}
        position={[1.7, 2.9, -15]}
        name="momento-02-constelacion-de-eventos"
        ensamblar={false}
        presenciaRef={presenciaEventos}
      >
        <Glyphs
          datos={puntos}
          esfera
          emisivo
          nombre="un-punto-por-evento"
          tipo="evento"
          escena={1}
          presenciaRef={presenciaEventos}
        />
        <Label
          titulo="BASE DOCUMENTAL"
          valor={String(data.eventos)}
          detalle="Un punto por registro · color por grupo"
          position={[0, -2.05, 0.1]}
          width={2.25}
          height={0.95}
        />
      </Momento>
      <Momento
        indice={2}
        timeline={timeline}
        position={[1.1, 0, -27]}
        name="momento-03-porticos-por-proyecto"
      >
        {estaciones.map((p, i) => (
          <group key={p.codigo} position={p.posicion} name={`estacion-${p.codigo}`}>
            <Hotspot
              dato={referencia('proyecto', p.codigo, 2)}
              indice={i}
              realce={{
                ancho: 1.25,
                alto: p.altura + 0.95,
                posicion: [0, (p.altura + 0.95) / 2 - 0.05, -0.24],
              }}
            >
              <Portal
                width={0.85}
                height={p.altura}
                color={p.codigo === data.proyectosDetalle[0]?.codigo ? '#00B0F0' : '#1D7DCC'}
              />
              <Label
                titulo={p.nombre}
                valor={String(p.eventos)}
                detalle={`${p.codigo} · registros documentados`}
                position={[0, p.altura + 0.32, 0.08]}
                width={0.98}
                height={0.55}
              />
            </Hotspot>
          </group>
        ))}
      </Momento>
      <Momento
        indice={3}
        timeline={timeline}
        position={[1.55, 2.75, -39]}
        name="momento-04-tableros-oficiales"
      >
        {indicadores.map((v, i) => (
          <group
            key={v.sigla}
            position={[(i - 1) * 1.2, i === 1 ? 0.25 : 0, 0]}
            rotation={[0, (1 - i) * 0.08, 0]}
          >
            <Hotspot
              dato={referencia('indicador', v.sigla, 3)}
              indice={i}
              realce={{ ancho: 1.34, alto: 2.02, posicion: [0, 0, -0.22] }}
            >
              <mesh position={[0, 0, -0.1]}>
                <boxGeometry args={[1.1, 1.75, 0.14]} />
                <meshStandardMaterial color="#151F44" roughness={0.45} metalness={0.65} />
              </mesh>
              <Label
                titulo={v.sigla}
                valor={formatoNarrativo(v.valor, v.decimales)}
                detalle={`${data.indicadores.anio} · ${data.indicadores.ambitoNombre}`}
                position={[0, 0.2, 0.005]}
                width={1.02}
                height={1.4}
              />
              <mesh position={[0, -0.74, 0.01]}>
                <boxGeometry args={[0.8, 0.035, 0.02]} />
                <meshBasicMaterial color={[0, 0.8, 2]} toneMapped={false} />
              </mesh>
            </Hotspot>
          </group>
        ))}
      </Momento>
      <Momento
        indice={4}
        timeline={timeline}
        position={[1.3, 0, -51]}
        name="momento-05-balizas-de-alto-potencial"
      >
        {data.balizas.map((b, i) => (
          <Beacon
            key={b.id}
            id={b.id}
            index={i}
            pulse={pulse}
            dato={referencia('baliza', b.id, 4)}
            position={[((i % 3) - 1) * 1.05, 0, -Math.floor(i / 3) * 1.2]}
          />
        ))}
        <Label
          titulo="ALTO POTENCIAL"
          valor={String(data.altoPotencial)}
          detalle="Eventos marcados; no inferidos"
          position={[0, 2.9, -0.3]}
          width={2.5}
          height={1}
        />
      </Momento>
      <Momento
        indice={5}
        timeline={timeline}
        position={[2.7, 2.75, -64]}
        name="momento-06-muro-de-evidencias"
        ensamblar={false}
        presenciaRef={presenciaEvidencia}
      >
        <Glyphs
          datos={abiertas}
          nombre="acciones-sin-cierre-verificado"
          tipo="accion"
          escena={5}
          presenciaRef={presenciaEvidencia}
        />
        <Glyphs
          datos={cerradas}
          emisivo
          nombre="acciones-con-cierre-segun-corte"
          tipo="accion"
          escena={5}
          presenciaRef={presenciaEvidencia}
        />
        <mesh position={[0, 2.1, 0]}>
          <boxGeometry args={[4.35, 0.06, 0.07]} />
          <meshStandardMaterial color="#7E8CA0" metalness={0.8} roughness={0.35} />
        </mesh>
        <Label
          titulo="LA BRECHA DE EVIDENCIA"
          valor={`${data.cerradas} / ${data.acciones}`}
          detalle={`${data.cierresParciales} cierres con alcance parcial`}
          position={[0, -2.45, 0.05]}
          width={3}
          height={1}
        />
      </Momento>
      <Momento
        indice={6}
        timeline={timeline}
        position={[2.5, 0, -76]}
        name="momento-07-estaciones-del-ciclo"
      >
        {data.ciclo.map((c, i) => (
          <group key={c.titulo} position={[(i % 2) * 1.45 - 0.5, 0, -Math.floor(i / 2) * 1.65]}>
            <Hotspot
              dato={referencia('estacion', c.titulo, 6)}
              indice={i}
              realce={{ ancho: 1.5, alto: 2.35, posicion: [0, 1.12, -0.24] }}
            >
              <Portal width={1.1} height={1.85} color="#00B0F0" />
              <Label
                titulo={c.titulo}
                valor={String(c.cantidad)}
                detalle={c.detalle}
                position={[0, 1.13, 0.04]}
                width={1.05}
                height={1.12}
              />
            </Hotspot>
          </group>
        ))}
        <mesh position={[0.25, 0.035, -1.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.12, 7.5]} />
          <meshBasicMaterial color={[0, 0.9, 2]} toneMapped={false} />
        </mesh>
      </Momento>
      <Momento
        indice={7}
        timeline={timeline}
        name="momento-08-salida-al-aprendizaje"
        ensamblar={false}
      >
        <group position={[0, 0, -93]}>
          <Hotspot
            dato={referencia('leccion', 'lecciones', 7)}
            indice={3}
            realce={{ ancho: 7.4, alto: 6.6, posicion: [0, 3.05, -0.45], color: '#ffd59f' }}
          >
            <Portal width={6.5} height={5.8} color="#DFEAF0" />
            <Label
              titulo="HAGAMOS EL CAMINO JUNTOS"
              valor={String(data.lecciones)}
              detalle="lecciones catalogadas"
              position={[1.5, 2, -0.1]}
              width={2.8}
              height={1.3}
            />
          </Hotspot>
          <CieloSalida />
          <mesh position={[3.4, 5, -11]}>
            <sphereGeometry args={[2, 24, 16]} />
            <meshBasicMaterial color={[2, 1.75, 1.25]} toneMapped={false} />
          </mesh>
        </group>
        {Array.from({ length: data.lecciones }, (_, i) => (
          <mesh
            key={i}
            position={[i % 2 === 0 ? 1.45 : 2.2, 0.055, -84 - i * 0.43]}
            rotation={[-Math.PI / 2, 0, 0]}
            name="luz-de-leccion"
          >
            <circleGeometry args={[0.09, 12]} />
            <meshBasicMaterial color={[0.18, 0.7, 1.35]} toneMapped={false} />
          </mesh>
        ))}
      </Momento>
    </group>
  );
}
