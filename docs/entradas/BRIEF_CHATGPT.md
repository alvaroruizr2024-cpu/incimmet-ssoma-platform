# BRIEF MAESTRO – Plataforma de Gestión de Incidentes SSOMA · INCIMMET S.A.

> Documento autocontenido para diseñar y codificar una **plataforma web + app móvil (PWA)**. Adjuntos: `data.json` (o los archivos separados `eventos.json`, `acciones.json`, `lecciones.json`, `indicadores.json`, `proyectos.json`, `catalogos.json`) y, opcionalmente, `logo_incimmet.svg`.
> Idioma de la interfaz: **español (Perú)**. Zona horaria: **America/Lima (UTC-5)**. Formato de fecha: DD/MM/AAAA. Separador decimal en la interfaz: punto (como en las fuentes).

## 1. Contexto y objetivo

INCIMMET S.A. es una contratista minera peruana (desde 1995) especializada en minería subterránea y relleno de minas. Opera para clientes como Nexa Resources (Cerro Lindo, El Porvenir, Atacocha), Buenaventura (Tambomayo, Orcopampa, Uchucchacua), Cía. Minera Poderosa (Santa María), Raura y Volcan (Romina, San Cristóbal y otras unidades de Yauli). Tiene certificaciones ISO 45001, ISO 14001 e ISO 9001.

Hoy la gestión de eventos SSOMA (accidentes, incidentes, daños a la propiedad, desvíos) está dispersa en un Power BI, alertas en PowerPoint, hojas Excel y actas. Un diagnóstico sobre esos datos encontró lo siguiente:

- **2025 no tiene registro por evento**: el Power BI se sobrescribió con datos de 2026. Solo quedan los agregados oficiales: 10 accidentes incapacitantes, 16 leves y 87 daños a la propiedad.
- De **168 acciones correctivas**, solo **3 (1.8 %)** tienen evidencia de cierre. **127 (75.6 %)** no tienen fecha, responsable ni estado.
- Las **causas inmediatas y básicas** solo están documentadas en ~20 eventos.
- Hay **duplicados** (el mismo accidente registrado como evento y como incumplimiento de regla de oro) y discrepancias entre versiones de indicadores.

**Objetivo:** construir una plataforma que (1) presente con impacto la gestión SSOMA ante gerencia y clientes, (2) analice los eventos de forma avanzada, (3) haga trazable el ciclo **reporte → investigación → acciones → evidencia → cierre → lección aprendida** y (4) permita reportar eventos desde el campo con el celular.

**Alcance de esta entrega:** una **demo funcional** con datos estáticos (los JSON adjuntos), con una arquitectura lista para conectar luego un backend real (Supabase/Postgres) sin reescribir la interfaz. Se publicará en Vercel después de que el cliente revise una versión de prueba.

## 2. Usuarios y roles

| Rol | Necesidad principal | Vistas clave |
|---|---|---|
| **Gerencia** (Gerencia General, Gerentes de Proyecto) | Visión ejecutiva y tendencias; cumplimiento de acciones; comparación entre proyectos | Presentación cinemática, dashboard ejecutivo, indicadores IF/IS/IA |
| **SSOMA corporativo** (Gerencia/Jefatura SSOMA, analistas) | Análisis profundo, investigación, verificación de cierre, lecciones | Análisis avanzado, registro de acciones, base de lecciones, calidad de datos |
| **Supervisores de campo / Líderes de seguridad de proyecto** | Reportar rápido, aun sin señal; seguir sus acciones; consultar lecciones | PWA móvil: reporte de evento, mis acciones, lecciones por riesgo |
| *(futuro)* Administrador | Catálogos, usuarios, proyectos | Configuración |

En la demo, los roles se simulan con un **selector de rol** (sin login real). La interfaz debe ocultar o mostrar módulos según el rol.

## 3. Módulos

