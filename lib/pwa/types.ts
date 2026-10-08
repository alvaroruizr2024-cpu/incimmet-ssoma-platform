import type { ActorDemo, ReporteCampo, PersonaReporte } from '../types';
export interface FormularioCampo {
  proyectoCodigo: string;
  fecha: string;
  hora: string;
  area: string;
  tipo: string;
  actividad: string;
  equipo: string;
  riesgoCritico: string;
  potencial: 'si' | 'no' | 'confirmar';
  descripcion: string;
  personaAfectada: 'si' | 'no' | '';
  personas: PersonaReporte[];
  accionesInmediatas: string;
  revisionPrivacidad: boolean;
}
export interface BorradorCampo {
  id: string;
  actor: ActorDemo;
  formulario: FormularioCampo;
  paso: number;
  fotos: File[];
  actualizadoEn: string;
}
export interface EnvioCampo {
  id: string;
  actor: ActorDemo;
  reporte: ReporteCampo;
  estado: 'pendiente' | 'error' | 'registrado_demo_local';
  intentos: number;
  creadoEn: string;
  ultimoError: string | null;
  acuseLocal: string | null;
}
