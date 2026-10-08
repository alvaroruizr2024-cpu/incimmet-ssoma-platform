# Arquitectura y decisiones aplicadas — PASO 2

Base: `entradas/PROMPT_02.md`, brief maestro y diseño aprobado. Se mantienen las siete secciones de definición del paso 1 como referencia; esta nota describe únicamente su implementación en el alcance del paso 2.

## 1. Responsabilidades

| Capa                                    | Contrato                                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------------------------ |
| `lib/types.ts`                          | Tipos del JSON exacto; tipos objetivo; extensiones de lectura y datos locales              |
| `lib/data/validarDocumento.ts`          | Comprobación runtime del esquema, enum, conteos y claves principales                       |
| `lib/data/normalizar.ts`                | Transformación sin mutación ni deducción de estados ausentes; conserva originales          |
| `lib/domain`                            | Funciones sin efectos de red/almacenamiento para fórmulas, estados, filtros y agregaciones |
| `lib/data/DataSource.ts`                | Contrato común extendido para consulta, guardado, evidencia, validación y cola             |
| `lib/data/StaticJsonDataSource.ts`      | Fetch y caché; overlay local; idempotencia; comprobación de permisos simulados             |
| `lib/data/indexedDB.ts`                 | Apertura diferida, transacciones y cierre de IndexedDB mediante idb                        |
| `lib/data/SupabaseDataSource.ts`        | Stub tipado, sin respuestas exitosas ficticias                                             |
| `components/providers.tsx`              | Store por instancia React, contexto de demo, QueryClient y DataSource                      |
| `store/filtros.ts`                      | Estado de selección, procedencia URL/usuario y modo push/replace                           |
| `components/shell/filtros-url-sync.tsx` | Enlace bidireccional a URL, aislado con Suspense                                           |
| `supabase/schema.sql`                   | Modelo objetivo y ejemplos de RLS, no backend conectado                                    |

## 2. Conservación de procedencia

JSON de entrada sin cambios. `EventoLectura.original`, `AccionLectura.original` y `LeccionLectura.original` conservan los objetos de origen. No se inventan fechas de creación, autores, identidades, coordenadas, validadores ni publicación.

`EventoLectura.estado` permite null aunque el objetivo de creación futura exija un estado. Siete variantes de investigación se reconocen sin asignar transiciones retroactivas; los 218 restantes permanecen desconocidos. El potencial local puede ser null, diferente de false. Las lecciones de origen son catalogadas.

La columna `estadoVerificado` del modelo de lectura representa el **contexto seleccionado**; `estadoImportado` permanece separado y `estadoOperativo` es null hasta que haya evaluación local. No enviar una lista de estados importados a una operación de cierre. Para esa puerta existe `puedeCerrarEventoOperativo`.

## 3. Diez supuestos aplicados

| N.º | Decisión de la demo                                                                                                                                                                                                                                                                          |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Tres cierres importados conservados con dos alertas parciales. Valida SSOMA. Para el literal «Todos los proyectos», la prueba de suficiencia usa los 12 códigos de la foto documental; no representa una lista confirmada de contratos activos. Alcance OR/TA/UC conserva esos tres códigos. |
| 2   | `anual_por_ambito` es la vista inicial oficial; las otras colecciones siguen accesibles, sin promedios ni reemplazos. Panel anual separado de filtros no desagregables.                                                                                                                      |
| 3   | Roles simulados; separación ejecutor–verificador mediante roles diferentes. Un adjunto subido por SSOMA no puede autovalidarse en esta demo. En producción se separan usuarios autenticados, no solo etiquetas de rol.                                                                       |
| 4   | Catálogos observados y originales preservados. Búsqueda tolera acentos/mayúsculas, pero no fusiona variantes semánticas.                                                                                                                                                                     |
| 5   | Blob local; JPEG, PNG, WebP o PDF, máximo 10 MiB y 10 archivos; fotos de reporte solo imágenes. Son límites técnicos de demo. Revisión de contenido/metadatos manual; sin plazo de retención legal inventado.                                                                                |
| 6   | Investigación revisada cuando es obligatoria; ningún cierre por lista vacía sin resolución SSOMA explícita. Publicación como hito separado. Investigación/publicación visual y reapertura quedan para la etapa de flujos.                                                                    |
| 7   | Potencial por confirmar = null y lista de personas anónimas con rol/zona. No se convierte null a false, ni se normalizan zonas compuestas históricas inventando categorías nuevas.                                                                                                           |
| 8   | Compromiso vence al terminar el día de Lima; hoy sigue abierto. Aviso siete días. No se crean plazos por tipo ni recurrencias no documentadas.                                                                                                                                               |
| 9   | Preparación previa con conexión. Cola local idempotente y conflictos sin sobrescritura. Ningún mensaje implica envío real. Service worker/precache/PWA aún no incluidos.                                                                                                                     |
| 10  | Placeholder textual INCIMMET. Aviso de privacidad de demo; revisión de datos y autorización de publicación pendientes antes de Vercel. Ningún contacto legal, logo o política se inventa.                                                                                                    |

