import { AlmacenLocal } from '../data/indexedDB';
import type { DataSource } from '../data/DataSource';
import type { ActorDemo } from '../types';
import type { BorradorCampo, EnvioCampo } from './types';
import { textosFormulario } from './formulario';
import { exigirPrivacidad } from '../domain/privacidad';
/** Los reportes se entregan al adaptador; la demo devuelve solo acuse local. */
export class ColaCampo {
  private running: Promise<number> | null = null;
  constructor(private readonly almacen = new AlmacenLocal()) {}
  async guardarBorrador(b: BorradorCampo): Promise<void> {
    exigirPrivacidad(textosFormulario(b.formulario, b.fotos));
    const tx = (await this.almacen.abrir()).transaction(['envios', 'borradores'], 'readwrite');
    if (!(await tx.objectStore('envios').get(b.id))) await tx.objectStore('borradores').put(b);
    await tx.done;
  }
  async borradores(actor: ActorDemo): Promise<BorradorCampo[]> {
    return (await (await this.almacen.abrir()).getAll('borradores'))
      .filter((b) => b.formulario.proyectoCodigo === actor.proyectoCodigo)
      .sort((a, b) => b.actualizadoEn.localeCompare(a.actualizadoEn));
  }
  async eliminarBorrador(id: string): Promise<void> {
    await (await this.almacen.abrir()).delete('borradores', id);
  }
  async encolar(e: EnvioCampo): Promise<void> {
    exigirPrivacidad([
      e.reporte.area,
      e.reporte.descripcion,
      e.reporte.actividad ?? '',
      e.reporte.equipo ?? '',
      e.reporte.riesgoCritico ?? '',
      e.reporte.accionesInmediatas,
      ...e.reporte.personas.map((p) => p.rol),
      ...e.reporte.fotos.map((f) => f.name),
    ]);
    const db = await this.almacen.abrir();
    const tx = db.transaction(['envios', 'borradores'], 'readwrite');
    // Same id cannot overwrite an already queued or acknowledged report.
    if (await tx.objectStore('envios').get(e.id)) {
      await tx.done;
      throw new Error('Este reporte ya está en la cola. Use Reintentar, no cree otra copia.');
    }
    await tx.objectStore('envios').add(e);
    await tx.objectStore('borradores').delete(e.id);
    await tx.done;
  }
  async envios(actor: ActorDemo): Promise<EnvioCampo[]> {
    return (await (await this.almacen.abrir()).getAll('envios'))
      .filter((e) => e.reporte.proyectoCodigo === actor.proyectoCodigo)
      .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
  }
  sincronizar(source: DataSource, actor: ActorDemo, online: boolean): Promise<number> {
    if (!online) return Promise.resolve(0);
    if (this.running) return this.running;
    this.running = this.procesar(source, actor).finally(() => {
      this.running = null;
    });
    return this.running;
  }
  private async procesar(source: DataSource, actor: ActorDemo): Promise<number> {
    let count = 0;
    const db = await this.almacen.abrir();
    for (const e of await this.envios(actor)) {
      if (e.estado === 'registrado_demo_local') continue;
      try {
        // Reconstruct File objects after storage; never generate a different idempotency key.
        const fotos = e.reporte.fotos.map(
          (f, i) =>
            new File([f], f.name || `foto-${i + 1}.jpg`, {
              type: f.type,
              lastModified: f.lastModified,
            }),
        );
        const result = await source.crearReporte({ ...e.reporte, fotos }, e.actor);
        await source.procesarColaLocal(e.actor);
        await db.put('envios', {
          ...e,
          estado: 'registrado_demo_local',
          intentos: e.intentos + 1,
          ultimoError: null,
          acuseLocal: result.id,
        });
        count++;
      } catch (error) {
        await db.put('envios', {
          ...e,
          estado: 'error',
          intentos: e.intentos + 1,
          ultimoError:
            error instanceof Error ? error.message : 'No se pudo registrar en la demo local',
          acuseLocal: null,
        });
      }
    }
    return count;
  }
}
