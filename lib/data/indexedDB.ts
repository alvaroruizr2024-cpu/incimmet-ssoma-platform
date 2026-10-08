import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { DataJson, AsignacionLocal, EvidenciaLocal, HitoLocal, ReporteLocal } from '../types';
import type { BorradorCampo, EnvioCampo } from '../pwa/types';
import { DEMO } from '../config/demo';
export interface DemoDB extends DBSchema {
  borradores: { key: string; value: BorradorCampo };
  envios: { key: string; value: EnvioCampo };
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
    if (this.promesa) return this.promesa;
    const pending = openDB<DemoDB>(this.nombre, 3, {
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
        if (oldVersion < 3) {
          db.createObjectStore('borradores', { keyPath: 'id' });
          db.createObjectStore('envios', { keyPath: 'id' });
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
    this.promesa = pending;
    return pending;
  }
  async cerrar(): Promise<void> {
    const db = await this.promesa;
    db?.close();
    this.promesa = undefined;
  }
}