## 4. Estados y suficiencia

Prioridad: evidencia aceptada y completa → Cerrada con evidencia; declaración inicial cerrada sin evidencia → Declarada cerrada sin evidencia; compromiso anterior al corte → Vencida; compromiso vigente o en proceso → Abierta; resto → Sin información.

Los textos «Realizada (estado global: En proceso 80%)» se consideran declaración cerrada, no ejecución en proceso. La declaración posterior al corte no se usa. El cierre local exige archivo no vacío, validación SSOMA, rol distinto, motivo, fechas coherentes y cobertura de todos los proyectos requeridos. La confirmación de alcance incluye suficiencia sobre tarea/flota; los códigos de proyectos no bastan por sí solos.

La demo no suma automáticamente archivos parciales para concluir suficiencia; solicita un expediente/evidencia validado que acredite todo el alcance. Esta es una regla conservadora de la demo, no una política corporativa confirmada. Las referencias EVD originales no aportan binarios ni nuevos validadores.

## 5. Filtros y agregaciones

Conteos por ID único; no se multiplican acciones transversales. Año/mes de acciones corresponde al evento origen; compromiso se filtra por separado. Clientes según texto del evento. Fechas exactas desconocidas no se asignan a meses inventados.

El selector cruzado conserva `cohorteAcciones` antes de aplicar estado. Filtros de acciones seleccionan eventos relacionados. Las lecciones se unen por evento de origen; aplicabilidad no equivale a proyecto del hecho. La biblioteca visual avanzada y su buscador específico se completan después; el adaptador ya permite texto completo simple por campos.

Pareto usa denominador con dato y contador separado «No consta»; acumulado 0–100%. No clasifica causas inferidas como confirmadas. Heatmap/tendencias muestran celdas sin filas como null, no como cero hechos. Los oficiales se leen tal como fueron publicados en el JSON. El costo del detalle no se presenta como moneda confirmada.

## 6. Persistencia, fallos y seguridad

Cuatro object stores en IndexedDB: documento de origen, reportes, evidencias e historial. Las transacciones evitan reportes o archivos sin su hito. La idempotencia usa clave local y representación canónica más hashes de fotos. Reintentos conservan IDs; contenido distinto con la misma clave produce error de conflicto.

El read-only del JSON puede continuar con advertencia si falla la preparación de caché. Un guardado local que falla no informa éxito. Una base con JSON inválido no se sustituye silenciosamente por caché. El binario se almacena como Blob; no se afirma cifrado en reposo, detección de malware ni limpieza de EXIF.

El rol de demo solo gobierna experiencia y métodos locales. El JSON sigue siendo público; no incluye autenticación. El ejemplo SQL usa `auth.uid()`, perfiles/membresías confiables y grants mínimos. Identidad restringida separada sin acceso directo del cliente; todavía requiere cifrado real, gestión de claves, servicio autorizado y auditoría.

## 7. Interfaces siguientes, sin ampliar indebidamente este paso

La implementación de gráficos ECharts consumirá los agregados actuales sin volver a leer JSON desde cada componente. El 3D irá diferido y con fallback. Los cuatro pasos del formulario se conectarán a `crearReporte`; la evidencia a `adjuntarEvidencia` y `validarEvidencia`. Para investigación, gestión completa de acciones, publicación/versionado y difusión se extenderá el DataSource con métodos propios y pruebas, no con escrituras directas desde componentes.

El manifest/service worker y los formularios son pendientes explícitos: el paso 2 entrega la arquitectura, no los acepta como terminados. La verificación visual, accesibilidad real, Lighthouse, seguridad de producción y despliegue también siguen pendientes.
