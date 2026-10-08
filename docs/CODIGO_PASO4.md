# Código clave — PASO 4

Código exacto de los archivos de implementación. El repositorio completo y los tests se entregan en el ZIP. El estado de verificación no se deduce de este listado: consultar VERIFICACION_PASO4.md.

## `lib/data/DataSource.ts`

```ts
import type { EstadoSimulacion } from '../domain/reproduccion';
import type {
  ActorDemo,
  BaseNormalizada,
  CambioDatos,
  ContextoDatos,
  EventoLectura,
  AccionLectura,
  Filtros,
  LeccionLectura,
  Indicadores,
  ReporteCampo,
  ReporteLocal,
  EvidenciaLocal,
  SolicitudValidacion,
  HitoLocal,
} from '../types';
/** Contrato común. La demo no ofrece autenticación ni acuses de servidor. */
export interface DataSource {
  getBase(contexto?: ContextoDatos): Promise<BaseNormalizada>;
  getEventos(f?: Filtros): Promise<EventoLectura[]>;
  getAcciones(f?: Filtros): Promise<AccionLectura[]>;
  getLecciones(q?: string, f?: Filtros): Promise<LeccionLectura[]>;
  getIndicadores(): Promise<Indicadores>;
  crearReporte(
    reporte: ReporteCampo,
    actor: ActorDemo,
  ): Promise<{ id: string; estado: 'pendiente' | 'registrado_demo_local' }>;
  asignarAccion(
    accionId: string,
    responsableRol: string,
    fechaCompromiso: string | null,
    motivo: string,
    actor: ActorDemo,
  ): Promise<void>;
  adjuntarEvidencia(accionId: string, file: File, actor: ActorDemo): Promise<{ id: string }>;
  validarEvidencia(id: string, solicitud: SolicitudValidacion, actor: ActorDemo): Promise<void>;
  getEvidencias(accionId: string): Promise<EvidenciaLocal[]>;
  getReportesLocales(): Promise<ReporteLocal[]>;
  getHistorial(entidadId?: string): Promise<HitoLocal[]>;
  procesarColaLocal(actor: ActorDemo): Promise<{ registrados: number; envioServidor: false }>;
  restablecerCambiosLocales(confirmado: boolean): Promise<void>;
  subscribe(cb: (cambio: CambioDatos) => void): () => void;
  getAvisoPersistencia(): string | null;
  iniciarSimulacion(intervaloMs?: number): Promise<void>;
  pausarSimulacion(): void;
  reanudarSimulacion(): void;
  avanzarSimulacion(): void;
  detenerSimulacion(): void;
  getEstadoSimulacion(): EstadoSimulacion;
}
```

## `lib/data/StaticJsonDataSource.ts`

```ts
import { ReproductorDocumental } from '../domain/reproduccion';
import { serializarEstable } from '../domain/serializar';
import type { DataSource } from './DataSource';
import type {
  ActorDemo,
  ArchivoLocal,
  CambioDatos,
  ContextoDatos,
  DataJson,
  EvidenciaLocal,
  Filtros,
  HitoLocal,
  ReporteCampo,
  ReporteLocal,
  SolicitudValidacion,
  AccionLectura,
} from '../types';
import { AlmacenLocal } from './indexedDB';
import { validarDocumento } from './validarDocumento';
import { normalizarDocumento, normalizarReporte } from './normalizar';
import { seleccionarCruzado, filtrarLecciones } from '../domain/filtros';
import { calcularEstadoVerificado } from '../domain/estadoVerificado';
import { exigirPermisoEscritura, validarArchivo, validarReporte } from '../domain/reportes';
import { fechaLima, exigirFechaISO } from '../domain/fechas';
import { DEMO } from '../config/demo';
interface Opciones {
  url?: string;
  fetcher?: typeof fetch;
  almacen?: AlmacenLocal;
  ahora?: () => Date;
}
async function huella(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
async function prepararArchivo(file: File): Promise<ArchivoLocal> {
  return {
    nombre: file.name,
    mime: file.type,
    bytes: file.size,
    blob: file.slice(0, file.size, file.type),
    huella: await huella(await file.arrayBuffer()),
  };
}
export class StaticJsonDataSource implements DataSource {
  private documento?: Promise<DataJson>;
  private readonly reproductor = new ReproductorDocumental((evento) =>
    this.emitir({ tipo: 'simulacion', entidadId: evento?.id ?? 'reproduccion', evento }),
  );
  async iniciarSimulacion(intervaloMs = 1400) {
    this.reproductor.iniciar(normalizarDocumento(await this.raw()).eventos, 2026, intervaloMs);
  }
  pausarSimulacion() {
    this.reproductor.pausar();
  }
  reanudarSimulacion() {
    this.reproductor.reanudar();
  }
  avanzarSimulacion() {
    this.reproductor.avanzar();
  }
  detenerSimulacion() {
    this.reproductor.detener();
  }
  getEstadoSimulacion() {
    return this.reproductor.snapshot();
  }
  private readonly listeners = new Set<(c: CambioDatos) => void>();
  private readonly almacen: AlmacenLocal;
  private readonly ahora: () => Date;
  private aviso: string | null = null;
  constructor(private readonly opciones: Opciones = {}) {
    this.almacen = opciones.almacen ?? new AlmacenLocal();
    this.ahora = opciones.ahora ?? (() => new Date());
  }
  getAvisoPersistencia(): string | null {
    return this.aviso;
  }
  private async cargar(): Promise<DataJson> {
    let data: DataJson;
    try {
      const respuesta = await (this.opciones.fetcher ?? fetch)(this.opciones.url ?? DEMO.baseUrl);
      if (!respuesta.ok) throw new Error(`No se pudo leer data.json (${respuesta.status})`);
      // Un JSON incorrecto no se sustituye silenciosamente por una versión vieja.
      data = validarDocumento(await respuesta.json());
    } catch (error) {
      if (
        error instanceof SyntaxError ||
        (error instanceof Error && error.message.startsWith('JSON inválido'))
      )
        throw error;
      try {
        const cache = await (await this.almacen.abrir()).get('documentos', 'base');
        if (cache) {
          this.aviso = 'Base recuperada de caché local; se conserva su fecha de corte documental.';
          return validarDocumento(cache.data);
        }
      } catch {
        /* El error de lectura se informa abajo; no se confirma ninguna escritura. */
      }
      throw error;
    }
    try {
      await (
        await this.almacen.abrir()
      ).put('documentos', { id: 'base', data, guardadoEn: this.ahora().toISOString() });
      this.aviso = null;
    } catch {
      this.aviso =
        'Lectura disponible, pero no se pudo preparar la caché de datos offline. Revise el almacenamiento.';
    }
    return data;
  }
  private raw(): Promise<DataJson> {
    this.documento ??= this.cargar().catch((e: unknown) => {
      this.documento = undefined;
      throw e;
    });
    return this.documento;
  }
  private proyectosRequeridos(a: AccionLectura, d: DataJson): string[] {
    if (a.alcance === 'Todos los proyectos') return d.proyectos.map((p) => p.codigo);
    if (a.alcance?.startsWith('OR, TA, UC')) return ['OR', 'TA', 'UC'];
    // Suficiencia de flota/actividad se confirma explícitamente, además del proyecto de origen.
    return [a.proyectoCodigo];
  }
  async getBase(contexto: ContextoDatos = 'base') {
    const raw = await this.raw();
    const base = normalizarDocumento(raw);
    if (contexto === 'base+local') {
      const db = await this.almacen.abrir();
      const [reportes, evidencias, asignaciones] = await Promise.all([
        db.getAll('reportes'),
        db.getAll('evidencias'),
        db.getAll('asignaciones'),
      ]);
      base.eventos.push(
        ...reportes.filter((r) => r.estadoCola === 'registrado_demo_local').map(normalizarReporte),
      );
      for (const a of base.acciones) {
        const asignacion = asignaciones.find((x) => x.accionId === a.id);
        if (asignacion) {
          a.responsableRol = asignacion.responsableRol;
          a.fechaCompromiso = asignacion.fechaCompromiso ?? undefined;
        }
        const locales = evidencias.filter((e) => e.accionId === a.id);
        if (!locales.length && !asignacion) continue;
        a.estadoOperativo = calcularEstadoVerificado(
          { ...a, evidencias: locales, proyectosRequeridos: this.proyectosRequeridos(a, raw) },
          fechaLima(this.ahora()),
        );
        a.estadoVerificado = a.estadoOperativo;
      }
    }
    if (contexto === 'reproduccion') {
      const visibles = new Set(this.reproductor.snapshot().visibles);
      base.eventos = base.eventos.filter((e) => visibles.has(e.id));
      base.acciones = base.acciones.filter((a) => visibles.has(a.eventoId));
      base.lecciones = base.lecciones.filter((l) => l.eventoIds.some((id) => visibles.has(id)));
    }
    return base;
  }
  async getEventos(f: Filtros = {}) {
    const b = await this.getBase(f.contexto);
    return seleccionarCruzado(b.eventos, b.acciones, b.lecciones, f).eventos;
  }
  async getAcciones(f: Filtros = {}) {
    const b = await this.getBase(f.contexto);
    return seleccionarCruzado(b.eventos, b.acciones, b.lecciones, f).acciones;
  }
  async getLecciones(q = '', f: Filtros = {}) {
    const b = await this.getBase(f.contexto);
    const seleccion = seleccionarCruzado(b.eventos, b.acciones, b.lecciones, f);
    return filtrarLecciones(seleccion.lecciones, seleccion.eventos, {}, q);
  }
  async getIndicadores() {
    return structuredClone((await this.raw()).indicadores);
  }
  private hito(
    entidadId: string,
    tipo: HitoLocal['tipo'],
    rol: ActorDemo['rol'],
    descripcion: string,
  ): HitoLocal {
    return {
      id: crypto.randomUUID(),
      entidadId,
      tipo,
      rol,
      descripcion,
      fecha: this.ahora().toISOString(),
    };
  }
  async crearReporte(reporte: ReporteCampo, actor: ActorDemo) {
    const d = await this.raw();
    validarReporte(reporte, d, actor, this.ahora());
    const { fotos, ...payload } = reporte;
    const archivos = await Promise.all(fotos.map(prepararArchivo));
    const fingerprint = await huella(
      new TextEncoder().encode(serializarEstable({ payload, fotos: archivos.map((a) => a.huella) }))
        .buffer,
    );
    const id = `LOCAL-${reporte.idempotencia}`;
    const db = await this.almacen.abrir();
    const tx = db.transaction(['reportes', 'historial'], 'readwrite');
    const existente = await tx.objectStore('reportes').get(id);
    if (existente) {
      await tx.done;
      if (existente.huella !== fingerprint)
        throw new Error('Conflicto: la clave local ya tiene otro contenido. No se sobrescribió.');
      return { id, estado: existente.estadoCola };
    }
    const nuevo: ReporteLocal = {
      id,
      payload: structuredClone(payload),
      fotos: archivos,
      huella: fingerprint,
      creadoEn: this.ahora().toISOString(),
      rol: actor.rol,
      estadoCola: 'pendiente',
      registradoEn: null,
      cliente: d.proyectos.find((p) => p.codigo === reporte.proyectoCodigo)?.cliente ?? 'No consta',
    };
    await tx.objectStore('reportes').add(nuevo);
    await tx
      .objectStore('historial')
      .add(
        this.hito(id, 'reporte', actor.rol, 'Guardado en este dispositivo · Pendiente de envío'),
      );
    await tx.done;
    this.emitir({ tipo: 'reporte', entidadId: id });
    return { id, estado: nuevo.estadoCola };
  }

  async asignarAccion(
    accionId: string,
    responsableRol: string,
    fechaCompromiso: string | null,
    motivo: string,
    actor: ActorDemo,
  ) {
    if (actor.rol !== 'SSOMA corporativo') throw new Error('Solo SSOMA corporativo puede asignar');
    const rol = responsableRol.trim();
    if (rol.length < 3 || rol.length > 180 || /^no consta/i.test(rol))
      throw new Error('Indique una función responsable válida, no un nombre personal');
    if (!motivo.trim()) throw new Error('La asignación requiere motivo');
    if (fechaCompromiso) exigirFechaISO(fechaCompromiso);
    if (!(await this.raw()).acciones.some((a) => a.id === accionId))
      throw new Error('Acción no encontrada');
    const db = await this.almacen.abrir();
    const tx = db.transaction(['asignaciones', 'historial'], 'readwrite');
    const anterior = await tx.objectStore('asignaciones').get(accionId);
    await tx.objectStore('asignaciones').put({
      accionId,
      responsableRol: rol,
      fechaCompromiso,
      motivo: motivo.trim(),
      creadoEn: this.ahora().toISOString(),
      rol: 'SSOMA corporativo',
    });
    await tx
      .objectStore('historial')
      .add(
        this.hito(
          accionId,
          'asignacion',
          actor.rol,
          `Asignación local: ${rol}; compromiso ${fechaCompromiso ?? 'No consta'}. ${motivo}. ${anterior ? `Asignación local anterior: ${anterior.responsableRol}, ${anterior.fechaCompromiso ?? 'No consta'}.` : 'Origen documental conservado en la ficha.'}`,
        ),
      );
    await tx.done;
    this.emitir({ tipo: 'asignacion', entidadId: accionId });
  }
  async adjuntarEvidencia(accionId: string, file: File, actor: ActorDemo) {
    exigirPermisoEscritura(actor);
    validarArchivo(file);
    const accion = (await this.raw()).acciones.find((a) => a.id === accionId);
    if (!accion) throw new Error('Acción no encontrada');
    const asignacion = await (await this.almacen.abrir()).get('asignaciones', accionId);
    const responsable = asignacion?.responsableRol ?? accion.responsable_rol;
    if (
      actor.rol === 'Supervisor de campo' &&
      (actor.proyectoCodigo !== accion.proyecto ||
        !actor.responsableRol ||
        actor.responsableRol !== responsable ||
        /^no consta/i.test(actor.responsableRol))
    )
      throw new Error('La acción no pertenece al proyecto y función responsable seleccionados');
    const archivo = await prepararArchivo(file);
    const db = await this.almacen.abrir();
    const tx = db.transaction(['evidencias', 'historial'], 'readwrite');
    const existentes = await tx.objectStore('evidencias').index('por-accion').getAll(accionId);
    const repetida = existentes.find((e) => e.archivo.huella === archivo.huella);
    if (repetida) {
      await tx.done;
      return { id: repetida.id };
    }
    if (existentes.length >= DEMO.maxArchivos) {
      await tx.done;
      throw new Error('Máximo 10 archivos por acción en la demo');
    }
    const id = `EVD-LOCAL-${crypto.randomUUID()}`;
    const evidencia: EvidenciaLocal = {
      id,
      accionId,
      archivo,
      creadoEn: this.ahora().toISOString(),
      subidoPorRol: actor.rol,
      validacion: null,
    };
    await tx.objectStore('evidencias').add(evidencia);
    await tx
      .objectStore('historial')
      .add(
        this.hito(accionId, 'evidencia', actor.rol, `Archivo local ${id}; pendiente de validación`),
      );
    await tx.done;
    this.emitir({ tipo: 'evidencia', entidadId: accionId });
    return { id };
  }
  async validarEvidencia(id: string, solicitud: SolicitudValidacion, actor: ActorDemo) {
    if (actor.rol !== 'SSOMA corporativo') throw new Error('Solo SSOMA corporativo puede validar');
    if (typeof solicitud.aceptada !== 'boolean' || typeof solicitud.alcanceCompleto !== 'boolean')
      throw new Error('La decisión y suficiencia deben ser booleanos explícitos');
    if (typeof solicitud.motivo !== 'string' || !solicitud.motivo.trim())
      throw new Error('La validación requiere motivo');
    const raw = await this.raw();
    if (
      !Array.isArray(solicitud.proyectosCubiertos) ||
      solicitud.proyectosCubiertos.some((p) => !raw.proyectos.some((x) => x.codigo === p))
    )
      throw new Error('Proyecto de cobertura no registrado');
    const db = await this.almacen.abrir();
    const tx = db.transaction(['evidencias', 'historial'], 'readwrite');
    const evidencia = await tx.objectStore('evidencias').get(id);
    if (!evidencia) {
      await tx.done;
      throw new Error('Evidencia no encontrada');
    }
    if (evidencia.validacion) {
      await tx.done;
      throw new Error('La evidencia ya tiene una decisión; no se sobrescribe el historial');
    }
    if (evidencia.subidoPorRol === actor.rol) {
      await tx.done;
      throw new Error('La demo exige roles distintos para adjuntar y verificar');
    }
    const accion = normalizarDocumento(raw).acciones.find((a) => a.id === evidencia.accionId);
    if (!accion) {
      await tx.done;
      throw new Error('Acción no encontrada');
    }
    const requeridos = this.proyectosRequeridos(accion, raw);
    if (
      solicitud.aceptada &&
      (!solicitud.alcanceCompleto ||
        !requeridos.every((p) => solicitud.proyectosCubiertos.includes(p)))
    ) {
      await tx.done;
      throw new Error('La evidencia no acredita el alcance completo requerido');
    }
    evidencia.validacion = {
      ...solicitud,
      proyectosCubiertos: [...solicitud.proyectosCubiertos],
      rol: 'SSOMA corporativo',
      fecha: this.ahora().toISOString(),
    };
    await tx.objectStore('evidencias').put(evidencia);
    await tx
      .objectStore('historial')
      .add(
        this.hito(
          evidencia.accionId,
          'validacion',
          actor.rol,
          `${solicitud.aceptada ? 'Aceptada' : 'Rechazada'}: ${solicitud.motivo}`,
        ),
      );
    await tx.done;
    this.emitir({ tipo: 'validacion', entidadId: evidencia.accionId });
  }
  async getEvidencias(accionId: string) {
    return (await this.almacen.abrir()).getAllFromIndex('evidencias', 'por-accion', accionId);
  }
  async getReportesLocales() {
    return (await this.almacen.abrir()).getAll('reportes');
  }
  async getHistorial(entidadId?: string) {
    const db = await this.almacen.abrir();
    const filas = entidadId
      ? await db.getAllFromIndex('historial', 'por-entidad', entidadId)
      : await db.getAll('historial');
    return filas.sort((a, b) => a.fecha.localeCompare(b.fecha));
  }
  async procesarColaLocal(actor: ActorDemo) {
    exigirPermisoEscritura(actor);
    const db = await this.almacen.abrir();
    const tx = db.transaction(['reportes', 'historial'], 'readwrite');
    const reportes = await tx.objectStore('reportes').getAll();
    let registrados = 0;
    for (const r of reportes) {
      if (
        r.estadoCola !== 'pendiente' ||
        (actor.rol === 'Supervisor de campo' && r.payload.proyectoCodigo !== actor.proyectoCodigo)
      )
        continue;
      r.estadoCola = 'registrado_demo_local';
      r.registradoEn = this.ahora().toISOString();
      await tx.objectStore('reportes').put(r);
      await tx
        .objectStore('historial')
        .add(
          this.hito(r.id, 'cola', actor.rol, 'Registrado en la demo local; no enviado a servidor'),
        );
      registrados++;
    }
    await tx.done;
    if (registrados) this.emitir({ tipo: 'cola', entidadId: 'local' });
    return { registrados, envioServidor: false as const };
  }
  async restablecerCambiosLocales(confirmado: boolean) {
    if (!confirmado)
      throw new Error('Confirme el borrado de reportes, archivos e historial locales');
    const db = await this.almacen.abrir();
    const tx = db.transaction(['reportes', 'evidencias', 'historial', 'asignaciones'], 'readwrite');
    await Promise.all([
      tx.objectStore('reportes').clear(),
      tx.objectStore('evidencias').clear(),
      tx.objectStore('historial').clear(),
      tx.objectStore('asignaciones').clear(),
    ]);
    await tx.done;
    this.emitir({ tipo: 'restablecer', entidadId: 'local' });
  }
  subscribe(cb: (cambio: CambioDatos) => void) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }
  private emitir(cambio: CambioDatos) {
    // Un fallo de un observador no convierte un guardado confirmado en un error de escritura.
    for (const cb of this.listeners) {
      try {
        cb(cambio);
      } catch (error) {
        console.error('Observador de datos falló', error);
      }
    }
  }
}
```

