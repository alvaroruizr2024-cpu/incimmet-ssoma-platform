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
    const tx = db.transaction(
      ['reportes', 'evidencias', 'historial', 'asignaciones', 'borradores', 'envios'],
      'readwrite',
    );
    await Promise.all([
      tx.objectStore('reportes').clear(),
      tx.objectStore('evidencias').clear(),
      tx.objectStore('historial').clear(),
      tx.objectStore('asignaciones').clear(),
      tx.objectStore('borradores').clear(),
      tx.objectStore('envios').clear(),
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