1. **Presentación cinemática 3D (landing / "storytelling")**
   - Intro *scroll-cinematic* con Three.js mediante **react-three-fiber + drei**: escena estilizada de una **mina subterránea** (galería o rampa con iluminación de cascos/linternas, partículas de polvo, cables, estructuras de sostenimiento con malla y pernos), con la cámara avanzando al hacer scroll.
   - Hitos narrativos sincronizados con el scroll, tomados de los datos:
     - "225 eventos analizados 2009–2026"
     - "12 proyectos"
     - "IF 2024: 2.71 · IS: 283.92 · IA: 0.769"
     - "Solo 1.8 % de acciones con cierre verificado" (el problema)
     - "La plataforma" (la solución)
   - Los contadores deben animarse al entrar en pantalla.
   - Profesional y sobrio; nada de estética "gamer". Paleta corporativa (sección 8).
   - Debe respetar `prefers-reduced-motion`. **Fallback** si no hay WebGL o el dispositivo es de gama baja: versión 2D con imágenes, gradientes y CSS.
   - CTA final hacia el dashboard.
2. **Dashboard interactivo ("tiempo real")**
   - KPIs: N° de eventos, accidentes por nivel, alto potencial (HPRI), días perdidos, % de acciones con cierre verificado, acciones vencidas.
   - **Filtros cruzados** (estilo Power BI): año, mes, proyecto, cliente, tipo, grupo, riesgo crítico, alto potencial, empresa. Al hacer clic en cualquier gráfico se filtran todos los demás.
   - Indicador "en vivo": la demo simula la llegada de eventos (opcional: reproducir los eventos 2026 en orden cronológico con un botón "simular tiempo real") mediante una capa `DataSource` con `subscribe()`.
3. **Análisis avanzado**
   - Tendencia mensual y anual por tipo.
   - **Pareto** de tipos, riesgos críticos, actividades, equipos y causas (cuando existan).
   - **Mapa de calor proyecto × mes**.
   - Matriz severidad × potencial (nivel INCIMMET vs PG).
   - Panel de **alto potencial**.
   - **Indicadores IF/IS/IA/TRIFR** por año y ámbito, con metas 2026 y los acumulados de 12 meses a feb-2026.
   - **Cumplimiento verificado de acciones** por proyecto y por evento (barras apiladas por estado verificado).
   - **Calidad de datos**: cobertura año × proyecto, campos faltantes y brechas (p. ej. 2025 sin detalle).
   - Etiqueta visible: "Indicadores oficiales según documento fuente; los conteos del detalle pueden no coincidir con los agregados".
4. **Eventos**
   - Tabla con búsqueda, orden, paginación y exportación a CSV.
   - Ficha de evento con descripción, clasificación, severidad, causas, acciones vinculadas, lecciones vinculadas, fuentes (códigos de documento) y nivel de confianza.
   - Línea de tiempo del ciclo de vida.
5. **Registro y seguimiento de acciones con evidencia**
   - Lista y kanban por **estado verificado**: Cerrada con evidencia / Declarada cerrada sin evidencia / Abierta / Vencida / Sin información.
   - Filtros por proyecto, evento, jerarquía de control y responsable (rol).
   - En la demo, adjuntar evidencia es un mock: se guarda en IndexedDB/localStorage y la acción pasa a "Cerrada con evidencia" solo si hay archivo y validador.
   - **Regla clave:** nada pasa a "cerrada" sin evidencia.
   - Alertas visuales de vencidas y semáforo de fecha compromiso.
6. **Base de lecciones aprendidas buscable**
   - Búsqueda de texto completo (p. ej. Fuse.js o MiniSearch).
   - Filtros por riesgo crítico, actividad crítica, proyecto y aplicabilidad.
   - Tarjeta con: qué pasó, por qué, lección y **controles por jerarquía** (Eliminación → Sustitución → Ingeniería → Administrativos → EPP), más enlaces a los eventos origen.
   - Botón "difundir" (mock) que genera un PDF o una imagen para charlas de 5 minutos.