## `lib/data/indexedDB.ts`

```ts
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { DataJson, AsignacionLocal, EvidenciaLocal, HitoLocal, ReporteLocal } from '../types';
import { DEMO } from '../config/demo';
export interface DemoDB extends DBSchema {
  asignaciones: { key: string; value: AsignacionLocal };
  documentos: { key: string; value: { id: string; data: DataJson; guardadoEn: string } };
  reportes: { key: string; value: ReporteLocal };
  evidencias: { key: string; value: EvidenciaLocal; indexes: { 'por-accion': string } };
  historial: { key: string; value: HitoLocal; indexes: { 'por-entidad': string } };
}
export class AlmacenLocal {
  private promesa?: Promise<IDBPDatabase<DemoDB>>;
  constructor(private readonly nombre: string = DEMO.dbName) {}
  abrir(): Promise<IDBPDatabase<DemoDB>> {
    if (typeof indexedDB === 'undefined')
      return Promise.reject(
        new Error('IndexedDB no está disponible: no se puede confirmar el guardado local'),
      );
    this.promesa ??= openDB<DemoDB>(this.nombre, 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore('documentos', { keyPath: 'id' });
          db.createObjectStore('reportes', { keyPath: 'id' });
          db.createObjectStore('evidencias', { keyPath: 'id' }).createIndex(
            'por-accion',
            'accionId',
          );
          db.createObjectStore('historial', { keyPath: 'id' }).createIndex(
            'por-entidad',
            'entidadId',
          );
        }
        if (oldVersion < 2) db.createObjectStore('asignaciones', { keyPath: 'accionId' });
      },
      blocked() {
        console.warn('Cierre otra pestaña para actualizar el almacenamiento local');
      },
      blocking: () => {
        void this.cerrar();
      },
      terminated: () => {
        this.promesa = undefined;
      },
    }).catch((error: unknown) => {
      this.promesa = undefined;
      throw error;
    });
    return this.promesa;
  }
  async cerrar(): Promise<void> {
    const db = await this.promesa;
    db?.close();
    this.promesa = undefined;
  }
}
```

## `lib/domain/analitica.ts`

```ts
import type { AccionLectura, BaseNormalizada, EventoLectura, Filtros } from '../types';
import { resumenCumplimiento, sumaConCobertura } from './agregaciones';
import { declaracionCerrada } from './estadoVerificado';
import { unicosPorId } from './filtros';

export function avisosCalidad(base: BaseNormalizada): string[] {
  const recuperados = base.eventos.filter((e) => e.anio === 2025).length;
  const parciales = base.acciones
    .filter((a) => a.estadoImportado === 'Cerrada con evidencia' && a.coberturaParcial)
    .map((a) => a.id);
  return [
    ...base.meta.advertencias,
    `2025 contiene ${recuperados} registros recuperados; cobertura no exhaustiva.`,
    ...(parciales.length
      ? [`${parciales.join(', ')}: cierres importados con evidencia de alcance parcial.`]
      : []),
  ];
}
export function resumenKPIs(eventos: readonly EventoLectura[], cohorte: readonly AccionLectura[]) {
  const filas = unicosPorId(eventos);
  const accidentes = filas.filter((e) => e.tipoGrupo === 'Accidente');
  const orden = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'No consta'];
  const porNivel = contarEventos(accidentes, 'nivelIncimmet').sort(
    (a, b) => orden.indexOf(a.etiqueta) - orden.indexOf(b.etiqueta),
  );
  return {
    eventos: filas.length,
    accidentes: accidentes.length,
    porNivel,
    hpri: filas.filter((e) => e.altoPotencial === true).length,
    potencialDesconocido: filas.filter((e) => e.altoPotencial === null).length,
    diasPerdidos: sumaConCobertura(filas, 'diasPerdidos'),
    cumplimiento: resumenCumplimiento(cohorte),
  };
}
export type DimensionConteo =
  | 'proyectoCodigo'
  | 'tipoGrupo'
  | 'tipo'
  | 'riesgoCritico'
  | 'actividad'
  | 'equipo'
  | 'nivelIncimmet'
  | 'pgIncimmet';
export function contarEventos(eventos: readonly EventoLectura[], campo: DimensionConteo) {
  const grupos = new Map<string | null, string[]>();
  for (const e of unicosPorId(eventos)) {
    const clave = e[campo] ?? null;
    grupos.set(clave, [...(grupos.get(clave) ?? []), e.id]);
  }
  return [...grupos]
    .map(([clave, eventoIds]) => ({
      clave,
      etiqueta: clave ?? 'No consta',
      cantidad: eventoIds.length,
      eventoIds,
    }))
    .sort((a, b) => b.cantidad - a.cantidad || a.etiqueta.localeCompare(b.etiqueta, 'es'));
}
export function matrizSeveridad(eventos: readonly EventoLectura[]) {
  const e = unicosPorId(eventos);
  const niveles = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'No consta'];
  const filas = niveles.flatMap((nivel) =>
    niveles.map((potencial) => {
      const ids = e
        .filter(
          (v) =>
            (v.nivelIncimmet ?? 'No consta') === nivel &&
            (v.pgIncimmet ?? 'No consta') === potencial,
        )
        .map((v) => v.id);
      return { nivel, potencial, cantidad: ids.length || null, eventoIds: ids };
    }),
  );
  const completos = e.filter((v) => v.nivelIncimmet != null && v.pgIncimmet != null).length;
  return { niveles, filas, completos, faltantes: e.length - completos };
}
export function coberturaAnual(
  eventos: readonly EventoLectura[],
  proyectos: readonly string[],
  anios?: readonly number[],
) {
  const e = unicosPorId(eventos);
  const reales = e.map((v) => v.anio);
  const years = anios
    ? [...new Set(anios)].sort((a, b) => a - b)
    : reales.length
      ? Array.from(
          { length: Math.max(...reales) - Math.min(...reales) + 1 },
          (_, i) => Math.min(...reales) + i,
        )
      : [];
  return proyectos.flatMap((proyecto) =>
    years.map((anio) => {
      const ids = e
        .filter((v) => v.proyectoCodigo === proyecto && v.anio === anio)
        .map((v) => v.id);
      return { proyecto, anio, cantidad: ids.length || null, eventoIds: ids };
    }),
  );
}
export function cumplimientoComparado(
  acciones: readonly AccionLectura[],
  proyectos: readonly string[] = [],
) {
  const filas = unicosPorId(acciones);
  return [...new Set([...proyectos, ...filas.map((a) => a.proyectoCodigo)])]
    .sort()
    .map((proyecto) => {
      const seleccion = filas.filter((a) => a.proyectoCodigo === proyecto);
      const resumen = resumenCumplimiento(seleccion);
      const declaradas = seleccion.filter((a) => declaracionCerrada(a.estadoDeclarado)).length;
      return {
        proyecto,
        ...resumen,
        declaradas,
        porcentajeDeclarado: resumen.total ? (declaradas / resumen.total) * 100 : null,
      };
    });
}
export type EntidadCalidad = 'eventos' | 'acciones' | 'lecciones' | 'proyectos';
function aplanar(objeto: Record<string, unknown>, prefijo = ''): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(objeto).flatMap(([key, value]) => {
      const nombre = prefijo + key;
      return value && typeof value === 'object' && !Array.isArray(value)
        ? Object.entries(aplanar(value as Record<string, unknown>, `${nombre}.`))
        : [[nombre, value]];
    }),
  );
}
/** Cada ausencia ocupa una única categoría; un array vacío no es un null. */
export function calidadCampos(base: BaseNormalizada, entidad: EntidadCalidad) {
  const rows: { valores: Record<string, unknown>; eventos: string[] }[] =
    entidad === 'eventos'
      ? base.eventos
          .filter((e) => e.original)
          .map((e) => ({
            valores: aplanar(e.original as unknown as Record<string, unknown>),
            eventos: [e.id],
          }))
      : entidad === 'acciones'
        ? base.acciones.map((a) => ({
            valores: aplanar(a.original as unknown as Record<string, unknown>),
            eventos: [a.eventoId],
          }))
        : entidad === 'lecciones'
          ? base.lecciones.map((l) => ({
              valores: aplanar(l.original as unknown as Record<string, unknown>),
              eventos: l.eventoIds,
            }))
          : base.proyectos.map((p) => ({
              valores: aplanar(p as unknown as Record<string, unknown>),
              eventos: base.eventos.filter((e) => e.proyectoCodigo === p.codigo).map((e) => e.id),
            }));
  const campos = [...new Set(rows.flatMap((r) => Object.keys(r.valores)))];
  return campos
    .map((campo) => {
      let nulos = 0,
        vacios = 0,
        noConsta = 0,
        ausentes = 0;
      const ids = new Set<string>();
      const idsNulos = new Set<string>();
      for (const r of rows) {
        const valor = r.valores[campo];
        let falta = true;
        if (!(campo in r.valores)) ausentes++;
        else if (valor === null) {
          nulos++;
          r.eventos.forEach((id) => idsNulos.add(id));
        } else if (
          (Array.isArray(valor) && !valor.length) ||
          (typeof valor === 'string' && !valor.trim())
        )
          vacios++;
        else if (typeof valor === 'string' && /^no consta\b/i.test(valor.trim())) noConsta++;
        else falta = false;
        if (falta) r.eventos.forEach((id) => ids.add(id));
      }
      return {
        campo,
        total: rows.length,
        nulos,
        vacios,
        noConsta,
        ausentes,
        porcentajeNulos: rows.length ? (nulos / rows.length) * 100 : null,
        porcentajeAusencia: rows.length
          ? ((nulos + vacios + noConsta + ausentes) / rows.length) * 100
          : null,
        eventoIds: [...ids],
        eventoIdsNulos: [...idsNulos],
      };
    })
    .sort(
      (a, b) =>
        (b.porcentajeNulos ?? 0) - (a.porcentajeNulos ?? 0) || a.campo.localeCompare(b.campo),
    );
}
/** One mark selects a tuple atomically; a second click on the same tuple clears it. */
export function seleccionarMarca(actual: Filtros, marca: Partial<Filtros>): Filtros {
  const entradas = Object.entries(marca).filter(([, v]) => v !== undefined);
  const igual =
    entradas.length > 0 &&
    entradas.every(([k, v]) => JSON.stringify(actual[k as keyof Filtros]) === JSON.stringify(v));
  const resultado: Filtros = { ...actual };
  for (const [k, v] of entradas) {
    if (igual) delete resultado[k as keyof Filtros];
    else Object.assign(resultado, { [k]: v });
  }
  return resultado;
}
export function eventHref(id: string) {
  return `${id.startsWith('LOCAL-') ? '/eventos/local/' : '/eventos/'}${encodeURIComponent(id)}`;
}
```

## `lib/domain/reproduccion.ts`

```ts
import type { EventoLectura } from '../types';
import { unicosPorId } from './filtros';
export function secuenciaDocumental(eventos: readonly EventoLectura[], anio = 2026) {
  return unicosPorId(eventos)
    .filter((e) => e.origen === 'documental' && e.anio === anio)
    .sort(
      (a, b) =>
        (a.fecha ?? '9999').localeCompare(b.fecha ?? '9999') ||
        (a.hora ?? '').localeCompare(b.hora ?? '') ||
        a.id.localeCompare(b.id),
    );
}
export interface EstadoSimulacion {
  estado: 'detenida' | 'reproduciendo' | 'pausada' | 'finalizada';
  anio: number;
  total: number;
  visibles: string[];
  ultimoId: string | null;
}
/** Replay is a read projection. Never appends or persists fictitious events. */
export class ReproductorDocumental {
  private secuencia: EventoLectura[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private intervalo = 1400;
  private estado: EstadoSimulacion = {
    estado: 'detenida',
    anio: 2026,
    total: 0,
    visibles: [],
    ultimoId: null,
  };
  constructor(private readonly notificar: (evento?: EventoLectura) => void) {}
  snapshot(): EstadoSimulacion {
    return { ...this.estado, visibles: [...this.estado.visibles] };
  }
  iniciar(eventos: readonly EventoLectura[], anio = 2026, intervaloMs = 1400) {
    this.cancelarTimer();
    this.secuencia = secuenciaDocumental(eventos, anio);
    this.intervalo = Math.max(100, Math.min(10000, intervaloMs));
    this.estado = {
      estado: this.secuencia.length ? 'reproduciendo' : 'finalizada',
      anio,
      total: this.secuencia.length,
      visibles: [],
      ultimoId: null,
    };
    this.notificar();
    if (this.secuencia.length) this.activarTimer();
  }
  private activarTimer() {
    this.cancelarTimer();
    this.timer = setInterval(() => this.avanzar(), this.intervalo);
  }
  private cancelarTimer() {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
  }
  avanzar() {
    if (this.estado.estado === 'detenida' || this.estado.estado === 'finalizada') return;
    const evento = this.secuencia[this.estado.visibles.length];
    if (!evento) return;
    this.estado.visibles.push(evento.id);
    this.estado.ultimoId = evento.id;
    if (this.estado.visibles.length === this.secuencia.length) {
      this.estado.estado = 'finalizada';
      this.cancelarTimer();
    }
    this.notificar(evento);
  }
  pausar() {
    this.cancelarTimer();
    if (this.estado.estado === 'reproduciendo') {
      this.estado.estado = 'pausada';
      this.notificar();
    }
  }
  reanudar() {
    if (this.estado.estado === 'pausada') {
      this.estado.estado = 'reproduciendo';
      this.activarTimer();
      this.notificar();
    }
  }
  detener() {
    this.cancelarTimer();
    this.estado = { ...this.estado, estado: 'detenida', visibles: [], ultimoId: null };
    this.notificar();
  }
}
```

## `lib/domain/exportacion.ts`

