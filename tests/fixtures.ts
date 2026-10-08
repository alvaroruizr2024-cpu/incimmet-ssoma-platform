import { readFileSync } from 'node:fs';
import { validarDocumento } from '@/lib/data/validarDocumento';
import { normalizarDocumento } from '@/lib/data/normalizar';
import type { ActorDemo, EvidenciaLocal, ReporteCampo } from '@/lib/types';
export const data = validarDocumento(
  JSON.parse(readFileSync(new URL('../public/data/data.json', import.meta.url), 'utf8')),
);
export const base = normalizarDocumento(data);
export const corte = data.meta.fecha_corte_estados;
export const supervisor: ActorDemo = {
  rol: 'Supervisor de campo',
  proyectoCodigo: 'EP',
  responsableRol: 'Gerencia de Proyecto',
};
export const ssoma: ActorDemo = { rol: 'SSOMA corporativo' };
export const ahora = () => new Date('2026-10-07T17:00:00-05:00');
export function archivo() {
  return new File(['Archivo sintético de prueba, no evidencia real'], 'prueba.pdf', {
    type: 'application/pdf',
  });
}
export function evidenciaValida(): EvidenciaLocal {
  const file = archivo();
  return {
    id: 'EVD-PRUEBA',
    accionId: 'AC-166',
    creadoEn: '2026-10-07T10:00:00-05:00',
    subidoPorRol: 'Supervisor de campo',
    archivo: {
      nombre: file.name,
      mime: file.type,
      bytes: file.size,
      blob: file,
      huella: 'solo-prueba',
    },
    validacion: {
      aceptada: true,
      rol: 'SSOMA corporativo',
      fecha: '2026-10-07T11:00:00-05:00',
      motivo: 'Prueba sintética de la regla; no acredita un cierre real',
      alcanceCompleto: true,
      proyectosCubiertos: data.proyectos.map((p) => p.codigo),
    },
  };
}
export function reporte(): ReporteCampo {
  return {
    idempotencia: 'reporte-test-0001',
    proyectoCodigo: 'EP',
    fecha: '2026-09-11',
    hora: '10:00',
    area: 'Solo prueba automatizada',
    tipo: 'En investigación',
    tipoGrupo: 'En investigación',
    actividad: null,
    equipo: null,
    riesgoCritico: null,
    altoPotencial: null,
    descripcion: 'Prueba sintética de guardado. No es un evento real.',
    personas: [],
    accionesInmediatas: 'Prueba de formulario; no representa una acción ejecutada.',
    revisionPrivacidad: true,
    fotos: [],
  };
}