7. **App móvil PWA – reporte en campo**
   - Instalable (manifest + service worker), **offline-first**: el reporte se guarda en IndexedDB y se sincroniza al volver la conexión (en la demo, cola local con indicador "pendiente de envío").
   - Formulario por pasos:
     - proyecto, fecha y hora (por defecto, ahora), lugar o labor, tipo, actividad, equipo, riesgo crítico, descripción (con dictado por voz si el navegador lo permite) y fotos (cámara);
     - ¿hubo persona afectada? → solo **rol** y **zona corporal general**;
     - acciones inmediatas.
   - **Prohibido** capturar nombres, DNI o diagnósticos en el formulario. Se debe mostrar un aviso de privacidad (Ley 29733).
   - Vistas "Mis acciones" y "Lecciones por riesgo".
8. **Administración (mínima en la demo)**
   - Catálogos (tipos, riesgos críticos, proyectos) leídos de `catalogos.json`.

## 4. Flujo de negocio (estados)

`Reportado` → `En investigación` → `Investigado` (causas inmediatas/básicas registradas) → `Acciones definidas` → `En seguimiento` → `Cerrado` (todas las acciones con evidencia validada) → `Lección publicada`.

Reglas:
- Un evento no se cierra si alguna acción no está "Cerrada con evidencia".
- **El estado verificado de una acción se calcula; no se escribe a mano.** Para la fecha de corte:
  - si tiene evidencia validada → Cerrada con evidencia;
  - si está declarada cerrada pero sin evidencia → Declarada cerrada sin evidencia;
  - si su fecha compromiso ya pasó → Vencida;
  - si su fecha compromiso es futura o está "en proceso" → Abierta;
  - si no tiene datos → Sin información.
- Los eventos con alto potencial (HPRI) y los incapacitantes o mortales exigen investigación y lección.

## 5. Modelo de datos objetivo (para el backend futuro)

```ts
// Entidades del modelo objetivo (Postgres/Supabase). En la demo se derivan del JSON.
type ID = string;
interface Cliente      { id: ID; nombre: string; }
interface Proyecto     { codigo: string; nombre: string; clienteId: ID; activo: boolean; metaTrifr?: number; }
interface Contrato     { id: ID; proyectoCodigo: string; inicio: string; fin?: string; }
interface Empresa      { id: ID; nombre: string; tipo: 'INCIMMET'|'Subcontrata'|'Tercero'|'Cliente'; }
interface Evento {
  id: ID;                       // EV-AAAA-NNN
  fecha: string | null;         // ISO yyyy-mm-dd
  hora?: string | null;         // HH:MM
  proyectoCodigo: string; area?: string; actividad?: string; equipo?: string;
  tipo: TipoEvento; tipoGrupo: GrupoEvento;
  nivelIncimmet?: '0'|'I'|'II'|'III'|'IV'|'V'|'VI'; pgIncimmet?: string;
  nivelCliente?: string; pgCliente?: string;
  altoPotencial: boolean; riesgoCritico?: string;
  descripcion: string;          // sin datos personales
  estado: 'Reportado'|'En investigación'|'Investigado'|'Acciones definidas'|'En seguimiento'|'Cerrado';
  diasPerdidos?: number; costo?: number; penalidad?: string;
  empresaId?: ID; confianza?: string; creadoPor: ID; creadoEn: string;
}
interface PersonaAfectadaAnon { id: ID; eventoId: ID; rol: string; experienciaMeses?: number; zonaCorporal?: ZonaCorporal; empresaId?: ID; }
// La identidad real (nombre/DNI) vive en una tabla separada con acceso restringido (RLS), nunca en la vista analítica:
interface IdentidadRestringida { personaAnonId: ID; /* cifrado, solo rol Médico/RRHH autorizado */ }
interface Causa        { id: ID; eventoId: ID; tipo: 'Inmediata-Acto'|'Inmediata-Condición'|'Básica-Personal'|'Básica-Trabajo'; codigo?: string; descripcion: string; }
interface Accion {
  id: ID; eventoId: ID; descripcion: string; tipo: string;
  jerarquia: 'Eliminación'|'Sustitución'|'Ingeniería'|'Administrativo'|'EPP';
  alcance?: string; responsableRol: string; fechaCompromiso?: string;
  estadoDeclarado?: string; fechaEstadoDeclarado?: string;
  estadoVerificado: EstadoVerificado; // calculado
}
interface Evidencia    { id: ID; accionId: ID; archivoUrl: string; tipo: 'Foto'|'Informe'|'Registro'|'Otro'; fecha: string; validadoPorRol?: string; validadoEn?: string; }
interface Leccion      { id: ID; eventoIds: ID[]; quePaso: string; porQue: string; leccion: string;
                         controles: { eliminacion?: string; sustitucion?: string; ingenieria?: string; administrativos?: string; epp?: string };
                         actividadCritica: string; riesgoCritico: string; aplicabilidad: string; }
interface IndicadorPeriodo { anio: number; mes?: number; ambito: string; hht?: number; diasPerdidos?: number;
                             accNv1?: number; accNv2?: number; accNv3?: number; accNv4?: number; accNv5_6?: number;
                             danosPropiedad?: number; if?: number; is?: number; ia?: number; trifr?: number; fuente: string; }
interface DocumentoFuente { codigo: string; descripcion: string; tipo: string; }
type EstadoVerificado = 'Cerrada con evidencia'|'Declarada cerrada sin evidencia'|'Abierta'|'Vencida'|'Sin información';
type GrupoEvento = 'Accidente'|'Incidente'|'Daño a la propiedad'|'Desvío'|'Ambiental'|'En investigación';
type ZonaCorporal = 'mano'|'pie'|'pierna'|'rostro/cabeza'|'ojo'|'espalda'|'hombro/brazo'|'tórax'|'Otra zona';
```