```ts
/** RFC 4180 quoting plus formula neutralization for spreadsheet consumers. */
export function celdaCSV(valor: unknown): string {
  let texto =
    valor === null || valor === undefined
      ? 'No consta'
      : Array.isArray(valor)
        ? valor.join(' | ')
        : String(valor);
  if (/^[\s\u0000-\u001f]*[=+@-]/.test(texto) && typeof valor !== 'number') texto = `'${texto}`;
  return `"${texto.replace(/"/g, '""')}"`;
}
export function crearCSV(
  columnas: readonly string[],
  filas: readonly (readonly unknown[])[],
  notas: readonly string[] = [],
): string {
  const contexto = notas.map((n) => [n, ...columnas.slice(1).map(() => '')]);
  return (
    '\ufeff' + [...contexto, columnas, ...filas].map((f) => f.map(celdaCSV).join(',')).join('\r\n')
  );
}
export function nombreArchivo(texto: string) {
  return (
    texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 100) || 'incimmet'
  );
}
```

## `lib/domain/momentos3d.ts`

```ts
import type { ResumenPresentacion } from './presentacion';
import { aleatorioSemilla, type Vec3 } from './cinematica';
export const COLORES_EVENTO: Record<string, string> = {
  Accidente: '#8DB7FF',
  Incidente: '#1D7DCC',
  'Daño a la propiedad': '#00B0F0',
  Desvío: '#B999F4',
  Ambiental: '#55CAB9',
  'En investigación': '#D1D5DB',
};
export interface InstanciaDato {
  id: string;
  posicion: Vec3;
  escala: Vec3;
  color: string;
  rotacion?: Vec3;
  intensidad?: number;
}
export function lucesEventos(data: ResumenPresentacion): InstanciaDato[] {
  const random = aleatorioSemilla(22507);
  return data.puntosEventos.map((e, i) => {
    const filas = Math.ceil(Math.sqrt(data.puntosEventos.length)),
      x = (i % filas) / Math.max(1, filas - 1);
    const y = Math.floor(i / filas) / Math.max(1, Math.ceil(data.puntosEventos.length / filas) - 1);
    return {
      id: e.id,
      posicion: [(x - 0.5) * 3.8, (y - 0.5) * 3.35, -random() * 2.6],
      escala: [0.045, 0.045, 0.045],
      color: COLORES_EVENTO[e.grupo] ?? '#D1D5DB',
      intensidad: 1.7,
    };
  });
}
export function tarjetasEvidencia(data: ResumenPresentacion): InstanciaDato[] {
  const cols = Math.max(1, Math.ceil(Math.sqrt(data.tarjetasAcciones.length * 1.2))),
    rows = Math.max(1, Math.ceil(data.tarjetasAcciones.length / cols));
  return data.tarjetasAcciones.map((a, i) => ({
    id: a.id,
    posicion: [
      ((i % cols) - (cols - 1) / 2) * 0.28,
      ((rows - 1) / 2 - Math.floor(i / cols)) * 0.31,
      Math.sin(i * 0.51) * 0.075,
    ],
    escala: [0.215, 0.25, 0.035],
    color: a.cerrada ? '#00B050' : '#718096',
    rotacion: [0, Math.sin(i * 0.7) * 0.15, Math.sin(i * 0.2) * 0.035],
    intensidad: a.cerrada ? 2.7 : 1,
  }));
}
export function estacionesProyectos(data: ResumenPresentacion) {
  const max = Math.max(1, ...data.proyectosDetalle.map((p) => p.eventos));
  return data.proyectosDetalle.map((p, i) => ({
    ...p,
    posicion: [((i % 3) - 1) * 1.28, 0, -Math.floor(i / 3) * 1.1] as Vec3,
    altura: 0.72 + Math.sqrt(p.eventos / max) * 1.55,
  }));
}
export function panelesIndicadores(data: ResumenPresentacion) {
  return [
    { sigla: 'IF', valor: data.indicadores.if, decimales: 2 },
    { sigla: 'IS', valor: data.indicadores.is, decimales: 2 },
    { sigla: 'IA', valor: data.indicadores.ia, decimales: 3 },
  ];
}
```

## `lib/analytics/modelos.ts`

```ts
import type { AccionLectura, BaseNormalizada, EventoLectura, Filtros, GrupoEvento } from '../types';
import {
  contarEventos,
  coberturaAnual,
  matrizSeveridad,
  cumplimientoComparado,
  type DimensionConteo,
} from '../domain/analitica';
import {
  cumplimientoPorEvento,
  cumplimientoPorProyecto,
  mapaCalorProyectoMes,
  pareto,
  tendencias,
  type DimensionPareto,
} from '../domain/agregaciones';
import { ESTADOS_VERIFICADOS } from '../domain/estadoVerificado';

export interface PuntoGrafico {
  etiqueta: string;
  valor: number | null;
  serie?: string;
  x?: string;
  y?: string;
  acumulado?: number;
  detalle?: string;
  filtros?: Partial<Filtros>;
}
export interface ModeloGrafico {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: 'bar' | 'stacked' | 'line' | 'pareto' | 'heatmap' | 'donut' | 'grouped';
  puntos: PuntoGrafico[];
  categorias?: string[];
  filas?: string[];
  unidad?: string;
  referencia?: number;
  alto?: number;
  procedencia?: string;
}
export const COLORES_GRUPO: Record<string, string> = {
  Accidente: '#002060',
  Incidente: '#1D7DCC',
  'Daño a la propiedad': '#00B0F0',
  Desvío: '#7C3AED',
  Ambiental: '#0F766E',
  'En investigación': '#64748B',
};
export const COLORES_ESTADO: Record<string, string> = {
  'Cerrada con evidencia': '#00B050',
  'Declarada cerrada sin evidencia': '#FFC000',
  Abierta: '#1D7DCC',
  Vencida: '#E53935',
  'Sin información': '#9E9E9E',
  Verificado: '#00B050',
  'Declarado explícitamente': '#FFC000',
};
const dimensiones = {
  proyectoCodigo: 'proyectos',
  tipoGrupo: 'grupos',
  tipo: 'tipos',
  riesgoCritico: 'riesgos',
  actividad: 'actividades',
  equipo: 'equipos',
  nivelIncimmet: 'niveles',
  pgIncimmet: 'potenciales',
} as const;
export function modeloConteo(
  eventos: readonly EventoLectura[],
  campo: DimensionConteo,
  titulo: string,
  tipo: 'bar' | 'donut' = 'bar',
): ModeloGrafico {
  return {
    id: `conteo-${campo}-${titulo}`,
    titulo,
    tipo,
    descripcion:
      'Registros documentados. Seleccione una marca para filtrar; repita la selección para quitarla.',
    puntos: contarEventos(eventos, campo)
      .sort((a, b) => {
        if (campo !== 'nivelIncimmet' && campo !== 'pgIncimmet') return 0;
        const orden = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'No consta'];
        return orden.indexOf(a.etiqueta) - orden.indexOf(b.etiqueta);
      })
      .map((f) => ({
        etiqueta: f.etiqueta,
        valor: f.cantidad,
        filtros: { [dimensiones[campo]]: [f.clave] },
      })),
  };
}
export function modeloTendencia(
  eventos: readonly EventoLectura[],
  frecuencia: 'anual' | 'mensual',
): ModeloGrafico {
  const datos = tendencias(eventos, frecuencia);
  const grupos = Object.keys(COLORES_GRUPO) as GrupoEvento[];
  return {
    id: `tendencia-${frecuencia}`,
    titulo: `Tendencia ${frecuencia} por grupo`,
    tipo: frecuencia === 'anual' ? 'stacked' : 'line',
    categorias: datos.filas.map((f) => f.periodo),
    descripcion: `Huecos = sin registros en esta base, no ausencia de hechos. ${datos.sinMes.length} evento(s) sin mes exacto fuera de la serie mensual.`,
    puntos: grupos.flatMap((grupo) =>
      datos.filas.map((f) => ({
        etiqueta: f.periodo,
        serie: grupo,
        valor: f.cantidad === null ? null : (f.porGrupo[grupo] ?? 0),
        filtros: {
          anios: [Number(f.periodo.slice(0, 4))],
          ...(frecuencia === 'mensual' ? { meses: [Number(f.periodo.slice(5))] } : {}),
          grupos: [grupo],
        },
      })),
    ),
  };
}
export function modeloPareto(
  eventos: readonly EventoLectura[],
  campo: DimensionPareto,
  titulo: string,
): ModeloGrafico {
  const datos = pareto(eventos, campo);
  return {
    id: `pareto-${campo}`,
    titulo,
    tipo: 'pareto',
    unidad: 'Registros',
    descripcion: `${datos.conDato}/${datos.total} registros con dato; ${datos.sinDato} «No consta» fuera del ranking. La línea 80% es referencia descriptiva, no meta SSOMA.`,
    puntos: datos.filas.map((f) => ({
      etiqueta: f.categoria,
      valor: f.cantidad,
      acumulado: f.porcentajeAcumulado,
      detalle: f.contieneInferencia
        ? 'Texto de origen con inferencia; no es causa confirmada.'
        : undefined,
      filtros: { eventoIds: f.eventoIds },
    })),
  };
}
export function modeloCalor(
  eventos: readonly EventoLectura[],
  proyectos: readonly string[],
  anio: number,
): ModeloGrafico {
  const datos = mapaCalorProyectoMes(eventos, [anio], proyectos);
  return {
    id: `calor-${anio}`,
    titulo: `Proyecto × mes · ${anio}`,
    tipo: 'heatmap',
    categorias: datos.periodos,
    filas: [...proyectos],
    alto: 430,
    descripcion: `Sin registros no equivale a cero eventos. ${datos.sinMes.length} registros sin mes exacto.`,
    puntos: datos.filas.map((f) => ({
      etiqueta: `${f.proyecto} · ${f.periodo}`,
      x: f.periodo,
      y: f.proyecto,
      valor: f.cantidad,
      detalle: f.cobertura,
      filtros: { proyectos: [f.proyecto], anios: [anio], meses: [Number(f.periodo.slice(5))] },
    })),
  };
}
export function modeloMatriz(eventos: readonly EventoLectura[]): ModeloGrafico {
  const datos = matrizSeveridad(eventos);
  return {
    id: 'matriz',
    titulo: 'Severidad observada × potencial INCIMMET',
    tipo: 'heatmap',
    categorias: datos.niveles,
    filas: datos.niveles,
    alto: 430,
    descripcion: `${datos.completos} pares completos; ${datos.faltantes} con algún faltante. Color = cantidad, no aceptabilidad del riesgo. X: potencial; Y: nivel observado.`,
    puntos: datos.filas.map((f) => ({
      etiqueta: `${f.nivel} × ${f.potencial}`,
      x: f.potencial,
      y: f.nivel,
      valor: f.cantidad,
      filtros: {
        niveles: [f.nivel === 'No consta' ? null : f.nivel],
        potenciales: [f.potencial === 'No consta' ? null : f.potencial],
      },
    })),
  };
}
export function modeloCumplimiento(
  acciones: readonly AccionLectura[],
  por: 'proyecto' | 'evento',
): ModeloGrafico {
  const filas =
    por === 'proyecto' ? cumplimientoPorProyecto(acciones) : cumplimientoPorEvento(acciones);
  return {
    id: `cumplimiento-${por}`,
    titulo: `Estado verificado por ${por}`,
    tipo: 'stacked',
    categorias: filas.map((f) => f.clave),
    alto: 400,
    descripcion:
      'Cada acción se cuenta una vez. El alcance transversal no multiplica acciones. Los cierres importados con cobertura parcial conservan su advertencia.',
    puntos: ESTADOS_VERIFICADOS.flatMap((estado) =>
      filas.map((f) => ({
        etiqueta: f.clave,
        valor: f.estados[estado],
        serie: estado,
        detalle: `${f.cerradas}/${f.total} con cierre según el contexto; ${f.cierresImportadosParciales} importados parciales.`,
        filtros: {
          ...(por === 'proyecto' ? { proyectos: [f.clave] } : { eventoIds: [f.clave] }),
          estadosAccion: [estado],
        },
      })),
    ),
  };
}
export function modeloComparado(acciones: readonly AccionLectura[]): ModeloGrafico {
  const datos = cumplimientoComparado(acciones);
  return {
    id: 'cumplimiento-comparado',
    titulo: 'Cierre verificado frente a declaración explícita',
    tipo: 'grouped',
    unidad: '% de acciones del proyecto',
    descripcion:
      'Series independientes, no se suman. Declarado = texto de origen que afirma cierre; no incluye cierres sin declaración explícita.',
    categorias: datos.map((f) => f.proyecto),
    puntos: datos.flatMap((f) => [
      {
        etiqueta: f.proyecto,
        serie: 'Verificado',
        valor: f.porcentajeCierre,
        detalle: `${f.cerradas}/${f.total} acciones`,
        filtros: { proyectos: [f.proyecto] },
      },
      {
        etiqueta: f.proyecto,
        serie: 'Declarado explícitamente',
        valor: f.porcentajeDeclarado,
        detalle: `${f.declaradas}/${f.total} acciones`,
        filtros: { proyectos: [f.proyecto] },
      },
    ]),
  };
}
export function modeloCobertura(base: BaseNormalizada): ModeloGrafico {
  const datos = coberturaAnual(
    base.eventos,
    base.proyectos.map((p) => p.codigo),
  );
  return {
    id: 'cobertura',
    titulo: 'Cobertura documental · año × proyecto',
    tipo: 'heatmap',
    categorias: [...new Set(datos.map((f) => String(f.anio)))],
    filas: base.proyectos.map((p) => p.codigo),
    alto: 460,
    descripcion:
      'Celdas vacías = sin registros disponibles. El conjunto no es un censo homogéneo de todos los años y proyectos.',
    puntos: datos.map((f) => ({
      etiqueta: `${f.proyecto} · ${f.anio}`,
      x: String(f.anio),
      y: f.proyecto,
      valor: f.cantidad,
      filtros: { anios: [f.anio], proyectos: [f.proyecto] },
    })),
  };
}
```

## `lib/analytics/echarts-options.ts`

```ts
import type { EChartsOption, SeriesOption } from 'echarts';
import type { ModeloGrafico, PuntoGrafico } from './modelos';
import { COLORES_ESTADO, COLORES_GRUPO } from './modelos';
const colors = ['#0070C0', '#00B0F0', '#7C3AED', '#0F766E', '#64748B', '#1D7DCC'];
const color = (name: string, index: number) =>
  COLORES_ESTADO[name] ?? COLORES_GRUPO[name] ?? colors[index % colors.length];
