# PASO 3 — Presentación cinemática e identidad

Versión del repositorio: **0.3.0**. Base: repositorio completo del PASO 2, sin eliminar sus módulos, contratos, pruebas ni SQL. Requisito: `docs/entradas/PROMPT_03.md`; diseño aprobado: `docs/DISENO_FUNCIONAL_UX.md`, §4.1. Marca: wordmark textual **INCIMMET**, «Hagamos el camino juntos». Sin logo ni recursos corporativos descargados.

## Arquitectura de la presentación

`app/(marketing)/page.tsx` → `lib/data/presentacion.server.ts` → validación/normalización existentes → `lib/domain/presentacion.ts` → resumen serializable → `Story` (HTML de servidor) + `CinematicExperience` (mejora progresiva) → import dinámico `MineCanvas` con `ssr:false`.

La lectura de archivo está en la capa de datos, no dentro de los componentes visuales. La landing siempre describe el corte original. Los filtros de la URL y las nuevas validaciones locales no alteran las cifras del relato; al salir hacia la aplicación, los filtros se conservan. Solo se envía el resumen al cliente para la narrativa. Los resultados oficiales se obtienen con `indicadoresOficiales`, no con recálculos a partir de eventos.

La aplicación conserva su `AppShell` operativo. La ruta `/` lo sustituye por una composición de ancho completo sin duplicar cabeceras, banners ni landmarks `main`. El selector de rol y la navegación operativa siguen intactos en el resto de rutas.

## Ocho escenas

| Escena          | Contenido                                                                         | Procedencia                                                       |
| --------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| El camino       | Marca, lema y entrada a la galería                                                | Identidad del brief                                               |
| Base documental | Conteo y rango de eventos                                                         | Eventos documentales por ID único                                 |
| Proyectos       | Conteo, tres ejemplos y lista desplegable                                         | Maestro + conteos del detalle                                     |
| Indicadores     | IF, IS e IA del período/ámbito editorial seleccionado                             | Colección anual oficial; valores originales y fuente desplegables |
| Alto potencial  | Conteo de bandera HPRI verdadera                                                  | `altoPotencial === true`, no inferencia por tipo                  |
| Evidencia       | Cierre según corte y acciones sin información; advertencia de alcance parcial     | Estado importado, observaciones y denominadores                   |
| La plataforma   | Reporte → investigación → acciones → evidencia → cierre → lección                 | Flujo propuesto del brief, no mejora medida                       |
| Continuar       | Lecciones catalogadas, CTA `/dashboard`, acceso de campo, advertencias originales | Colección de lecciones y `meta.advertencias`                      |

Los valores 225 / 12 / 2.71 / 283.92 / 0.769 / 1.8% / 75.6% no están incrustados como resultados en los componentes. El año 2024 y el ámbito PERU son selectores editoriales expresos del requerimiento; los valores resultantes vienen del archivo. `formatoNarrativo` conserva punto decimal y muestra No consta para ausencias. Los originales IF=2.7098, IS=283.92 e IA=0.7694 no se modifican. Los metaconteos no sustituyen el recuento de filas.

## 3D

Bóveda y paredes extruidas con relieve determinista; materiales MeshStandardMaterial, mapa de rugosidad generado localmente; piso; malla electrosoldada, pernos y placas en instancing; tubería HDPE; cables y soportes; lámparas; luz de inspección que acompaña la cámara; casco sin persona identificable; polvo; FogExp2 y niebla local por capas transparentes. Esta es una aproximación volumétrica de coste bajo, no raymarching ni una simulación física de ventilación. Paneles esquemáticos de proyectos y estaciones de seguimiento completan la narrativa.

La cámara se controla con **GSAP ScrollTrigger** sobre el scroll nativo. Se miden los comienzos reales de las secciones: apertura de detalles, cambio de ancho y zoom recalculan los tramos con ResizeObserver. Hay pausas cortas de cámara al llegar a paneles. No se fija el scroll del usuario, no se emplea rueda interceptada y no hay un segundo contenedor desplazable.

Dimensiones, texturas y luces son ilustrativas. No representan un proyecto real, un diseño geomecánico ni la eficacia de un control. No se usan modelos glTF, HDR, fuentes tipográficas o fotografías externas.

## Rendimiento y degradación

| Estado      | Comportamiento                                                              |
| ----------- | --------------------------------------------------------------------------- |
| Alta        | DPR máximo 1.5; malla más densa; 180 partículas y 7 capas locales de niebla |
| Equilibrada | DPR máximo 1.25; menor geometría; 70 partículas y 3 capas                   |
| Baja        | DPR 1; malla simplificada; sin partículas ni capas locales                  |
| 2D          | Mismo HTML, gradientes corporativos y SVG propio; sin motor WebGL           |

`PerformanceMonitor` de drei mide ventanas reales de render continuo; si cae por debajo de 28 FPS en la mayoría de muestras de una ventana, baja un nivel. Tras agotarlos, activa 2D. No se aumenta automáticamente la calidad durante la visita. La detección inicial también considera WebGL2, ahorro de datos y pistas de CPU/memoria cuando el navegador las expone. Son heurísticas de capacidad, no identificación infalible de una GPU.

`frameloop`: **always** en calibración breve/interacción, **demand** al estabilizarse, **never** cuando la pestaña está oculta o la presentación sale de vista. Se retiran los observadores y ScrollTriggers al desmontar. El monitor se desmonta en reposo, para no confundir demanda cero con bajo rendimiento. No hay sombras dinámicas ni postprocesado costoso, tampoco en escritorio.

## Fallback y accesibilidad

Las mismas ocho secciones permanecen en HTML para ambas versiones y sin JavaScript. `prefers-reduced-motion` impide cargar el canvas y deja números finales sin animación. `/?intro=2d` permite solicitar explícitamente la versión 2D para QA. Fallo de WebGL2, pérdida de contexto, error capturado o rendimiento insuficiente no eliminan la narrativa. Un botón permite desactivar el movimiento manualmente sin perder la posición del documento.

El SVG decorativo 2D puede hacer un fundido de 3 segundos, sin bucle, únicamente si no hay preferencia de movimiento reducido ni desactivación manual. El canvas es decorativo y está oculto del árbol accesible. Todos los textos están fuera de él. Las cifras animadas tienen una copia accesible estable para no anunciar cada frame. Encabezados semánticos, selector de escena etiquetado, foco programático sobre sección y enlace visible «Saltar intro» permiten navegación por teclado. El wordmark tiene nombre accesible y sus glifos visuales se agrupan como identidad gráfica.

## Límite de la entrega

Se implementa la presentación solicitada. ECharts, formulario completo, service worker e instalación PWA siguen perteneciendo a los pasos posteriores. Los accesos a esos módulos abren sus bases heredadas; se indica esa condición en la presentación. No se publica ningún sitio ni se modifican cuentas externas.

La validación de código ejecutada y la que quedó pendiente están diferenciadas en `VERIFICACION_PASO3.md`. No se presenta la inspección de una maqueta CSS como una ejecución de Next.js, React o WebGL.