Fórmulas (calcularlas en la capa de dominio, con pruebas unitarias):
- `IF = accidentes incapacitantes (Nv 4–6) × 1 000 000 / HHT`
- `IS = días perdidos × 1 000 000 / HHT`
- `IA = IF × IS / 1000`
- `TRIFR = (Nv 2–6) × 1 000 000 / HHT`

En la demo, los indicadores oficiales se **muestran tal como vienen en el JSON** (no recalcular sobre el detalle, porque el detalle está incompleto). Sí se puede mostrar el recálculo con los datos semanales del Power BI, rotulado "no oficial".

## 6. Esquema EXACTO del JSON adjunto (`data.json`)

Raíz: `{ meta, catalogos, proyectos[], eventos[], acciones[], lecciones[], indicadores, documentos_fuente[] }`. Los archivos separados contienen las mismas claves. `null` = "no consta en la fuente" (**no inventar datos**; mostrar "No consta").

```ts
interface DataJson {
  meta: { generado: string; zona_horaria: string; version: string; fecha_corte_estados: string;
          conteos: { eventos: number; acciones: number; lecciones: number; proyectos: number; documentos_fuente: number };
          rango_fechas: [string, string]; privacidad: string; advertencias: string[] };
  catalogos: { tipos_evento: string[]; grupos_tipo: string[]; estados_verificados: string[];
               jerarquia_control: string[]; escala_severidad_incimmet: Record<string, string> };
  proyectos: { codigo: string; nombre: string; cliente: string; n_eventos: number; anios_con_eventos: number[]; meta_trifr_2026: number | null }[];
  eventos: {
    id: string; fecha: string | null; fecha_texto: string | null; anio: number; mes: number | null; hora: string | null;
    proyecto: string;            // código: CL, TA, OR, UC, EP, SM, RO, RA, SC, CA, AN, AT
    cliente: string; area: string | null; actividad: string | null; puesto_rol: string | null; equipo: string | null;
    tipo: string;                // ver catalogos.tipos_evento
    tipo_grupo: 'Accidente'|'Incidente'|'Daño a la propiedad'|'Desvío'|'Ambiental'|'En investigación';
    clasificacion_fuente: string | null;
    nivel_incimmet: string | null; pg_incimmet: string | null; nivel_cliente: string | null; pg_cliente: string | null;
    severidad_texto: string | null;   // cuando la severidad viene como texto libre
    alto_potencial: boolean; riesgo_critico: string | null; zona_cuerpo: string | null;
    descripcion: string; causas_inmediatas: string | null; causas_basicas: string | null;
    dias_perdidos: number | null; costo: number | null; costo_texto: string | null; penalidad: string | null;
    empresa_tipo: 'INCIMMET'|'Subcontrata'|'Tercero'|'Mixto (INCIMMET + tercero)'|'No consta'; empresa_detalle: string;
    estado: string | null; n_acciones: number; lecciones: string[];   // IDs LA-NNN
    fuentes: string[];           // "DOC-XXX-NN · ubicación"
    confianza: string; observaciones: string | null;
  }[];
  acciones: {
    id: string; evento_id: string; proyecto: string; descripcion: string; tipo: string;
    jerarquia_control: 'Eliminación'|'Sustitución'|'Ingeniería'|'Administrativo'|'EPP';  // clasificación asistida
    alcance: string; responsable_rol: string | null; fecha_compromiso: string | null;
    estado_declarado: string | null; fecha_estado_declarado: string | null;
    estado_verificado: 'Cerrada con evidencia'|'Declarada cerrada sin evidencia'|'Abierta'|'Vencida'|'Sin información';
    evidencias: string[];        // códigos EVD-NN
    observaciones: string | null; fuente: string;
  }[];
  lecciones: {
    id: string; eventos: string[]; proyectos: string[]; que_paso: string; por_que: string; leccion: string;
    controles: { eliminacion: string|null; sustitucion: string|null; ingenieria: string|null; administrativos: string|null; epp: string|null };
    actividad_critica: string; riesgo_critico: string; aplicabilidad: string; fuentes: string[];
  }[];
  indicadores: {
    definiciones: Record<'IF'|'IS'|'IA'|'TRIFR', string>;
    anual_por_ambito: { anio: number; ambito: string; ambito_nombre: string; fuente: string;
      hht?: number; dias_perdidos?: number; acc_nv1?: number; acc_nv2?: number; acc_nv3?: number; acc_nv4?: number; acc_nv5_6?: number;
      danos_propiedad?: number; eventos_investigados?: number; costo_propiedad_usd?: number; trifr?: number; if?: number; is?: number; ia?: number }[];
      // ambito: PERU, TOTAL, CL, TA, OR, SM, RA, RO, UC, BR, LIMA, CO, CO-BU, CO-MA (años 2022–2025)
    metas_2026: Registro[]; doce_meses_feb_2026: Registro[]; registros_oficiales: Registro[];
    hh_semanal_pbix_resumen: { anio: number; proyecto: string; tabla: string; semanas: number; desde: string; hasta: string;
      hht: number; dias_perdidos: number|null; acc_nv2_6: number|null; acc_nv1_3: number|null; fuente: string; nota: string }[];
  };
  documentos_fuente: { codigo: string; descripcion: string; tipo: string }[];
}
interface Registro { periodo: string; ambito: string; indicador: string; valor: number | string; nota: string | null; fuente: string; }
```