/** All payloads are prepared in the domain. The chart never recomputes official rates. */
export function opcionesGrafico(
  modelo: ModeloGrafico,
  dark = false,
  reduced = false,
): EChartsOption {
  const foreground = dark ? '#E7E6E6' : '#0F172A';
  const border = dark ? '#475569' : '#E2E8F0';
  const cats = modelo.categorias ?? [...new Set(modelo.puntos.map((p) => p.etiqueta))];
  const seriesNames = [...new Set(modelo.puntos.flatMap((p) => (p.serie ? [p.serie] : [])))];
  const option: EChartsOption = {
    color: colors,
    backgroundColor: 'transparent',
    animation: !reduced,
    animationDuration: 250,
    animationDurationUpdate: reduced ? 0 : 180,
    textStyle: {
      color: foreground,
      fontFamily: 'Inter, system-ui, Arial, sans-serif',
      fontSize: 12,
    },
    aria: {
      enabled: true,
      description: `${modelo.titulo}. ${modelo.descripcion}`,
      decal: { show: true },
    },
    tooltip: { trigger: 'item', renderMode: 'richText', confine: true },
    grid: {
      top: seriesNames.length ? 70 : 22,
      left: 68,
      right: 28,
      bottom: cats.length > 10 ? 90 : 70,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: cats,
      axisLabel: {
        color: foreground,
        overflow: 'truncate',
        width: 95,
        rotate: cats.length > 6 ? 25 : 0,
      },
      axisLine: { lineStyle: { color: border } },
    },
    yAxis: {
      type: 'value',
      min: 0,
      axisLabel: { color: foreground },
      splitLine: { lineStyle: { color: border } },
    },
  };
  const datum = (p: PuntoGrafico) => ({
    name: p.etiqueta,
    value: p.valor,
    filtros: p.filtros,
    detalle: p.detalle,
  });
  if (modelo.tipo === 'heatmap') {
    option.xAxis = {
      type: 'category',
      data: cats,
      splitArea: { show: true },
      axisLabel: { color: foreground, rotate: cats.length > 8 ? 45 : 0, fontSize: 11 },
    };
    option.yAxis = {
      type: 'category',
      data: modelo.filas,
      splitArea: { show: true },
      axisLabel: { color: foreground },
    };
    option.grid = { left: 85, top: 16, bottom: 95, right: 20, containLabel: true };
    option.visualMap = {
      min: 0,
      max: Math.max(1, ...modelo.puntos.map((p) => p.valor ?? 0)),
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      calculable: true,
      inRange: { color: ['#D5EAF7', '#1D7DCC', '#002060'] },
      textStyle: { color: foreground },
    };
    option.series = [
      {
        type: 'heatmap',
        data: modelo.puntos
          .filter((p) => p.valor !== null)
          .map((p) => ({
            value: [cats.indexOf(p.x ?? ''), (modelo.filas ?? []).indexOf(p.y ?? ''), p.valor ?? 0],
            filtros: p.filtros,
          })),
        label: { show: true, color: '#FFFFFF', textBorderColor: '#002060', textBorderWidth: 2 },
        emphasis: { itemStyle: { borderColor: '#00B0F0', borderWidth: 2 } },
      },
    ];
    return option;
  }
  if (modelo.tipo === 'donut') {
    delete option.xAxis;
    delete option.yAxis;
    option.legend = { type: 'scroll', bottom: 0, textStyle: { color: foreground } };
    option.series = [
      {
        type: 'pie',
        radius: ['40%', '66%'],
        center: ['50%', '43%'],
        avoidLabelOverlap: true,
        label: { show: false },
        emphasis: { label: { show: true, color: foreground } },
        data: modelo.puntos.map((p, i) => ({
          ...datum(p),
          value: p.valor ?? 0,
          itemStyle: { color: color(p.etiqueta, i) },
        })),
      },
    ];
    return option;
  }
  if (modelo.tipo === 'pareto') {
    option.yAxis = [
      { type: 'value', min: 0, name: 'Registros', splitLine: { lineStyle: { color: border } } },
      { type: 'value', min: 0, max: 100, name: '% acumulado', splitLine: { show: false } },
    ];
    option.series = [
      {
        type: 'bar',
        name: 'Registros',
        data: modelo.puntos.map(datum),
        itemStyle: { color: '#0070C0' },
      },
      {
        type: 'line',
        name: '% acumulado',
        yAxisIndex: 1,
        symbolSize: 5,
        data: modelo.puntos.map((p) => ({ ...datum(p), value: p.acumulado ?? null })),
        itemStyle: { color: dark ? '#FFFFFF' : '#151F44' },
        markLine: {
          silent: true,
          symbol: 'none',
          data: [{ yAxis: 80, name: '80%' }],
          label: { formatter: '80%' },
          lineStyle: { type: 'dashed', color: '#7C3AED' },
        },
      },
    ];
  } else if (seriesNames.length) {
    option.legend = { type: 'scroll', top: 0, textStyle: { color: foreground } };
    option.series = seriesNames.map((serie, i): SeriesOption => {
      const shared = {
        name: serie,
        itemStyle: { color: color(serie, i) },
        data: cats.map((cat) => {
          const p = modelo.puntos.find((x) => x.etiqueta === cat && x.serie === serie);
          return p ? datum(p) : { name: cat, value: null };
        }),
      };
      return modelo.tipo === 'line'
        ? { ...shared, type: 'line', connectNulls: false, symbolSize: 4 }
        : {
            ...shared,
            type: 'bar',
            stack: modelo.tipo === 'stacked' ? 'total' : undefined,
            barMaxWidth: 50,
          };
    });
  } else {
    const shared = {
      name: modelo.unidad ?? 'Registros',
      data: modelo.puntos.map((p, i) => ({
        ...datum(p),
        itemStyle: { color: color(p.etiqueta, i) },
      })),
      ...(modelo.referencia === undefined
        ? {}
        : {
            markLine: {
              silent: true,
              symbol: 'none',
              data: [{ yAxis: modelo.referencia }],
              label: { formatter: 'Referencia fuente' },
            },
          }),
    };
    option.series =
      modelo.tipo === 'line'
        ? [{ ...shared, type: 'line', connectNulls: false }]
        : [{ ...shared, type: 'bar', barMaxWidth: 60 }];
  }
  if (cats.length > 10)
    option.dataZoom = [
      {
        type: 'slider',
        bottom: 4,
        height: 18,
        start: 0,
        end: Math.min(100, (18 / cats.length) * 100),
      },
      { type: 'inside', zoomOnMouseWheel: false },
    ];
  return option;
}
```

## `components/charts/chart-card.tsx`

```tsx
'use client';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { EChartsType } from 'echarts/core';
import type { Filtros } from '@/lib/types';
import type { ModeloGrafico } from '@/lib/analytics/modelos';
import { seleccionarMarca } from '@/lib/domain/analitica';
import { formatoFecha } from '@/lib/domain/fechas';
import { descargarCSV, descargarGraficoPNG } from '@/lib/client/descargas';
import { useFiltros } from '@/components/providers';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
const EChart = dynamic(() => import('./echart-view'), {
  ssr: false,
  loading: () => (
    <p className="flex min-h-[340px] items-center justify-center text-secondary" role="status">
      Preparando gráfico…
    </p>
  ),
});
export function ChartCard({
  modelo,
  corte,
  onSelect,
}: {
  modelo: ModeloGrafico;
  corte: string;
  onSelect?: (f: Partial<Filtros>) => void;
}) {
  const contenedor = useRef<HTMLElement>(null);
  const api = useRef<EChartsType | null>(null);
  const [visible, setVisible] = useState(false),
    [ready, setReady] = useState(false),
    [tabla, setTabla] = useState(false),
    [error, setError] = useState('');
  const { resolvedTheme } = useTheme();
  const uid = useId();
  const filtros = useFiltros((s) => s.filtros);
  const actualizar = useFiltros((s) => s.actualizar);
  const sincronizar = useCallback((chart: EChartsType | null) => {
    api.current = chart;
    setReady(Boolean(chart));
  }, []);
  useEffect(() => {
    if (!contenedor.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' },
    );
    observer.observe(contenedor.current);
    return () => observer.disconnect();
  }, []);
  const select = useCallback(
    (f: Partial<Filtros>) => {
      if (onSelect) {
        onSelect(f);
        return;
      }
      const siguiente = seleccionarMarca(filtros, f);
      // actualizar merges: explicitly clear the keys removed by a repeated mark.
      const parche = { ...siguiente };
      for (const key of Object.keys(f) as (keyof Filtros)[])
        if (!(key in siguiente)) Object.assign(parche, { [key]: undefined });
      actualizar(parche);
    },
    [actualizar, filtros, onSelect],
  );
  const notas = [
    modelo.procedencia ?? 'Detalle documental — no oficial',
    `Corte: ${formatoFecha(corte)} · Contexto: ${filtros.contexto ?? 'base'}`,
    modelo.descripcion,
    `Filtros: ${JSON.stringify(filtros)}`,
  ];
  const exportarCSV = () =>
    descargarCSV(
      modelo.titulo,
      ['Categoría', 'Serie', 'Valor', '% acumulado', 'Detalle'],
      modelo.puntos.map((p) => [
        p.etiqueta,
        p.serie ?? '',
        p.valor,
        p.acumulado ?? '',
        p.detalle ?? '',
      ]),
      notas,
    );
  const png = async () => {
    if (!api.current) return;
    try {
      setError('');
      await descargarGraficoPNG(
        api.current.getDataURL({
          type: 'png',
          pixelRatio: 2,
          backgroundColor: resolvedTheme === 'dark' ? '#1E293B' : '#FFFFFF',
        }),
        modelo.titulo,
        notas,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo exportar PNG');
    }
  };
  return (
    <section ref={contenedor} className="min-w-0 h-full" aria-labelledby={`${uid}-titulo`}>
      <Card className="h-full min-w-0 overflow-hidden p-5">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <h2 id={`${uid}-titulo`} className="text-base font-semibold leading-snug">
            {modelo.titulo}
          </h2>
          <span className="text-[11px] text-secondary">
            {modelo.procedencia ?? 'Detalle documental'}
          </span>
        </header>
        <p className="mt-2 text-xs leading-relaxed text-secondary">{modelo.descripcion}</p>
        <div className="mt-4 min-w-0">
          {visible ? (
            <EChart modelo={modelo} onSelect={select} onReady={sincronizar} />
          ) : (
            <div style={{ minHeight: modelo.alto ?? 340 }} className="bg-background" />
          )}
        </div>
        {!modelo.puntos.length && (
          <p className="py-3 text-sm" role="status">
            Sin registros para esta selección.
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <Button
            variant="outline"
            aria-expanded={tabla}
            aria-controls={`${uid}-datos`}
            onClick={() => setTabla(!tabla)}
          >
            Ver datos
          </Button>
          <Button
            variant="outline"
            onClick={exportarCSV}
            aria-label={`Exportar CSV: ${modelo.titulo}`}
          >
            CSV
          </Button>
          <Button
            variant="outline"
            disabled={!ready}
            onClick={() => {
              void png();
            }}
            aria-label={`Exportar PNG: ${modelo.titulo}`}
          >
            PNG
          </Button>
          <span className="ml-auto text-[11px] text-secondary">{formatoFecha(corte)}</span>
        </div>
        {error && (
          <p className="mt-3 text-sm text-red-700 dark:text-red-300" role="alert">
            {error}
          </p>
        )}
        {tabla && (
          <div
            id={`${uid}-datos`}
            role="region"
            aria-label={`Datos de ${modelo.titulo}`}
            tabIndex={0}
            className="mt-4 max-h-96 min-w-0 overflow-auto rounded border border-border"
          >
            <table>
              <caption className="sr-only">
                {modelo.titulo}. {modelo.descripcion}
              </caption>
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th>Serie</th>
                  <th>Valor</th>
                  {modelo.tipo === 'pareto' && <th>% acumulado</th>}
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {modelo.puntos.map((p, i) => (
                  <tr key={`${p.serie ?? ''}-${p.etiqueta}-${i}`}>
                    <td>
                      {p.filtros ? (
                        <button
                          className="min-h-11 text-left text-brand-blue underline dark:text-brand-cyan"
                          onClick={() => select(p.filtros ?? {})}
                          aria-label={`Filtrar ${p.etiqueta}${p.serie ? `, ${p.serie}` : ''}`}
                        >
                          {p.etiqueta}
                        </button>
                      ) : (
                        p.etiqueta
                      )}
                    </td>
                    <td>{p.serie ?? '—'}</td>
                    <td className="font-mono">
                      {p.valor === null
                        ? modelo.tipo === 'heatmap'
                          ? 'Sin registros en esta base'
                          : 'No consta'
                        : Number.isInteger(p.valor)
                          ? p.valor
                          : p.valor.toFixed(4)}
                    </td>
                    {modelo.tipo === 'pareto' && (
                      <td>{p.acumulado?.toFixed(2) ?? 'No calculable'}</td>
                    )}
                    <td>{p.detalle ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </section>
  );
}
```

## `components/charts/echart-view.tsx`

```tsx
'use client';
import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart, HeatmapChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  VisualMapComponent,
  DataZoomComponent,
  MarkLineComponent,
  AriaComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsType } from 'echarts/core';
import type { Filtros } from '@/lib/types';
import type { ModeloGrafico } from '@/lib/analytics/modelos';
import { opcionesGrafico } from '@/lib/analytics/echarts-options';
import { useReducedMotion } from '@/components/marketing/browser-state';
echarts.use([
  BarChart,
  LineChart,
  PieChart,
  HeatmapChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  VisualMapComponent,
  DataZoomComponent,
  MarkLineComponent,
  AriaComponent,
  CanvasRenderer,
]);
export default function EChartView({
  modelo,
  onSelect,
  onReady,
}: {
  modelo: ModeloGrafico;
  onSelect: (filtros: Partial<Filtros>) => void;
  onReady: (chart: EChartsType | null) => void;
}) {
  const host = useRef<HTMLDivElement>(null),
    chart = useRef<EChartsType | null>(null);
  const { resolvedTheme } = useTheme();
  const reduced = useReducedMotion();
  const seleccionar = useRef(onSelect);
  useEffect(() => {
    seleccionar.current = onSelect;
  }, [onSelect]);
  useEffect(() => {
    if (!host.current) return;
    const instance = echarts.init(host.current, undefined, { renderer: 'canvas' });
    chart.current = instance;
    instance.on('click', (event: unknown) => {
      const payload = event as { data?: { filtros?: Partial<Filtros> } };
      if (payload.data?.filtros) seleccionar.current(payload.data.filtros);
    });
    const resize = new ResizeObserver(() => instance.resize());
    resize.observe(host.current);
    onReady(instance);
    return () => {
      resize.disconnect();
      onReady(null);
      instance.dispose();
      chart.current = null;
    };
  }, [onReady]);
  useEffect(() => {
    chart.current?.setOption(opcionesGrafico(modelo, resolvedTheme === 'dark', reduced), {
      notMerge: true,
      lazyUpdate: true,
    });
  }, [modelo, resolvedTheme, reduced]);
  return (
    <div
      ref={host}
      className="w-full min-w-0"
      style={{ height: modelo.alto ?? 340 }}
      aria-label={modelo.titulo}
      role="img"
    />
  );
}
```

## `components/screens/dashboard.tsx`

```tsx
'use client';
import { useVista } from '@/lib/hooks/use-base';
import { FiltrosPanel } from '@/components/shell/filtros-panel';
import { ChartCard } from '@/components/charts/chart-card';
import { Kpis } from '@/components/analytics/kpis';
import { ReproduccionControls } from '@/components/analytics/reproduccion-controls';
import { modeloConteo, modeloTendencia, modeloCumplimiento } from '@/lib/analytics/modelos';
import { Titulo, EstadoConsulta, LinkContexto } from './shared';
export function Dashboard() {
  const v = useVista();
  if (!v.seleccion || !v.base)
    return (
      <EstadoConsulta
        loading={v.isPending}
        error={v.error}
        retry={() => {
          void v.refetch();
        }}
      />
    );
  const { eventos, acciones, cohorteAcciones } = v.seleccion;
  const corte = v.base.meta.fecha_corte_estados;
  const accidentes = eventos.filter((e) => e.tipoGrupo === 'Accidente');
  const niveles = modeloConteo(accidentes, 'nivelIncimmet', 'Accidentes a personas por nivel');
  niveles.puntos = niveles.puntos.map((p) => ({
    ...p,
    filtros: { ...p.filtros, grupos: ['Accidente'] },
  }));
  const hpri = modeloConteo(
    eventos.filter((e) => e.altoPotencial === true),
    'proyectoCodigo',
    'Alto potencial por proyecto',
  );
  hpri.puntos = hpri.puntos.map((p) => ({ ...p, filtros: { ...p.filtros, altoPotencial: true } }));
  return (
    <>
      <Titulo
        titulo="Dashboard ejecutivo"
        subtitulo={`${eventos.length} eventos y ${acciones.length} acciones en la selección. Volumen documental no equivale a tasa ajustada por exposición.`}
      />
      <FiltrosPanel />
      <ReproduccionControls />
      {v.isPlaceholderData && (
        <p role="status" className="mb-4 text-sm">
          Actualizando contexto de datos…
        </p>
      )}
      <Kpis eventos={eventos} acciones={cohorteAcciones} />
      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        {[
          modeloTendencia(eventos, 'anual'),
          modeloConteo(eventos, 'proyectoCodigo', 'Eventos por proyecto'),
          modeloConteo(eventos, 'tipoGrupo', 'Distribución por grupo', 'donut'),
          niveles,
          modeloCumplimiento(acciones, 'proyecto'),
          hpri,
        ].map((m) => (
          <ChartCard key={m.id} modelo={m} corte={corte} />
        ))}
      </div>
      <div className="mt-7 flex flex-wrap gap-5 text-sm">
        <LinkContexto href="/eventos">Ver eventos de la selección</LinkContexto>
        <LinkContexto href="/acciones">Revisar acciones y evidencia</LinkContexto>
        <LinkContexto href="/analisis">Indicadores oficiales y análisis avanzado</LinkContexto>
      </div>
    </>
  );
}
```

## `components/screens/analisis.tsx`

```tsx
'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useVista } from '@/lib/hooks/use-base';
import { FiltrosPanel } from '@/components/shell/filtros-panel';
import { ChartCard } from '@/components/charts/chart-card';
import { Tabs } from '@/components/ui/tabs';
import { IndicadoresPanel } from '@/components/analytics/indicadores-panel';
import {
  modeloTendencia,
  modeloPareto,
  modeloCalor,
  modeloMatriz,
  modeloConteo,
  modeloCumplimiento,
  modeloComparado,
  modeloCobertura,
  type ModeloGrafico,
} from '@/lib/analytics/modelos';
import { calidadCampos, avisosCalidad, type EntidadCalidad } from '@/lib/domain/analitica';
import { Titulo, EstadoConsulta, Tabla, LinkContexto } from './shared';
const tabs = [
  { id: 'tendencias', label: 'Tendencias' },
  { id: 'pareto', label: 'Pareto' },
  { id: 'severidad', label: 'Severidad / HPRI' },
  { id: 'indicadores', label: 'Indicadores oficiales' },
  { id: 'cumplimiento', label: 'Cumplimiento' },
  { id: 'calidad', label: 'Calidad de datos' },
];
export function Analisis() {
  const v = useVista();
  const search = useSearchParams();
  const vista = search.get('vista');
  const tab = tabs.some((t) => t.id === vista) ? vista! : 'tendencias';
  const setTab = (value: string) => {
    const query = new URLSearchParams(window.location.search);
    query.set('vista', value);
    window.history.pushState(null, '', `${window.location.pathname}?${query}`);
  };
  const [anio, setAnio] = useState(2026);
  const [entidad, setEntidad] = useState<EntidadCalidad>('eventos');
  if (!v.base || !v.seleccion)
    return (
      <EstadoConsulta
        loading={v.isPending}
        error={v.error}
        retry={() => {
          void v.refetch();
        }}
      />
    );
  const b = v.base,
    s = v.seleccion,
    corte = b.meta.fecha_corte_estados;
  const hpri = s.eventos.filter((e) => e.altoPotencial === true);
  const calidad = calidadCampos(
    { ...b, eventos: s.eventos, acciones: s.acciones, lecciones: s.lecciones },
    entidad,
  );
  const modeloNulos: ModeloGrafico = {
    id: `nulos-${entidad}`,
    titulo: `Nulos literales por campo · ${entidad}`,
    tipo: 'bar',
    unidad: '% nulos',
    descripcion:
      'Nulos, vacíos, «No consta» textual y claves ausentes se informan por separado en la tabla. Los campos auxiliares y no aplicables no implican incumplimiento.',
    puntos: calidad.map((f) => ({
      etiqueta: f.campo,
      valor: f.porcentajeNulos,
      filtros: f.eventoIdsNulos.length ? { eventoIds: f.eventoIdsNulos } : undefined,
      detalle: `${f.nulos}/${f.total} null; ${f.vacios} vacíos; ${f.noConsta} No consta; ${f.ausentes} claves ausentes`,
    })),
  };
  let contenido;
  if (tab === 'tendencias')
    contenido = (
      <>
        <div className="mb-5 flex flex-wrap items-center gap-4">
          <label className="grid gap-2 text-sm">
            Año del mapa de calor
            <select value={anio} onChange={(e) => setAnio(Number(e.target.value))}>
              {[...new Set(b.eventos.map((e) => e.anio))]
                .sort((a, c) => c - a)
                .map((a) => (
                  <option key={a}>{a}</option>
                ))}
            </select>
          </label>
          <span className="text-xs text-secondary">
            Además se aplican los filtros globales. Una selección incompatible deja celdas sin
            registros.
          </span>
        </div>
        <div className="grid min-w-0 gap-6 xl:grid-cols-2">
          {[modeloTendencia(s.eventos, 'anual'), modeloTendencia(s.eventos, 'mensual')].map((m) => (
            <ChartCard key={m.id} modelo={m} corte={corte} />
          ))}
        </div>
        <div className="mt-6">
          <ChartCard
            modelo={modeloCalor(
              s.eventos,
              b.proyectos.map((p) => p.codigo),
              anio,
            )}
            corte={corte}
          />
        </div>
      </>
    );
  else if (tab === 'pareto')
    contenido = (
      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        {(
          [
            ['tipo', 'Tipos de evento'],
            ['riesgoCritico', 'Riesgos críticos'],
            ['actividad', 'Actividades'],
            ['equipo', 'Equipos'],
            ['causasInmediatas', 'Textos de causas inmediatas'],
            ['causasBasicas', 'Textos de causas básicas'],
          ] as const
        ).map(([campo, titulo]) => (
          <ChartCard
            key={campo}
            modelo={modeloPareto(s.eventos, campo, `Pareto · ${titulo}`)}
            corte={corte}
          />
        ))}
      </div>
    );
  else if (tab === 'severidad')
    contenido = (
      <>
        <div className="grid min-w-0 gap-6 xl:grid-cols-2">
          <ChartCard modelo={modeloMatriz(s.eventos)} corte={corte} />
          <ChartCard
            modelo={{
              ...modeloConteo(hpri, 'proyectoCodigo', 'HPRI por proyecto'),
              puntos: modeloConteo(hpri, 'proyectoCodigo', '').puntos.map((p) => ({
                ...p,
                filtros: { ...p.filtros, altoPotencial: true },
              })),
            }}
            corte={corte}
          />
          <ChartCard
            modelo={{
              ...modeloConteo(hpri, 'riesgoCritico', 'HPRI por riesgo'),
              puntos: modeloConteo(hpri, 'riesgoCritico', '').puntos.map((p) => ({
                ...p,
                filtros: { ...p.filtros, altoPotencial: true },
              })),
            }}
            corte={corte}
          />
        </div>
        <p className="mt-4 text-sm">
          {hpri.length} registros con bandera de alto potencial.{' '}
          <LinkContexto href="/eventos">Consultar eventos</LinkContexto>
        </p>
      </>
    );
  else if (tab === 'indicadores') contenido = <IndicadoresPanel base={b} />;
  else if (tab === 'cumplimiento')
    contenido = (
      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        {[
          modeloCumplimiento(s.acciones, 'proyecto'),
          modeloCumplimiento(s.acciones, 'evento'),
          modeloComparado(s.cohorteAcciones),
        ].map((m) => (
          <ChartCard key={m.id} modelo={m} corte={corte} />
        ))}
      </div>
    );
  else
    contenido = (
      <>
        <div className="mb-5 rounded border border-amber-400 bg-amber-50 p-4 text-sm text-slate-900">
          <h2 className="font-semibold">Brechas documentales</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            {avisosCalidad(b).map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
        <ChartCard modelo={modeloCobertura({ ...b, eventos: s.eventos })} corte={corte} />
        <label className="my-5 grid max-w-sm gap-2 text-sm">
          Entidad de calidad
          <select value={entidad} onChange={(e) => setEntidad(e.target.value as EntidadCalidad)}>
            {(['eventos', 'acciones', 'lecciones', 'proyectos'] as const).map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </label>
        <ChartCard modelo={modeloNulos} corte={corte} />
        <Tabla titulo="Ausencias por campo">
          <thead>
            <tr>
              <th>Campo</th>
              <th>Total</th>
              <th>Nulos</th>
              <th>% nulos</th>
              <th>Vacíos</th>
              <th>No consta textual</th>
              <th>Claves ausentes</th>
            </tr>
          </thead>
          <tbody>
            {calidad.map((r) => (
              <tr key={r.campo}>
                <td>{r.campo}</td>
                <td>{r.total}</td>
                <td>{r.nulos}</td>
                <td>{r.porcentajeNulos?.toFixed(2) ?? 'No calculable'}</td>
                <td>{r.vacios}</td>
                <td>{r.noConsta}</td>
                <td>{r.ausentes}</td>
              </tr>
            ))}
          </tbody>
        </Tabla>
      </>
    );
  return (
    <>
      <Titulo
        titulo="Análisis avanzado"
        subtitulo={`${s.eventos.length} registros en el contexto. Gráficos enlazados, tablas accesibles y exportaciones con procedencia.`}
      />
      <FiltrosPanel />
      <Tabs tabs={tabs} value={tab} onChange={setTab}>
        {contenido}
      </Tabs>
    </>
  );
}
```

## `components/screens/eventos.tsx`

```tsx
'use client';
import { useMemo, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useVista } from '@/lib/hooks/use-base';
import type { EventoLectura } from '@/lib/types';
import { formatoFecha } from '@/lib/domain/fechas';
import { eventHref } from '@/lib/domain/analitica';
import { descargarCSV } from '@/lib/client/descargas';
import { useFiltros } from '@/components/providers';
import { FiltrosPanel } from '@/components/shell/filtros-panel';
import { Button } from '@/components/ui/button';
import { Titulo, EstadoConsulta, Tabla, LinkContexto } from './shared';
const VACIO: EventoLectura[] = [];
export function Eventos() {
  'use no memo'; // TanStack Table usa un objeto mutable; React Compiler no debe memoizar este adaptador.
  const v = useVista(),
    actualizar = useFiltros((s) => s.actualizar);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'fecha', desc: true }]);
  const columnas = useMemo<ColumnDef<EventoLectura>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'Evento',
        cell: ({ row }) => (
          <LinkContexto href={eventHref(row.original.id)}>{row.original.id}</LinkContexto>
        ),
      },
      {
        accessorKey: 'fecha',
        header: 'Fecha',
        cell: ({ row }) => (
          <span className="whitespace-nowrap">{formatoFecha(row.original.fecha)}</span>
        ),
        sortUndefined: 'last',
      },
      { accessorKey: 'proyectoCodigo', header: 'Proyecto' },
      { accessorKey: 'tipo', header: 'Tipo' },
      {
        accessorKey: 'nivelIncimmet',
        header: 'Nivel INCIMMET',
        cell: ({ row }) => row.original.nivelIncimmet ?? 'No consta',
      },
      {
        accessorKey: 'altoPotencial',
        header: 'Alto potencial',
        cell: ({ row }) =>
          row.original.altoPotencial === true
            ? 'Sí, marcado'
            : row.original.altoPotencial === null
              ? 'Por confirmar'
              : 'No marcado',
      },
      {
        accessorKey: 'confianza',
        header: 'Confianza',
        cell: ({ row }) => row.original.confianza ?? 'No consta',
      },
    ],
    [],
  );
  const table = useReactTable({
    data: v.seleccion?.eventos ?? VACIO,
    columns: columnas,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
    autoResetPageIndex: true,
  });
  if (!v.seleccion || !v.base)
    return (
      <EstadoConsulta
        loading={v.isPending}
        error={v.error}
        retry={() => {
          void v.refetch();
        }}
      />
    );
  const exportar = () => {
    const rows = table.getSortedRowModel().rows.map((x) => x.original);
    descargarCSV(
      'Eventos SSOMA filtrados',
      [
        'ID',
        'Fecha',
        'Hora',
        'Proyecto',
        'Cliente',
        'Grupo',
        'Tipo',
        'Nivel INCIMMET',
        'Potencial INCIMMET',
        'HPRI',
        'Riesgo',
        'Labor',
        'Actividad',
        'Equipo',
        'Descripción',
        'Días perdidos',
        'Estado origen',
        'Confianza',
        'Fuentes',
      ],
      rows.map((e) => [
        e.id,
        e.fecha,
        e.hora,
        e.proyectoCodigo,
        e.cliente,
        e.tipoGrupo,
        e.tipo,
        e.nivelIncimmet,
        e.pgIncimmet,
        e.altoPotencial,
        e.riesgoCritico,
        e.area,
        e.actividad,
        e.equipo,
        e.descripcion,
        e.diasPerdidos,
        e.estadoOrigen,
        e.confianza,
        e.fuentes,
      ]),
      [
        'Conteos del detalle; no son indicadores oficiales.',
        `Corte documental: ${v.base?.meta.fecha_corte_estados}`,
        `Filtros: ${JSON.stringify(v.filtros)}`,
      ],
    );
  };
  return (
    <>
      <Titulo
        titulo="Eventos"
        subtitulo={`${v.seleccion.eventos.length} registros de la selección. El orden y la exportación incluyen todo el resultado filtrado, no solo la página visible.`}
      />
      <FiltrosPanel />
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <label className="grid min-w-0 flex-1 gap-2 text-sm">
          Buscar en eventos
          <input
            type="search"
            className="min-w-0"
            value={v.filtros.busqueda ?? ''}
            onChange={(e) => actualizar({ busqueda: e.target.value || undefined }, 'replace')}
            placeholder="Código, descripción, actividad…"
          />
        </label>
        <Button onClick={exportar}>Exportar eventos CSV</Button>
      </div>
      <Tabla titulo="Eventos documentados">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th
                  key={h.id}
                  aria-sort={
                    h.column.getIsSorted() === 'asc'
                      ? 'ascending'
                      : h.column.getIsSorted() === 'desc'
                        ? 'descending'
                        : 'none'
                  }
                >
                  <button
                    type="button"
                    className="min-h-11 text-left"
                    onClick={h.column.getToggleSortingHandler()}
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}{' '}
                    {h.column.getIsSorted() === 'asc'
                      ? '↑'
                      : h.column.getIsSorted() === 'desc'
                        ? '↓'
                        : '↕'}
                  </button>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </Tabla>
      {!v.seleccion.eventos.length && (
        <p className="mt-4" role="status">
          Sin registros para esta selección. Pruebe limpiar los filtros.
        </p>
      )}
      <nav aria-label="Paginación de eventos" className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.firstPage()}
        >
          Primera
        </Button>
        <Button
          variant="outline"
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
        >
          Anterior
        </Button>
        <span className="px-2 text-sm" role="status">
          Página {table.getState().pagination.pageIndex + 1} de {Math.max(1, table.getPageCount())}
        </span>
        <Button
          variant="outline"
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
        >
          Siguiente
        </Button>
        <Button
          variant="outline"
          disabled={!table.getCanNextPage()}
          onClick={() => table.lastPage()}
        >
          Última
        </Button>
        <label className="ml-auto flex items-center gap-2 text-sm">
          Filas
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </nav>
    </>
  );
}
```

## `components/screens/evento-detalle.tsx`

```tsx
'use client';
import { useQuery } from '@tanstack/react-query';
import { useVista } from '@/lib/hooks/use-base';
import { useDataSource } from '@/components/providers';
import { formatoFecha } from '@/lib/domain/fechas';
import type { EventoJson } from '@/lib/types';
import { Card, CardTitle } from '@/components/ui/card';
import { SourceChips } from '@/components/events/source-chips';
import { Titulo, EstadoConsulta, LinkContexto } from './shared';
const CAMPOS: Record<keyof EventoJson, string> = {
  id: 'Identificador',
  fecha: 'Fecha del evento',
  fecha_texto: 'Fecha indicada como texto',
  anio: 'Año',
  mes: 'Mes',
  hora: 'Hora',
  proyecto: 'Proyecto',
  cliente: 'Cliente según evento',
  area: 'Labor / área',
  actividad: 'Actividad',
  puesto_rol: 'Rol de persona afectada',
  equipo: 'Equipo',
  tipo: 'Tipo',
  tipo_grupo: 'Grupo',
  clasificacion_fuente: 'Clasificación de la fuente',
  nivel_incimmet: 'Nivel INCIMMET',
  pg_incimmet: 'Potencial de gravedad INCIMMET',
  nivel_cliente: 'Nivel del cliente',
  pg_cliente: 'Potencial de gravedad del cliente',
  severidad_texto: 'Severidad textual',
  alto_potencial: 'Alto potencial marcado',
  riesgo_critico: 'Riesgo crítico',
  zona_cuerpo: 'Zona corporal general',
  descripcion: 'Descripción original',
  causas_inmediatas: 'Causas inmediatas',
  causas_basicas: 'Causas básicas',
  dias_perdidos: 'Días perdidos consignados',
  costo: 'Costo consignado (moneda no estructurada)',
  costo_texto: 'Costo textual',
  penalidad: 'Penalidad textual',
  empresa_tipo: 'Tipo de empresa',
  empresa_detalle: 'Empresa según fuente',
  estado: 'Estado de origen',
  n_acciones: 'Número de acciones importado',
  lecciones: 'Referencias de lecciones',
  fuentes: 'Fuentes documentales',
  confianza: 'Nivel de confianza',
  observaciones: 'Observaciones de origen',
};
function valor(v: unknown): string {
  if (v === null || v === undefined) return 'No consta';
  if (Array.isArray(v)) return v.length ? v.join(' · ') : 'Sin vínculos registrados';
  if (typeof v === 'boolean') return v ? 'Sí' : 'No marcado';
  return String(v);
}
const ciclo = [
  'Reportado',
  'En investigación',
  'Investigado',
  'Acciones definidas',
  'En seguimiento',
  'Cerrado',
  'Lección publicada',
];
export function EventoDetalle({ id, local = false }: { id: string; local?: boolean }) {
  const v = useVista(local ? 'base+local' : undefined),
    source = useDataSource();
  const historial = useQuery({
    queryKey: ['historial', id],
    queryFn: () => source.getHistorial(id),
  });
  if (!v.base)
    return (
      <EstadoConsulta
        loading={v.isPending}
        error={v.error}
        retry={() => {
          void v.refetch();
        }}
      />
    );
  const e = v.base.eventos.find((x) => x.id === id);
  if (!e)
    return (
      <>
        <h1>Evento no disponible en este contexto</h1>
        <p className="mt-4">
          El contexto de proyecto o reproducción no incluye este registro. Los reportes locales solo
          existen en el dispositivo donde se guardaron.
        </p>
        <p className="mt-4">
          <LinkContexto href="/eventos">Volver a eventos</LinkContexto>
        </p>
      </>
    );
  const acciones = v.base.acciones.filter((a) => a.eventoId === id),
    lecciones = v.base.lecciones.filter((l) => l.eventoIds.includes(id));
  const campos = e.original
    ? Object.entries(e.original).filter(
        ([k]) => !['fuentes', 'lecciones', 'descripcion'].includes(k),
      )
    : Object.entries(e).filter(
        ([k]) => !['original', 'fuentes', 'descripcion', 'leccionIds'].includes(k),
      );
  return (
    <>
      <p className="mb-4">
        <LinkContexto href="/eventos">← Resultados</LinkContexto>
      </p>
      <Titulo
        titulo={e.id}
        subtitulo={`${e.proyectoCodigo} · ${formatoFecha(e.fecha)} · ${e.tipo} · ${e.origen === 'local' ? 'Demo local, sin envío al servidor' : 'Base documental'}`}
      />
      <div className="mb-5 flex flex-wrap gap-2">
        <span className="status-badge">Confianza: {e.confianza ?? 'No consta'}</span>
        <span className="status-badge">Estado de origen: {e.estadoOrigen ?? 'No consta'}</span>
        {e.altoPotencial && (
          <span className="rounded border border-amber-400 bg-amber-50 px-3 py-2 text-sm font-semibold text-slate-900">
            Alto potencial
          </span>
        )}
      </div>
      <Card>
        <CardTitle>Descripción de origen</CardTitle>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{e.descripcion}</p>
        <p className="mt-4 text-xs text-secondary">
          Se conservan las clasificaciones, inferencias y discrepancias del documento original. No
          se presume investigación concluida.
        </p>
      </Card>
      <Card className="mt-6">
        <CardTitle>Ficha completa</CardTitle>
        <dl className="mt-5 grid gap-5 text-sm sm:grid-cols-2">
          {campos.map(([k, x]) => (
            <div key={k} className="min-w-0 border-b border-border pb-3">
              <dt className="font-semibold">{CAMPOS[k as keyof EventoJson] ?? k}</dt>
              <dd className="mt-1 whitespace-pre-wrap break-words leading-relaxed text-secondary">
                {k === 'fecha' ? formatoFecha(x as string | null) : valor(x)}
              </dd>
            </div>
          ))}
        </dl>
      </Card>
      <Card className="mt-6">
        <CardTitle>Ciclo de vida</CardTitle>
        <p className="mt-2 text-sm text-secondary">
          Fecha del hecho: {formatoFecha(e.fecha)}. No equivale a la fecha de reporte o de cierre.
        </p>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {ciclo.map((etapa) => (
            <li className="rounded-md border border-border p-3 text-sm" key={etapa}>
              <p className="font-semibold">{etapa}</p>
              <p className="mt-2 text-xs text-secondary">
                {e.origen === 'local' && etapa === 'Reportado' && e.creadoEn
                  ? `Registro local: ${new Date(e.creadoEn).toLocaleString('es-PE', { timeZone: 'America/Lima' })}`
                  : 'Fecha de transición: No consta'}
              </p>
            </li>
          ))}
        </ol>
        <h3 className="mt-6 text-base font-semibold">Historial local registrado</h3>
        {historial.error ? (
          <p role="status" className="mt-2 text-sm">
            No se pudo leer el historial de este dispositivo: {historial.error.message}
          </p>
        ) : historial.isPending ? (
          <p role="status" className="mt-2 text-sm">
            Consultando historial…
          </p>
        ) : historial.data?.length ? (
          <ol className="mt-3 space-y-3">
            {historial.data.map((h) => (
              <li key={h.id} className="border-l-2 border-brand-accent pl-3 text-sm">
                <p>
                  {new Date(h.fecha).toLocaleString('es-PE', { timeZone: 'America/Lima' })} ·{' '}
                  {h.rol}
                </p>
                <p className="text-secondary">{h.descripcion}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-sm text-secondary">
            No hay transiciones locales registradas. No se inventa un historial retrospectivo.
          </p>
        )}
      </Card>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardTitle>Acciones vinculadas · {acciones.length}</CardTitle>
          {acciones.map((a) => (
            <div key={a.id} className="border-b border-border py-4 text-sm">
              <LinkContexto href={`/acciones?accion=${encodeURIComponent(a.id)}`}>
                {a.id}
              </LinkContexto>
              <p className="my-2">{a.descripcion}</p>
              <span className="status-badge" data-estado={a.estadoVerificado}>
                {a.estadoVerificado}
              </span>
              {a.coberturaParcial && (
                <p className="mt-2 font-medium">
                  Advertencia: evidencia documental de alcance parcial.
                </p>
              )}
            </div>
          ))}
          {!acciones.length && (
            <p className="mt-4 text-sm">Sin acciones registradas. Esto no acredita cierre.</p>
          )}
        </Card>
        <Card>
          <CardTitle>Lecciones vinculadas · {lecciones.length}</CardTitle>
          {lecciones.map((l) => (
            <div key={l.id} className="border-b border-border py-4 text-sm">
              <LinkContexto href={`/lecciones?leccion=${encodeURIComponent(l.id)}`}>
                {l.id} · {l.riesgoCritico}
              </LinkContexto>
              <p className="mt-2">{l.leccion}</p>
            </div>
          ))}
          {!lecciones.length && <p className="mt-4 text-sm">Sin lecciones vinculadas.</p>}
        </Card>
      </div>
      <Card className="mt-6">
        <CardTitle>Fuentes documentales</CardTitle>
        <div className="mt-4">
          <SourceChips referencias={e.fuentes} documentos={v.base.documentosFuente} />
        </div>
        <p className="mt-4 text-xs text-secondary">
          Los códigos identifican documentos; no abren archivos inexistentes. Se conserva su
          ubicación de origen.
        </p>
      </Card>
    </>
  );
}
```

## `components/screens/acciones.tsx`

```tsx
'use client';
import { useEffect, useState } from 'react';
import { useVista } from '@/lib/hooks/use-base';
import { formatoFecha, fechaLima } from '@/lib/domain/fechas';
import { semaforoFecha, ESTADOS_VERIFICADOS } from '@/lib/domain/estadoVerificado';
import { eventHref } from '@/lib/domain/analitica';
import type { AccionLectura } from '@/lib/types';
import { FiltrosPanel } from '@/components/shell/filtros-panel';
import { EvidenceDialog } from '@/components/actions/evidence-dialog';
import { ChartCard } from '@/components/charts/chart-card';
import { modeloComparado } from '@/lib/analytics/modelos';
import { Button } from '@/components/ui/button';
import { Titulo, EstadoConsulta, Tabla, LinkContexto } from './shared';
function Plazo({ accion, corte }: { accion: AccionLectura; corte: string }) {
  const plazo = semaforoFecha(accion.fechaCompromiso, corte);
  return (
    <span className="block text-sm">
      <span>{formatoFecha(accion.fechaCompromiso)}</span>
      <span
        className="mt-2 block rounded border border-border p-2 text-xs deadline"
        data-plazo={plazo.estado}
      >
        {plazo.etiqueta}
        {accion.estadoVerificado === 'Cerrada con evidencia'
          ? ' · Acción cerrada según estado mostrado'
          : ''}
      </span>
    </span>
  );
}
function Estado({ a }: { a: AccionLectura }) {
  return (
    <>
      <span className="status-badge" data-estado={a.estadoVerificado}>
        {a.estadoVerificado}
      </span>
      {a.estadoOperativo && (
        <p className="mt-2 text-xs">Evaluación local · Origen: {a.estadoImportado}</p>
      )}
      {a.coberturaParcial && (
        <p className="mt-2 text-xs font-semibold">Advertencia: cobertura importada parcial</p>
      )}
    </>
  );
}
export function Acciones() {
  const v = useVista();
  const [vista, setVista] = useState<'lista' | 'kanban'>('lista'),
    [seleccionada, setSeleccionada] = useState(''),
    [estadoMovil, setEstadoMovil] = useState<string>('');
  useEffect(() => {
    const abrir = () =>
      setSeleccionada(new URLSearchParams(window.location.search).get('accion') ?? '');
    const raf = requestAnimationFrame(abrir);
    window.addEventListener('popstate', abrir);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('popstate', abrir);
    };
  }, []);
  if (!v.seleccion || !v.base)
    return (
      <EstadoConsulta
        loading={v.isPending}
        error={v.error}
        retry={() => {
          void v.refetch();
        }}
      />
    );
  const base = v.base,
    acciones = v.seleccion.acciones,
    cohorte = v.seleccion.cohorteAcciones;
  const corte = (a: AccionLectura) =>
    a.estadoOperativo ? fechaLima(new Date()) : base.meta.fecha_corte_estados;
  const elegida = base.acciones.find((a) => a.id === seleccionada);
  const cerrar = () => {
    setSeleccionada('');
    const url = new URL(window.location.href);
    url.searchParams.delete('accion');
    window.history.replaceState(window.history.state, '', url);
  };
  return (
    <>
      <Titulo
        titulo="Registro de acciones"
        subtitulo={`${acciones.length} acciones. Lista y kanban muestran el estado verificado, nunca editable por arrastre. Archivo + revisión independiente + alcance suficiente habilitan el cierre local.`}
      />
      <FiltrosPanel />
      <div className="mb-5 flex flex-wrap gap-3" role="group" aria-label="Vista de acciones">
        <Button
          variant={vista === 'lista' ? 'default' : 'outline'}
          aria-pressed={vista === 'lista'}
          onClick={() => setVista('lista')}
        >
          Lista
        </Button>
        <Button
          variant={vista === 'kanban' ? 'default' : 'outline'}
          aria-pressed={vista === 'kanban'}
          onClick={() => setVista('kanban')}
        >
          Kanban
        </Button>
        <span className="self-center text-xs text-secondary">
          Corte de origen: {formatoFecha(base.meta.fecha_corte_estados)} · Sin cambios al JSON
          original
        </span>
      </div>
      {vista === 'lista' ? (
        <Tabla titulo="Acciones y evidencias">
          <thead>
            <tr>
              <th>Acción / origen</th>
              <th>Estado</th>
              <th>Compromiso</th>
              <th>Rol / jerarquía</th>
              <th>Evidencia</th>
            </tr>
          </thead>
          <tbody>
            {acciones.map((a) => (
              <tr key={a.id}>
                <td className="min-w-64">
                  <strong>
                    {a.id} · {a.proyectoCodigo}
                  </strong>
                  <p className="my-2 max-w-md text-sm leading-relaxed">{a.descripcion}</p>
                  <LinkContexto href={eventHref(a.eventoId)}>{a.eventoId}</LinkContexto>
                </td>
                <td>
                  <Estado a={a} />
                </td>
                <td>
                  <Plazo accion={a} corte={corte(a)} />
                </td>
                <td>
                  {a.responsableRol ?? 'No consta'}
                  <p className="mt-2 text-xs text-secondary">
                    {a.jerarquia} · {a.alcance}
                  </p>
                </td>
                <td>
                  <p className="mb-3 text-xs">
                    {a.referenciasEvidencia.join(', ') || 'Sin referencias'}
                  </p>
                  <Button variant="outline" onClick={() => setSeleccionada(a.id)}>
                    Adjuntar evidencia
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Tabla>
      ) : (
        <>
          <label className="mb-4 grid gap-2 text-sm xl:hidden">
            Columna de estado
            <select value={estadoMovil} onChange={(e) => setEstadoMovil(e.target.value)}>
              <option value="">Todos los estados</option>
              {ESTADOS_VERIFICADOS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <div
            role="region"
            aria-label="Kanban de acciones por estado verificado"
            tabIndex={0}
            className="grid min-w-0 items-start gap-4 xl:grid-cols-5"
          >
            {ESTADOS_VERIFICADOS.filter((s) => !estadoMovil || s === estadoMovil).map((s) => {
              const filas = acciones.filter((a) => a.estadoVerificado === s);
              return (
                <section key={s} className="min-w-0 rounded-lg border border-border bg-muted p-3">
                  <h2 className="mb-3 text-sm font-semibold leading-snug">
                    {s} <span className="ml-1">({filas.length})</span>
                  </h2>
                  <div className="max-h-[75vh] space-y-3 overflow-y-auto">
                    {filas.map((a) => (
                      <article
                        key={a.id}
                        className="kanban-card min-w-0 rounded-lg border border-border bg-card p-3"
                      >
                        <p className="text-sm font-semibold">
                          {a.id} · {a.proyectoCodigo}
                        </p>
                        <p className="my-3 text-xs leading-relaxed">{a.descripcion}</p>
                        <p className="mb-2 text-xs">
                          {a.responsableRol ?? 'Responsable: No consta'}
                        </p>
                        <Plazo accion={a} corte={corte(a)} />
                        {a.coberturaParcial && (
                          <p className="mt-2 text-xs font-semibold">Cobertura importada parcial</p>
                        )}
                        <div className="my-2 break-words text-xs">
                          <LinkContexto href={eventHref(a.eventoId)}>{a.eventoId}</LinkContexto>
                        </div>
                        <Button
                          variant="outline"
                          className="mt-2 w-full px-2 text-xs"
                          onClick={() => setSeleccionada(a.id)}
                        >
                          Adjuntar evidencia
                        </Button>
                      </article>
                    ))}
                    {!filas.length && <p className="py-5 text-xs">Sin acciones en esta columna.</p>}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}
      {!acciones.length && (
        <p className="mt-4" role="status">
          Sin acciones con estos filtros.
        </p>
      )}
      <div className="mt-8">
        <ChartCard modelo={modeloComparado(cohorte)} corte={base.meta.fecha_corte_estados} />
      </div>
      {elegida && <EvidenceDialog key={elegida.id} accion={elegida} base={base} onClose={cerrar} />}
    </>
  );
}
```

## `components/actions/evidence-dialog.tsx`

```tsx
'use client';
import * as Dialog from '@radix-ui/react-dialog';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { AccionLectura, BaseNormalizada, EvidenciaLocal } from '@/lib/types';
import { useDataSource, useFiltros, useSesion } from '@/components/providers';
import { descargarBlob } from '@/lib/client/descargas';
import { Button } from '@/components/ui/button';
function VistaArchivo({ evidencia }: { evidencia: EvidenciaLocal }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const objeto = URL.createObjectURL(evidencia.archivo.blob);
    const raf = requestAnimationFrame(() => setUrl(objeto));
    return () => {
      cancelAnimationFrame(raf);
      URL.revokeObjectURL(objeto);
    };
  }, [evidencia.archivo.blob]);
  return (
    <div className="mt-2">
      {evidencia.archivo.mime.startsWith('image/') && url && (
        <Image
          unoptimized
          width={320}
          height={220}
          src={url}
          alt={`Evidencia ${evidencia.archivo.nombre}`}
          className="max-h-56 max-w-full rounded object-contain"
        />
      )}
      <Button
        className="mt-2"
        variant="outline"
        onClick={() => descargarBlob(evidencia.archivo.blob, evidencia.archivo.nombre)}
      >
        Revisar archivo original
      </Button>
    </div>
  );
}
function Verificacion({
  ev,
  accion,
  base,
  onDone,
}: {
  ev: EvidenciaLocal;
  accion: AccionLectura;
  base: BaseNormalizada;
  onDone: (mensaje: string) => void;
}) {
  const source = useDataSource(),
    { actor } = useSesion(),
    actualizar = useFiltros((s) => s.actualizar);
  const [motivo, setMotivo] = useState(''),
    [cobertura, setCobertura] = useState<string[]>([]),
    [completo, setCompleto] = useState(false),
    [decision, setDecision] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const requeridos =
    accion.alcance === 'Todos los proyectos'
      ? base.proyectos.map((p) => p.codigo)
      : accion.alcance?.startsWith('OR, TA, UC')
        ? ['OR', 'TA', 'UC']
        : [accion.proyectoCodigo];
  const enviar = async () => {
    try {
      setBusy(true);
      setError('');
      if (!decision) throw new Error('Seleccione aceptar o rechazar');
      await source.validarEvidencia(
        ev.id,
        {
          aceptada: decision === 'aceptar',
          motivo,
          alcanceCompleto: completo,
          proyectosCubiertos: cobertura,
        },
        actor,
      );
      actualizar({ contexto: 'base+local' });
      onDone('Decisión registrada en la demo local; estado recalculado.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al validar');
    } finally {
      setBusy(false);
    }
  };
  if (ev.validacion)
    return (
      <div className="mt-3 rounded border border-border p-3 text-sm">
        <strong>{ev.validacion.aceptada ? 'Validada' : 'Rechazada'}</strong> · {ev.validacion.rol}
        <p className="mt-2">{ev.validacion.motivo}</p>
        <p className="mt-1 text-xs">
          {new Date(ev.validacion.fecha).toLocaleString('es-PE', { timeZone: 'America/Lima' })} ·
          Cobertura: {ev.validacion.proyectosCubiertos.join(', ') || 'No acreditada'}
        </p>
      </div>
    );
  if (actor.rol !== 'SSOMA corporativo')
    return <p className="mt-3 text-sm">Pendiente de validación por SSOMA corporativo.</p>;
  if (ev.subidoPorRol === actor.rol)
    return (
      <p className="mt-3 text-sm">
        No puede autovalidarse. La evidencia fue subida bajo el mismo rol. Registre la evidencia con
        el rol ejecutor y solicite revisión independiente.
      </p>
    );
  return (
    <fieldset className="mt-4 space-y-3 rounded border border-border p-4">
      <legend className="px-2 text-sm font-semibold">Validar evidencia</legend>
      <label className="grid gap-1 text-sm">
        Rol validador
        <select value={actor.rol} aria-label="Rol validador" disabled>
          <option>SSOMA corporativo</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        Decisión
        <select value={decision} onChange={(e) => setDecision(e.target.value)}>
          <option value="">Seleccione</option>
          <option value="aceptar">Aceptar</option>
          <option value="rechazar">Rechazar</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        Motivo de validación
        <textarea
          rows={3}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Pertinencia, suficiencia y observaciones de revisión. Sin datos personales."
        />
      </label>
      <p className="text-xs text-secondary">
        Alcance requerido: {requeridos.join(', ')}. La selección acredita únicamente lo revisado por
        el validador.
      </p>
      <div className="flex flex-wrap gap-2">
        {base.proyectos
          .filter((p) => requeridos.includes(p.codigo))
          .map((p) => (
            <label
              key={p.codigo}
              className="flex min-h-12 items-center gap-2 rounded border border-border px-3 text-sm"
            >
              <input
                type="checkbox"
                checked={cobertura.includes(p.codigo)}
                onChange={(e) =>
                  setCobertura(
                    e.target.checked
                      ? [...cobertura, p.codigo]
                      : cobertura.filter((v) => v !== p.codigo),
                  )
                }
              />
              {p.nombre}
            </label>
          ))}
      </div>
      <label className="flex min-h-12 items-start gap-3 text-sm">
        <input
          className="mt-1"
          type="checkbox"
          checked={completo}
          onChange={(e) => setCompleto(e.target.checked)}
        />
        Verifiqué el archivo, su pertinencia y la cobertura completa de la acción.
      </label>
      <Button
        disabled={busy}
        onClick={() => {
          void enviar();
        }}
      >
        Registrar validación
      </Button>
      {error && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
    </fieldset>
  );
}
export function EvidenceDialog({
  accion,
  base,
  onClose,
}: {
  accion: AccionLectura;
  base: BaseNormalizada;
  onClose: () => void;
}) {
  const source = useDataSource(),
    { actor } = useSesion(),
    actualizar = useFiltros((s) => s.actualizar);
  const [archivo, setArchivo] = useState<File | null>(null),
    [privacidad, setPrivacidad] = useState(false),
    [error, setError] = useState(''),
    [mensaje, setMensaje] = useState(''),
    [busy, setBusy] = useState(false),
    [rol, setRol] = useState(accion.responsableRol ?? ''),
    [fecha, setFecha] = useState(accion.fechaCompromiso ?? ''),
    [motivo, setMotivo] = useState('');
  const q = useQuery({
    queryKey: ['evidencias', accion.id],
    queryFn: () => source.getEvidencias(accion.id),
  });
  const historia = useQuery({
    queryKey: ['historial', accion.id],
    queryFn: () => source.getHistorial(accion.id),
  });
  const puedeAdjuntar =
    actor.rol === 'SSOMA corporativo' ||
    (actor.rol === 'Supervisor de campo' &&
      actor.proyectoCodigo === accion.proyectoCodigo &&
      !!actor.responsableRol &&
      actor.responsableRol === accion.responsableRol);
  const cargar = async () => {
    try {
      setBusy(true);
      setError('');
      setMensaje('');
      if (!archivo) throw new Error('Seleccione un archivo');
      if (!privacidad) throw new Error('Revise la privacidad del archivo antes de adjuntarlo');
      await source.adjuntarEvidencia(accion.id, archivo, actor);
      actualizar({ contexto: 'base+local' });
      setArchivo(null);
      setMensaje(
        'Archivo guardado en este dispositivo. Pendiente de validación; no enviado a un servidor.',
      );
      await q.refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo adjuntar');
    } finally {
      setBusy(false);
    }
  };
  const asignar = async () => {
    try {
      setBusy(true);
      setError('');
      await source.asignarAccion(accion.id, rol, fecha || null, motivo, actor);
      actualizar({ contexto: 'base+local' });
      setMensaje(
        'Asignación local guardada. El responsable de campo puede adjuntar con su contexto de proyecto y función.',
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo asignar');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/70" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90svh] w-[calc(100%_-_24px)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-xl border border-border bg-card p-5 text-foreground shadow-xl sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <Dialog.Title className="text-xl font-bold">
              Adjuntar evidencia · {accion.id}
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="outline" disabled={busy} aria-label="Cerrar evidencia">
                Cerrar
              </Button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-3 text-sm leading-relaxed text-secondary">
            {accion.descripcion} · {accion.proyectoCodigo}. Evidencia local de demostración, no
            certificación documental.
          </Dialog.Description>
          <p className="mt-3 text-sm">
            Estado mostrado: <strong>{accion.estadoVerificado}</strong>. Estado importado:{' '}
            {accion.estadoImportado}.
          </p>
          {accion.coberturaParcial && (
            <p className="mt-3 rounded border border-amber-500 bg-amber-50 p-3 text-sm text-slate-900">
              El cierre importado tiene alcance parcial. No acredita una nueva validación integral.
            </p>
          )}
          <p className="mt-3 text-xs text-secondary">
            Referencias históricas: {accion.referenciasEvidencia.join(', ') || 'Sin referencias'}.
            Son códigos, no archivos adjuntos.
          </p>
          {actor.rol === 'SSOMA corporativo' && (
            <details className="mt-5 rounded border border-border p-4">
              <summary className="cursor-pointer text-sm font-semibold">
                Asignación local de responsable y compromiso
              </summary>
              <div className="mt-3 space-y-3">
                <p className="text-xs text-secondary">
                  Origen: {accion.original.responsable_rol ?? 'No consta'}; fecha{' '}
                  {accion.original.fecha_compromiso ?? 'No consta'}. La modificación solo afecta la
                  demo local.
                </p>
                <label className="grid gap-1 text-sm">
                  Función responsable (no nombre personal)
                  <input value={rol} onChange={(e) => setRol(e.target.value)} />
                </label>
                <label className="grid gap-1 text-sm">
                  Fecha compromiso
                  <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                </label>
                <label className="grid gap-1 text-sm">
                  Motivo de asignación
                  <textarea rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
                </label>
                <Button
                  disabled={busy}
                  onClick={() => {
                    void asignar();
                  }}
                >
                  Guardar asignación local
                </Button>
              </div>
            </details>
          )}
          <section
            className="mt-5 space-y-3 rounded border border-border p-4"
            aria-label="Cargar archivo"
          >
            <h3 className="text-base font-semibold">Archivo y revisión de privacidad</h3>
            <p className="text-xs">
              JPEG, PNG, WebP o PDF; máximo 10 MB por archivo y 10 archivos por acción. No incluya
              nombres, DNI, diagnósticos ni rostros identificables.
            </p>
            <p className="text-sm">
              Rol ejecutor actual: {actor.rol}. Revisión posterior: SSOMA corporativo, con un rol
              distinto al de carga.
            </p>
            <label className="grid gap-2 text-sm">
              Archivo
              <input
                key={mensaje}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                disabled={!puedeAdjuntar || busy}
                onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                className="min-w-0 w-full text-xs"
              />
            </label>
            <label className="flex min-h-12 items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={privacidad}
                onChange={(e) => setPrivacidad(e.target.checked)}
                className="mt-1"
              />
              Revisé el archivo y no contiene información personal prohibida.
            </label>
            <Button
              disabled={!puedeAdjuntar || busy}
              onClick={() => {
                void cargar();
              }}
            >
              Guardar evidencia pendiente
            </Button>
            {!puedeAdjuntar && (
              <p className="text-sm">
                Seleccione el proyecto y la función responsable de esta acción; las acciones sin
                responsable requieren asignación por SSOMA.
              </p>
            )}
          </section>
          {mensaje && (
            <p role="status" className="mt-4 rounded border border-brand-accent p-3 text-sm">
              {mensaje}
            </p>
          )}
          {error && (
            <p role="alert" className="mt-4 rounded border border-red-500 p-3 text-sm">
              {error}
            </p>
          )}
          <h3 className="mt-6 text-base font-semibold">Archivos locales y validación</h3>
          {q.isPending && (
            <p role="status" className="mt-3 text-sm">
              Cargando evidencias…
            </p>
          )}
          {q.error && (
            <p role="alert" className="mt-3 text-sm">
              {q.error.message}
            </p>
          )}
          {q.data?.map((ev) => (
            <article key={ev.id} className="mt-4 rounded border border-border p-4">
              <p className="break-words text-sm font-semibold">
                {ev.archivo.nombre} · {(ev.archivo.bytes / 1024).toFixed(1)} KB
              </p>
              <p className="mt-2 text-xs text-secondary">
                Cargada como {ev.subidoPorRol} ·{' '}
                {new Date(ev.creadoEn).toLocaleString('es-PE', { timeZone: 'America/Lima' })}
              </p>
              <VistaArchivo evidencia={ev} />
              <Verificacion ev={ev} accion={accion} base={base} onDone={setMensaje} />
            </article>
          ))}
          {q.data?.length === 0 && (
            <p className="mt-3 text-sm">
              Sin archivos locales. Las referencias importadas no habilitan la validación.
            </p>
          )}
          <details className="mt-5 rounded border border-border p-3">
            <summary className="cursor-pointer text-sm font-semibold">Historial local</summary>
            {historia.data?.map((h) => (
              <p key={h.id} className="mt-3 text-xs leading-relaxed">
                {new Date(h.fecha).toLocaleString('es-PE', { timeZone: 'America/Lima' })} · {h.rol}:{' '}
                {h.descripcion}
              </p>
            ))}
            {!historia.data?.length && (
              <p className="mt-3 text-xs">Sin cambios locales registrados.</p>
            )}
          </details>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

## `components/screens/lecciones.tsx`

```tsx
'use client';
import Fuse from 'fuse.js';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useVista } from '@/lib/hooks/use-base';
import { textoLeccion, JERARQUIA_LECCION } from '@/lib/domain/lecciones';
import { textoBusqueda } from '@/lib/domain/filtros';
import { eventHref } from '@/lib/domain/analitica';
import { formatoFecha } from '@/lib/domain/fechas';
import { FiltrosPanel } from '@/components/shell/filtros-panel';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SourceChips } from '@/components/events/source-chips';
import { Titulo, EstadoConsulta, LinkContexto } from './shared';
const VACIAS: NonNullable<ReturnType<typeof useVista>['seleccion']>['lecciones'] = [];
export function Lecciones() {
  const v = useVista();
  const [q, setQ] = useState(''),
    [riesgo, setRiesgo] = useState(''),
    [actividad, setActividad] = useState(''),
    [proyecto, setProyecto] = useState(''),
    [ficha, setFicha] = useState(''),
    [error, setError] = useState(''),
    [generando, setGenerando] = useState('');
  const lecciones = v.seleccion?.lecciones ?? VACIAS;
  const index = useMemo(
    () =>
      new Fuse(
        lecciones.map((l) => ({ id: l.id, texto: textoLeccion(l), leccion: l })),
        { keys: ['texto'], threshold: 0.27, ignoreLocation: true },
      ),
    [lecciones],
  );
  const resultados = useMemo(
    () =>
      (q.trim() ? index.search(textoBusqueda(q)).map((r) => r.item.leccion) : lecciones).filter(
        (l) =>
          (!riesgo || l.riesgoCritico === riesgo) &&
          (!actividad || l.actividadCritica === actividad) &&
          (!proyecto || l.proyectoCodigos.includes(proyecto)) &&
          (!ficha || l.id === ficha),
      ),
    [q, index, lecciones, riesgo, actividad, proyecto, ficha],
  );
  useEffect(() => {
    const cargar = () => setFicha(new URLSearchParams(window.location.search).get('leccion') ?? '');
    const raf = requestAnimationFrame(cargar);
    window.addEventListener('popstate', cargar);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('popstate', cargar);
    };
  }, []);
  if (!v.base || !v.seleccion)
    return (
      <EstadoConsulta
        loading={v.isPending}
        error={v.error}
        retry={() => {
          void v.refetch();
        }}
      />
    );
  const base = v.base;
  const difundir = async (id: string) => {
    const l = lecciones.find((x) => x.id === id);
    if (!l) return;
    try {
      setError('');
      setGenerando(id);
      const { generarFichaDifusion } = await import('@/lib/client/ficha-difusion');
      await generarFichaDifusion(l, formatoFecha(base.meta.fecha_corte_estados));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear la ficha');
    } finally {
      setGenerando('');
    }
  };
  const limpiarBiblioteca = () => {
    setQ('');
    setRiesgo('');
    setActividad('');
    setProyecto('');
    setFicha('');
    const url = new URL(window.location.href);
    url.searchParams.delete('leccion');
    window.history.replaceState(window.history.state, '', url);
  };
  return (
    <>
      <Titulo
        titulo="Lecciones aprendidas"
        subtitulo={`${resultados.length} de ${lecciones.length} lecciones en el contexto. Catalogadas: no se infiere publicación formal ni eficacia de controles.`}
      />
      <FiltrosPanel />
      <section
        aria-label="Buscar en la biblioteca"
        className="mb-6 grid min-w-0 gap-4 rounded-lg border border-border bg-card p-5 sm:grid-cols-2 xl:grid-cols-4"
      >
        <label className="grid min-w-0 gap-2 text-sm sm:col-span-2">
          Búsqueda de texto completo
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Voladura, malla, equipos móviles…"
          />
        </label>
        <label className="grid min-w-0 gap-2 text-sm">
          Riesgo de la lección
          <select value={riesgo} onChange={(e) => setRiesgo(e.target.value)}>
            <option value="">Todos</option>
            {[...new Set(lecciones.map((l) => l.riesgoCritico))].sort().map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="grid min-w-0 gap-2 text-sm">
          Actividad crítica
          <select value={actividad} onChange={(e) => setActividad(e.target.value)}>
            <option value="">Todas</option>
            {[...new Set(lecciones.map((l) => l.actividadCritica))].sort().map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="grid min-w-0 gap-2 text-sm">
          Proyecto de origen
          <select value={proyecto} onChange={(e) => setProyecto(e.target.value)}>
            <option value="">Todos</option>
            {base.proyectos.map((p) => (
              <option key={p.codigo} value={p.codigo}>
                {p.nombre}
              </option>
            ))}
          </select>
        </label>
        <Button variant="outline" onClick={limpiarBiblioteca}>
          Limpiar biblioteca
        </Button>
        {ficha && <p className="text-sm">Ficha seleccionada: {ficha}</p>}
      </section>
      {error && (
        <p role="alert" className="mb-4 rounded border border-red-500 p-3">
          {error}
        </p>
      )}
      <div className="grid items-start gap-5 xl:grid-cols-2">
        {resultados.map((l) => (
          <Card key={l.id} className="min-w-0">
            <p className="mb-2 text-xs font-semibold text-secondary">
              {l.id} · {l.proyectoCodigos.join(', ')} · Catalogada
            </p>
            <CardTitle>{l.riesgoCritico}</CardTitle>
            <p className="mt-3 text-sm leading-relaxed">
              <strong>Qué pasó:</strong> {l.quePaso}
            </p>
            <p className="mt-3 text-sm leading-relaxed">
              <strong>Por qué:</strong> {l.porQue}
            </p>
            <p className="mt-3 text-sm leading-relaxed">
              <strong>Lección:</strong> {l.leccion}
            </p>
            <div className="mt-6">
              <h3 className="mb-3 text-sm font-semibold">Jerarquía de controles</h3>
              <ol className="control-pyramid">
                {JERARQUIA_LECCION.map(([key, label], i) => (
                  <li key={key} style={{ '--nivel': i } as CSSProperties}>
                    <h4>{label}</h4>
                    <p>{l.controles[key] ?? 'No consta'}</p>
                  </li>
                ))}
              </ol>
            </div>
            <p className="mt-4 text-sm">
              <strong>Actividad:</strong> {l.actividadCritica}
            </p>
            <p className="mt-3 text-sm">
              <strong>Aplicabilidad:</strong> {l.aplicabilidad}
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              {l.eventoIds.map((id) => (
                <LinkContexto key={id} href={eventHref(id)}>
                  {id}
                </LinkContexto>
              ))}
            </div>
            <div className="mt-4">
              <SourceChips referencias={l.fuentes} documentos={base.documentosFuente} />
            </div>
            <Button
              className="mt-5 w-full"
              disabled={!!generando}
              onClick={() => {
                void difundir(l.id);
              }}
            >
              {generando === l.id ? 'Generando ficha…' : 'Generar ficha de difusión'}
            </Button>
            <p className="mt-2 text-xs text-secondary">
              PNG generado en este navegador. No se transmite información ni se acredita
              capacitación.
            </p>
          </Card>
        ))}
      </div>
      {!resultados.length && (
        <p role="status" className="rounded border border-border p-6">
          No hay lecciones con estos criterios. Pruebe otros términos o limpie los filtros.
        </p>
      )}
    </>
  );
}
```

## `lib/client/ficha-difusion.ts`

```ts
import type { LeccionLectura } from '../types';
import { partirLineas } from '../domain/textoCanvas';
import { formatoFecha } from '../domain/fechas';
import { filasDifusion } from '../domain/lecciones';
import { descargarBlob } from './descargas';
/** Dibujo propio en canvas. No depende de servicios externos ni transmite el texto de la lección. */
export async function generarFichaDifusion(l: LeccionLectura, corte: string): Promise<void> {
  const canvas = document.createElement('canvas');
  canvas.width = 1440;
  let ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas no disponible para generar la ficha');
  const ancho = 1264,
    izquierda = 88,
    tamaño = 28,
    interlineado = 42;
  const partir = (texto: string) => partirLineas(texto, ancho, (t) => ctx!.measureText(t).width);
  ctx.font = `${tamaño}px Arial`;
  const filas = filasDifusion(l).map((f) => ({ ...f, lineas: partir(f.texto) }));
  ctx.font = 'bold 30px Arial';
  const titulo = partir(l.riesgoCritico);
  canvas.height =
    410 + titulo.length * 48 + filas.reduce((n, f) => n + 90 + f.lineas.length * interlineado, 0);
  // Si el contenido crece, dividir en láminas; nunca recortar silenciosamente la fuente.
  if (canvas.height > 24000)
    throw new Error(
      'La lección excede el tamaño admitido para una sola ficha PNG; no se recortó el contenido.',
    );
  ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo preparar la ficha');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#151F44';
  ctx.fillRect(0, 0, canvas.width, 230 + titulo.length * 48);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 48px Arial';
  ctx.fillText('INCIMMET', izquierda, 82);
  ctx.font = '24px Arial';
  ctx.fillStyle = '#9CDCF5';
  ctx.fillText('Hagamos el camino juntos · Charla de 5 minutos', izquierda, 124);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 30px Arial';
  titulo.forEach((line, i) => ctx!.fillText(line, izquierda, 190 + i * 48));
  let y = 280 + titulo.length * 48;
  ctx.fillStyle = '#475569';
  ctx.font = '24px Arial';
  ctx.fillText(`${l.id} · Catalogada · Corte documental ${formatoFecha(corte)}`, izquierda, y);
  y += 65;
  for (const f of filas) {
    ctx.fillStyle = '#0070C0';
    ctx.font = 'bold 25px Arial';
    ctx.fillText(f.titulo, izquierda, y);
    y += 45;
    ctx.fillStyle = '#0F172A';
    ctx.font = `${tamaño}px Arial`;
    for (const line of f.lineas) {
      ctx.fillText(line, izquierda, y);
      y += interlineado;
    }
    y += 45;
  }
  ctx.font = '22px Arial';
  ctx.fillStyle = '#475569';
  ctx.fillText(
    'Ficha de difusión de demo. Generarla no acredita lectura, capacitación ni cierre de acciones.',
    izquierda,
    y + 10,
  );
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('No se pudo generar el archivo PNG'))),
      'image/png',
    ),
  );
  descargarBlob(blob, `INCIMMET_${l.id}_difusion.png`);
}
```

## `store/sesion.ts`

```ts
import { createStore } from 'zustand/vanilla';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ActorDemo } from '@/lib/types';

interface SesionState {
  actor: ActorDemo;
  hidratado: boolean;
  cambiar: (actor: ActorDemo) => void;
  completarHidratacion: () => void;
}
/** Scope = current browser tab. Role simulation is not authentication. */
export function crearStoreSesion() {
  return createStore<SesionState>()(
    persist(
      (set) => ({
        actor: { rol: 'Gerencia' },
        hidratado: false,
        cambiar: (actor) => set({ actor }),
        completarHidratacion: () => set({ hidratado: true }),
      }),
      {
        name: 'incimmet-sesion-demo-v1',
        storage: createJSONStorage(() => sessionStorage),
        skipHydration: true,
        partialize: (state) => ({ actor: state.actor }),
        merge: (persisted, current) => {
          const saved = persisted as { actor?: ActorDemo } | undefined;
          const actor = saved?.actor;
          if (
            !actor ||
            !['Gerencia', 'SSOMA corporativo', 'Supervisor de campo'].includes(actor.rol)
          )
            return current;
          return { ...current, actor };
        },
      },
    ),
  );
}
export type StoreSesion = ReturnType<typeof crearStoreSesion>;
```

## `components/three/data-moments.tsx`

```tsx
'use client';
import { useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  CanvasTexture,
  Color,
  Group,
  InstancedMesh,
  Object3D,
  SRGBColorSpace,
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
import type { Vec3 } from '@/lib/domain/cinematica';

function Glyphs({
  datos,
  esfera = false,
  emisivo = false,
  nombre,
}: {
  datos: readonly InstanciaDato[];
  esfera?: boolean;
  emisivo?: boolean;
  nombre: string;
}) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const obj = new Object3D();
    const color = new Color();
    datos.forEach((d, i) => {
      obj.position.set(...d.posicion);
      obj.scale.set(...d.escala);
      obj.rotation.set(...(d.rotacion ?? [0, 0, 0]));
      obj.updateMatrix();
      mesh.setMatrixAt(i, obj.matrix);
      color.set(d.color).multiplyScalar(emisivo ? (d.intensidad ?? 1) : 1);
      mesh.setColorAt(i, color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [datos, emisivo]);
  if (!datos.length) return null;
  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, datos.length]}
      name={nombre}
      frustumCulled={false}
    >
      {esfera ? <sphereGeometry args={[1, 8, 6]} /> : <boxGeometry args={[1, 1, 1]} />}
      {emisivo ? (
        <meshBasicMaterial vertexColors toneMapped={false} />
      ) : (
        <meshStandardMaterial vertexColors roughness={0.6} metalness={0.2} />
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
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 384;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo dibujar el rótulo 3D');
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
    tx.anisotropy = 2;
    return tx;
  }, [titulo, valor, detalle]);
  useEffect(() => () => texture.dispose(), [texture]);
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
function Beacon({
  position,
  id,
  index,
  pulse,
}: {
  position: Vec3;
  id: string;
  index: number;
  pulse: boolean;
}) {
  const tip = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (!pulse || !tip.current) return;
    const scale = 1 + Math.sin(clock.elapsedTime * 1.6 + index * 0.25) * 0.12;
    tip.current.scale.setScalar(scale);
  });
  return (
    <group position={position} name={`baliza-${id}`}>
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
        <meshBasicMaterial color={[3, 1.6, 0]} toneMapped={false} />
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
  const grupos = useRef<(Group | null)[]>([]);
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
  useFrame(() => {
    const escena = timeline.current * 7;
    grupos.current.forEach((g, i) => {
      if (g) g.visible = Math.abs(i - escena) < 1.02;
    });
  });
  const registrar = (i: number) => (g: Group | null) => {
    grupos.current[i] = g;
  };
  return (
    <group name="relato-tridimensional-de-datos">
      <group ref={registrar(0)} position={[0.8, 0, -3]} name="momento-01-portal-documental">
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
      </group>
      <group
        ref={registrar(1)}
        position={[1.7, 2.9, -15]}
        name="momento-02-constelacion-de-eventos"
      >
        <Glyphs datos={puntos} esfera emisivo nombre="un-punto-por-evento" />
        <Label
          titulo="BASE DOCUMENTAL"
          valor={String(data.eventos)}
          detalle="Un punto por registro · color por grupo"
          position={[0, -2.05, 0.1]}
          width={2.25}
          height={0.95}
        />
      </group>
      <group ref={registrar(2)} position={[1.1, 0, -27]} name="momento-03-porticos-por-proyecto">
        {estaciones.map((p) => (
          <group key={p.codigo} position={p.posicion} name={`estacion-${p.codigo}`}>
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
          </group>
        ))}
      </group>
      <group ref={registrar(3)} position={[1.55, 2.75, -39]} name="momento-04-tableros-oficiales">
        {indicadores.map((v, i) => (
          <group
            key={v.sigla}
            position={[(i - 1) * 1.2, i === 1 ? 0.25 : 0, 0]}
            rotation={[0, (1 - i) * 0.08, 0]}
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
          </group>
        ))}
      </group>
      <group
        ref={registrar(4)}
        position={[1.3, 0, -51]}
        name="momento-05-balizas-de-alto-potencial"
      >
        {data.balizas.map((b, i) => (
          <Beacon
            key={b.id}
            id={b.id}
            index={i}
            pulse={pulse}
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
      </group>
      <group ref={registrar(5)} position={[1.45, 2.75, -64]} name="momento-06-muro-de-evidencias">
        <Glyphs datos={abiertas} nombre="acciones-sin-cierre-verificado" />
        <Glyphs datos={cerradas} emisivo nombre="acciones-con-cierre-segun-corte" />
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
      </group>
      <group ref={registrar(6)} position={[1.2, 0, -76]} name="momento-07-estaciones-del-ciclo">
        {data.ciclo.map((c, i) => (
          <group key={c.titulo} position={[(i % 2) * 1.45 - 0.5, 0, -Math.floor(i / 2) * 1.65]}>
            <Portal width={1.1} height={1.85} color="#00B0F0" />
            <Label
              titulo={c.titulo}
              valor={String(c.cantidad)}
              detalle={c.detalle}
              position={[0, 1.13, 0.04]}
              width={1.05}
              height={1.12}
            />
          </group>
        ))}
        <mesh position={[0.25, 0.035, -1.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.12, 7.5]} />
          <meshBasicMaterial color={[0, 0.9, 2]} toneMapped={false} />
        </mesh>
      </group>
      <group ref={registrar(7)} name="momento-08-salida-al-aprendizaje">
        <group position={[0, 0, -93]}>
          <Portal width={6.5} height={5.8} color="#DFEAF0" />
          <mesh position={[0, 3, -14]}>
            <planeGeometry args={[35, 22]} />
            <meshBasicMaterial color="#EEDBC2" toneMapped={false} />
          </mesh>
          <mesh position={[3.4, 5, -11]}>
            <sphereGeometry args={[2, 24, 16]} />
            <meshBasicMaterial color={[2, 1.75, 1.25]} toneMapped={false} />
          </mesh>
          <Label
            titulo="HAGAMOS EL CAMINO JUNTOS"
            valor={String(data.lecciones)}
            detalle="lecciones catalogadas"
            position={[1.5, 2, -0.1]}
            width={2.8}
            height={1.3}
          />
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
      </group>
    </group>
  );
}
```

## `components/three/mine-canvas.tsx`

```tsx
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
import { PerformanceMonitor } from '@react-three/drei';
import {
  ACESFilmicToneMapping,
  Color,
  Fog,
  Group,
  Object3D,
  PointLight,
  SRGBColorSpace,
} from 'three';
import {
  degradarCalidad,
  perfilCalidad,
  puedeMedirRendimiento,
  type Calidad3D,
  type MotivoFallback3D,
} from '@/lib/domain/cinematica';
import type { ResumenPresentacion } from '@/lib/domain/presentacion';
import { TunnelGeometry } from './tunnel-geometry';
import { CameraRig } from './camera-rig';
import { Atmosphere } from './atmosphere';
import { DataMoments } from './data-moments';
const HighBloom = lazy(() => import('./high-bloom'));
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
function Lighting({ timeline }: { timeline: RefObject<number> }) {
  const group = useRef<Group>(null);
  const light = useRef<PointLight>(null);
  const fog = useRef<Fog>(null);
  const colors = useMemo(
    () => ({
      navy: new Color('#071427'),
      amber: new Color('#42351b'),
      warm: new Color('#9b8773'),
      cyan: new Color('#6bbbef'),
      gold: new Color('#ffc87c'),
    }),
    [],
  );
  const target = useMemo(() => new Object3D(), []);
  useFrame(({ camera, scene }) => {
    const p = timeline.current * 7,
      risk = Math.max(0, 1 - Math.abs(p - 4)),
      exit = Math.max(0, p - 6);
    if (group.current) {
      group.current.position.copy(camera.position);
      group.current.quaternion.copy(camera.quaternion);
    }
    if (light.current) {
      light.current.color.copy(colors.cyan).lerp(colors.gold, Math.max(risk, exit));
      light.current.intensity = 55 + exit * 45;
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
        <primitive object={target} position={[1, 0, -16]} />
        <spotLight
          position={[0.2, 0.3, -0.3]}
          target={target}
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
/** Inactivo: never; arranque/movimiento/balizas: always; lectura estática: demand. */
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
      >
        <ContextGuard onFallback={onFallback} onReady={onReady} />
        <Warmup key={`warm-${quality}`} done={warmed} />
        <CameraRig active={active} onMotion={onMotion} timeline={timeline} />
        <Lighting timeline={timeline} />
        <TunnelGeometry quality={quality} />
        <DataMoments data={data} timeline={timeline} pulse={active && pulse} />
        <Atmosphere quality={quality} moving={busy} />
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
```

## `components/three/atmosphere.tsx`

```tsx
'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferAttribute, BufferGeometry, Color, DoubleSide, Group, ShaderMaterial } from 'three';
import { aleatorioSemilla, perfilCalidad, type Calidad3D } from '@/lib/domain/cinematica';

const vertex = `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const fragment = `
  varying vec2 vUv; uniform float uTime; uniform float uOpacity; uniform vec3 uColor;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise(vec2 p){vec2 i=floor(p), f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);}
  void main(){
    vec2 uv=vUv; float edge=smoothstep(0.0,0.18,uv.x)*(1.0-smoothstep(0.82,1.0,uv.x))*smoothstep(0.0,0.22,uv.y)*(1.0-smoothstep(0.75,1.0,uv.y));
    float density=noise(uv*4.0+vec2(uTime*0.018,0.0))*0.65+noise(uv*9.0-vec2(0.0,uTime*0.012))*0.35;
    gl_FragColor=vec4(uColor,density*edge*uOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

/** Niebla local por capas volumétricas: sin raymarching ni postprocesado de pantalla completa. */

function MistLayer({ z, opacity, moving }: { z: number; opacity: number; moving: boolean }) {
  const matRef = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: opacity },
      uColor: { value: new Color('#9cb6ce') },
    }),
    [opacity],
  );
  useFrame((_state, delta) => {
    const m = matRef.current;
    if (moving && m?.uniforms.uTime) m.uniforms.uTime.value += Math.min(delta, 0.05);
  });
  return (
    <mesh position={[0, 2.6, z]}>
      <planeGeometry args={[7.4, 4.7]} />
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        side={DoubleSide}
        uniforms={uniforms}
        vertexShader={vertex}
        fragmentShader={fragment}
      />
    </mesh>
  );
}
function Mist({ layers, moving }: { layers: number; moving: boolean }) {
  return (
    <group name="niebla-volumetrica-por-capas">
      {Array.from({ length: layers }, (_, i) => (
        <MistLayer key={i} z={-10 - i * 12} opacity={0.035 + i * 0.006} moving={moving} />
      ))}
    </group>
  );
}
function Dust({ count, moving }: { count: number; moving: boolean }) {
  const group = useRef<Group>(null);
  const time = useRef(0);
  const geometry = useMemo(() => {
    const random = aleatorioSemilla(1820),
      positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++)
      positions.set([(random() - 0.5) * 6.5, 0.5 + random() * 4, 7 - random() * 101], i * 3);
    const buffer = new BufferGeometry();
    buffer.setAttribute('position', new BufferAttribute(positions, 3));
    buffer.computeBoundingSphere();
    return buffer;
  }, [count]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame((_state, delta) => {
    if (!moving || !group.current) return;
    time.current += Math.min(delta, 0.05);
    group.current.position.y = Math.sin(time.current * 0.15) * 0.09;
    group.current.position.x = Math.sin(time.current * 0.1) * 0.06;
  });
  return (
    <group ref={group} name="polvo-en-suspension">
      <points geometry={geometry}>
        <pointsMaterial
          color="#bbccdb"
          size={0.035}
          transparent
          opacity={0.4}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </group>
  );
}
export function Atmosphere({ quality, moving }: { quality: Calidad3D; moving: boolean }) {
  const profile = perfilCalidad(quality);
  return (
    <>
      {profile.capasNiebla > 0 && <Mist layers={profile.capasNiebla} moving={moving} />}
      {profile.polvo > 0 && <Dust count={profile.polvo} moving={moving} />}
    </>
  );
}
```

## `scripts/verify-dependencies.mjs`

```javascript
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const manifest = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const directas = { ...manifest.dependencies, ...manifest.devDependencies };
let invalid = false;
const fallo = (message) => {
  invalid = true;
  console.error(message);
};
for (const [name, version] of Object.entries(directas)) {
  if (!/^\d+\.\d+\.\d+(-[a-z0-9.-]+)?$/i.test(version)) {
    fallo(`Versión directa no fijada: ${name} ${version}`);
  }
}
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
function ejecutar(args) {
  const result = spawnSync(npm, args, {
    encoding: 'utf8',
    maxBuffer: 40 * 1024 * 1024,
    shell: process.platform === 'win32',
  });
  if (result.error || result.status !== 0) {
    fallo(`No se pudo verificar npm ${args.join(' ')}. Ejecute npm install y revise el árbol.`);
    console.error(result.error?.message ?? result.stderr);
    return null;
  }
  try {
    return JSON.parse(result.stdout);
  } catch {
    fallo(`npm ${args.join(' ')} no devolvió JSON válido.`);
    return null;
  }
}
const tree = ejecutar(['ls', '--all', '--json']);
if (tree)
  for (const [name, version] of Object.entries(directas)) {
    if (tree.dependencies?.[name]?.version !== version)
      fallo(`La versión instalada de ${name} no coincide con ${version}.`);
  }
// --long reports physical locations. Repeated deduplicated references to the same
// path are not separate installations; two versions OR two locations are rejected.
for (const pkg of ['react', 'three', 'playwright-core']) {
  const subtree = ejecutar(['ls', pkg, '--all', '--json', '--long']);
  if (!subtree) continue;
  const ubicaciones = new Set();
  const versiones = new Set();
  const visitar = (node) => {
    for (const [name, dependency] of Object.entries(node.dependencies ?? {})) {
      if (name === pkg) {
        if (dependency.version) versiones.add(dependency.version);
        const location = dependency.path;
        if (location && fs.existsSync(location)) ubicaciones.add(fs.realpathSync(location));
      }
      visitar(dependency);
    }
  };
  visitar(subtree);
  const directPath = path.resolve('node_modules', pkg);
  if (fs.existsSync(directPath)) ubicaciones.add(fs.realpathSync(directPath));
  if (versiones.size !== 1 || ubicaciones.size !== 1)
    fallo(
      `${pkg}: se requiere una sola instalación. Versiones: ${[...versiones].join(', ') || 'ausente'}; rutas: ${[...ubicaciones].join(', ') || 'ausente'}`,
    );
  else console.log(`${pkg}: instalación única ${[...versiones][0]}`);
}
console.log(
  invalid
    ? 'Dependencias NO verificadas.'
    : 'Versiones fijadas y árbol sin conflictos ni duplicados de React, Three y Playwright core.',
);
process.exitCode = invalid ? 1 : 0;
```

## `package.json`

```json
{
  "name": "incimmet-ssoma-platform",
  "version": "0.4.0",
  "private": true,
  "engines": {
    "node": ">=20.19.0 <25",
    "npm": ">=9.2.0"
  },
  "scripts": {
    "dev": "next dev",
    "build": "npm run lint && npm run typecheck && next build --webpack",
    "start": "next start",
    "lint": "eslint . --max-warnings=0",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:domain:portable": "tsc -p tsconfig.domain.json && node scripts/domain-smoke.cjs",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "verify:data": "node scripts/verify-data.mjs",
    "verify:syntax": "node scripts/syntax-check.cjs",
    "test:cinematica:portable": "tsc -p tsconfig.domain.json && node scripts/cinematica-smoke.cjs",
    "test:e2e": "playwright test",
    "verify:step3": "npm run verify:data && npm test && npm run build && npm run test:e2e",
    "verify:deps": "node scripts/verify-dependencies.mjs",
    "typecheck:e2e": "tsc --noEmit -p tsconfig.e2e.json",
    "verify:step4": "npm run verify:deps && npm run verify:data && npm run format:check && npm run lint && npm run typecheck && npm run typecheck:e2e && npm test && npm run build",
    "audit:prod": "npm audit --omit=dev",
    "test:analytics:portable": "tsc -p tsconfig.domain.json && node scripts/analytics-smoke.cjs"
  },
  "dependencies": {
    "next": "16.4.0",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "@radix-ui/react-slot": "1.2.3",
    "@radix-ui/react-label": "2.1.7",
    "@tanstack/react-query": "5.90.5",
    "class-variance-authority": "0.7.1",
    "clsx": "2.1.1",
    "idb": "8.0.3",
    "lucide-react": "0.468.0",
    "next-themes": "0.4.6",
    "tailwind-merge": "2.6.0",
    "zustand": "5.0.8",
    "three": "0.175.0",
    "@react-three/fiber": "9.4.0",
    "@react-three/drei": "10.0.7",
    "gsap": "3.13.0",
    "server-only": "0.0.1",
    "echarts": "6.1.0",
    "@tanstack/react-table": "8.21.3",
    "fuse.js": "7.1.0",
    "@radix-ui/react-dialog": "1.1.15"
  },
  "devDependencies": {
    "@types/node": "20.19.9",
    "@types/react": "19.2.2",
    "@types/react-dom": "19.2.2",
    "@vitest/coverage-v8": "4.1.11",
    "autoprefixer": "10.4.21",
    "eslint": "9.39.1",
    "eslint-config-next": "16.4.0",
    "eslint-config-prettier": "10.1.8",
    "fake-indexeddb": "6.2.4",
    "postcss": "8.5.29",
    "prettier": "3.9.9",
    "tailwindcss": "3.4.17",
    "typescript": "5.9.3",
    "vite": "6.4.4",
    "vitest": "4.1.11",
    "@types/three": "0.175.0",
    "@playwright/test": "1.56.1",
    "@axe-core/playwright": "4.10.2",
    "tailwindcss-animate": "1.0.7",
    "playwright-core": "1.56.1"
  },
  "overrides": {
    "postcss": "$postcss",
    "vite": "$vite",
    "playwright-core": "$playwright-core",
    "react": "$react",
    "react-dom": "$react-dom",
    "three": "$three",
    "picomatch@<2.3.2": "2.3.2",
    "picomatch@>=3.0.0 <3.0.2": "3.0.2",
    "picomatch@>=4.0.0 <4.0.4": "4.0.4"
  }
}
```

## `tsconfig.e2e.json`

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "incremental": false
  },
  "include": ["tests/e2e/**/*.ts", "playwright.config.ts"],
  "exclude": ["node_modules"]
}
```