Notas de datos:
- 225 eventos (29/12/2009–30/09/2026): **2024 = 155**, **2026 = 52**, 2025 = 3, el resto son históricos graves.
- `acc_nv5_6` corresponde a "mortales / incapacidad permanente" (Nv 5–6), **no** solo mortales.
- Hay 3 accidentes mortales en el detalle: CL 2014, EP 2017 y TA 2023.
- Proyectos con más eventos: Cerro Lindo 138, Tambomayo 25, Orcopampa 23.
- La interfaz debe mostrar las advertencias de `meta.advertencias` en un banner de calidad de datos.

## 7. Stack y arquitectura

- **Next.js 14+ (App Router) + TypeScript (strict) + Tailwind CSS**. Componentes accesibles: shadcn/ui (Radix).
- **3D:** `three`, `@react-three/fiber`, `@react-three/drei`. Opcional: `@react-three/postprocessing` con moderación. Scroll con `ScrollControls` de drei o GSAP ScrollTrigger. Geometría procedural o modelos ligeros (glTF < 1.5 MB, comprimidos con Draco/Meshopt). **No** usar assets con licencia dudosa.
- **Gráficos:** **Apache ECharts** (`echarts-for-react`), preferido por el mapa de calor, Pareto, el brush y los filtros cruzados; Recharts es aceptable para los gráficos simples. Mantener un solo estilo visual.
- **Estado y filtros:** Zustand (store de filtros global y serializado en la URL con `nuqs` o `searchParams`). Datos con TanStack Query sobre una interfaz `DataSource`.
- **Capa de datos abstraída:**
  ```ts
  interface DataSource {
    getEventos(f?: Filtros): Promise<Evento[]>; getAcciones(f?: Filtros): Promise<Accion[]>;
    getLecciones(q?: string): Promise<Leccion[]>; getIndicadores(): Promise<Indicadores>;
    crearReporte(r: ReporteCampo): Promise<{ id: string }>; adjuntarEvidencia(accionId: string, file: File): Promise<void>;
    subscribe(cb: (e: EventoNuevo) => void): () => void;   // "tiempo real"
  }
  // StaticJsonDataSource (demo, lee /public/data/*.json + IndexedDB para lo creado localmente)
  // SupabaseDataSource (futuro: Postgres + Storage + Realtime + RLS) — dejar stub con TODOs
  ```
  Selección por variable de entorno `NEXT_PUBLIC_DATA_SOURCE=static|supabase`.
- **PWA:** `manifest.webmanifest` (nombre, íconos 192/512, `display: standalone`, `theme_color`) y service worker (Serwist o `next-pwa`; si generan conflictos con el App Router, usar un service worker manual con Workbox) con cache de la app shell y de los JSON. Background sync o cola manual en IndexedDB (`idb`).
- **Despliegue:** compatible con **Vercel** sin backend obligatorio. Preferir rutas estáticas (SSG); si se usa `output: 'export'`, verificar que el service worker y las rutas dinámicas funcionen. No hay secretos en el repositorio. `.env.example`.
- **Calidad:** ESLint + Prettier. Pruebas con **Vitest** (fórmulas IF/IS/IA, cálculo del estado verificado, filtros) y una prueba e2e mínima con Playwright (opcional).
- **Estructura sugerida:**
  `app/(marketing)/page.tsx` (presentación 3D) · `app/dashboard` · `app/analisis` · `app/eventos/[id]` · `app/acciones` · `app/lecciones` · `app/campo` (PWA) · `components/three/*` · `components/charts/*` · `lib/data/*` (DataSource) · `lib/domain/*` (fórmulas y reglas) · `public/data/*.json`.

## 8. Identidad visual INCIMMET

- **Marca:** "INCIMMET", lema **"Hagamos el camino juntos"**. Sector: minería subterránea y relleno de minas. Tono: técnico, sobrio, confiable, enfocado en las personas y la seguridad.
- **Colores (tomados del logotipo y de las plantillas internas de presentación de INCIMMET):**
  - Azul marino corporativo **#151F44** (texto del logotipo, fondos oscuros)
  - Azul INCIMMET **#1D7DCC** (acento principal, lema)
  - Azul profundo **#002060**
  - Azul medio **#0070C0**
  - Cian de apoyo **#00B0F0** (resaltados, datos)
  - Neutros: #FFFFFF, #E7E6E6, #0F172A
  - Semáforo SSOMA para estados: verde #00B050, ámbar #FFC000, rojo #E53935, gris #9E9E9E. Siempre acompañados de texto o ícono (no depender solo del color).
- **Tipografía:** sans-serif moderna y legible (p. ej. *Inter* o *Montserrat* para títulos; las plantillas internas usan Calibri/Aptos).
- **Logo:** si se adjunta `logo_incimmet.svg`, usarlo en el header y en el splash de la PWA, sin deformarlo y con área de respeto. Si no, usar un wordmark tipográfico "INCIMMET" en #151F44 con el lema en #1D7DCC. **No** descargar ni incrustar fotos o recursos con copyright del sitio web; usar 3D procedural, íconos libres (Lucide) e ilustraciones propias.
- **Modo oscuro** por defecto en la presentación cinemática. Dashboard claro y oscuro.

## 9. Requisitos de calidad

- **Responsive** desde 360 px hasta pantallas 4K. La PWA debe estar diseñada mobile-first, con botones grandes (uso con guantes) y alto contraste para uso en exterior.
- **Accesibilidad WCAG 2.1 AA:** contraste, navegación por teclado, `aria-*` y alternativas textuales a los gráficos (tabla de datos accesible por gráfico).
- **Rendimiento:**
  - Lighthouse móvil ≥ 85 en el dashboard y ≥ 90 en la PWA.
  - Carga diferida (`dynamic import`, `ssr:false`) de la escena 3D.
  - Límite de DPR (≤ 1.5 en móvil) y pausa del render cuando la escena está fuera de vista.
  - Tamaño total del bundle inicial < 300 KB gzip (sin 3D).
- **Fallback sin WebGL:** detección (`WebGL2RenderingContext`) y versión 2D equivalente. Respetar `prefers-reduced-motion`.
- **Privacidad (Ley 29733 – Protección de Datos Personales, Perú):**
  - La demo no contiene ni solicita nombres, DNI, diagnósticos ni datos psicológicos.
  - El formulario de campo solo acepta rol y zona corporal general.
  - Agregar una página "Privacidad y tratamiento de datos".
  - En el futuro: identidad separada con RLS y cifrado, consentimiento informado y registro de accesos.
- **Internacionalización:** textos en español centralizados (archivo de mensajes) para facilitar la traducción futura (PT/EN, por las operaciones en Brasil y Colombia).
- **Sin datos inventados:** si un campo viene `null`, mostrar "No consta". No generar eventos falsos. Para la simulación de tiempo real, reutilizar los eventos reales del JSON.

## 10. Entregable esperado

1. Un **repositorio completo descargable en .zip** (generado como archivo), listo para `npm install && npm run dev`. Debe incluir:
   - `README.md` en español: requisitos (Node 20+), comandos (`dev`, `build`, `start`, `test`, `lint`), estructura, cómo reemplazar los datos, cómo activar Supabase, cómo desplegar en Vercel (`vercel` / import desde Git) y limitaciones;
   - `public/data/` con los JSON adjuntos (sin modificarlos; si hace falta otro formato, transformarlo en build o en runtime);
   - `supabase/schema.sql` con el modelo de datos objetivo y políticas RLS de ejemplo (identidad separada);
   - íconos PWA generados (pueden ser SVG o PNG simples con el wordmark).
2. `npm run build` **sin errores** de TypeScript ni de ESLint.
3. Una lista de verificación de aceptación (sección 11) marcada.

## 11. Criterios de aceptación

- [ ] Presentación 3D con scroll fluida en un portátil promedio; fallback 2D verificado sin WebGL.
- [ ] El dashboard muestra 225 eventos y 168 acciones; los filtros cruzados actualizan todos los gráficos y la URL.
- [ ] Pareto, mapa de calor proyecto×mes, tendencia, HPRI, IF/IS/IA (oficiales + metas 2026) y cumplimiento verificado funcionan.
- [ ] Ficha de evento con acciones, lecciones y fuentes vinculadas.
- [ ] Las acciones muestran estado verificado y semáforo; adjuntar evidencia (mock) cambia el estado según la regla.
- [ ] La búsqueda de lecciones devuelve resultados relevantes (p. ej., "voladura", "malla", "equipos móviles").
- [ ] La PWA es instalable, el reporte funciona offline y se sincroniza al volver la conexión; no pide datos personales.
- [ ] Accesibilidad básica verificada; Lighthouse dentro de los objetivos.
- [ ] README completo; despliegue en Vercel documentado.
