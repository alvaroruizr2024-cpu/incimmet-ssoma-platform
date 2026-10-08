# Cinemática interactiva · 08/10/2026

Base: entrega «Portal SSOMA mejorado» (07/10/2026). Alcance: más cinemática y 3D interactivo sobre el recorrido existente (cámara por la galería, datos en el espacio 3D y transiciones), sin dependencias nuevas y sin alterar el HTML narrativo, las cifras, las fuentes ni los fallbacks.

## Cámara

- **Óptica por progreso** (`opticaCamara`): la lente se cierra a 57° en cada pausa de lectura (el encuadre aprobado usaba 60° fijos), se abre a 64° en los tramos de avance y a 68° en la salida. Un balanceo acotado (≤ 0.02 rad) acompaña el desplazamiento lateral de cada tramo. Misma fase que `poseCamara`, así que los encuadres aprobados no cambian.
- **Mirada libre** (`desplazamientoMirada`): con puntero fino, el objetivo se desplaza hasta ±0.7 m / ±0.35 m y la posición hasta ±0.12 m / ±0.06 m, amortiguados. El tacto no gira la cámara; al salir el puntero la mirada se recentra. La cámara permanece dentro de la galería.
- **Foco en el dato fijado**: la mirada se inclina un 18 % hacia la posición del dato seleccionado.
- **Velocidad narrativa** (`velocidadNarrativa`): progreso por segundo suavizado; agranda y aclara el polvo y acelera el flujo de la niebla mientras se avanza, y decae solo al detenerse.

## Datos en el espacio 3D

- **Presencia** (`presenciaMomento`): cada instalación se ensambla al acercarse en vez de aparecer de golpe. Pórticos, tableros, balizas y estaciones crecen de 0 a 1; la constelación de eventos y el muro de evidencias se encienden instancia a instancia de forma escalonada. Se conserva la ventana ±1.02 del culling previo y, además, lo que no está presente se retira del trazado del puntero (capa 1).
- **Hotspots**: portal documental, cada evento (instancia), cada proyecto, cada indicador, cada baliza de alto potencial, cada acción (instancia), cada estación del ciclo y la salida. Señalar realza con un contorno fino y una luz suave (`Halo`, sin destellos); un clic fija el dato. Las instancias realzadas crecen y aclaran su color.
- **Catálogo** (`catalogoInteractivo`): texto y destino de cada dato derivados del resumen de presentación, nunca de constantes: ficha `/eventos/{id}` para eventos y balizas, filtro exacto `/eventos?proyectos="CL"` para proyectos, `/acciones?accion={id}` para acciones y los módulos del ciclo con los filtros vigentes. Los valores nulos se muestran como «No consta».
- **Corrección de color por instancia**: la constelación de eventos y el muro de evidencias se renderizaban en negro en cualquier GPU, porque sus materiales declaraban `vertexColors` sin atributo de color en la geometría y WebGL multiplicaba por el atributo por defecto (0, 0, 0). Three.js aplica `instanceColor` por sí solo, así que se retira `vertexColors`: ahora se ve el color por grupo de evento y las tres tarjetas con cierre verificado. Se comprobó comparando la exportación anterior y la nueva con la misma GPU por software.

## DOM y transiciones

- **Rótulo al puntero** (`HoverCard`): decorativo y `aria-hidden`; sigue al puntero fino y desaparece al salir.
- **Panel «Dato fijado»** (`DataInspector`): título, líneas, enlace a la plataforma, botones ◀ ▶ para recorrer los datos de la escena (también con las flechas del teclado), Escape y Cerrar. Recibe el foco al abrirse y lo devuelve al botón «Explorar los datos 3D de esta escena», que vive en la navegación por escenas solo en modo 3D y permite llegar a los datos sin puntero.
- **Acento por escena** (`acentoEscena`): la luz de acompañamiento toma el color de la escena que llega al ritmo del tramo (cian de galería, ámbar en alto potencial, verde en evidencia, luz cálida en la salida). La viñeta se tiñe en las escenas 5, 6 y 8 mediante `data-scene`.
- **Coreografía de lectura**: el contenido de cada escena entra con ella y se retira al salir mediante animaciones guiadas por scroll (`animation-timeline: view()`), y un riel de progreso recorre el borde derecho (`scroll(root)`). Solo en 3D con movimiento y a partir de 901 px, sin JavaScript adicional; sin soporte del navegador, el contenido se muestra estático.

## Estado compartido

`store/relato3d.ts` (zustand, ya presente en el proyecto) guarda únicamente la identidad del dato señalado y fijado y la posición del foco. El canvas lee el estado por frame sin volver a renderizar React; el DOM se suscribe a la selección. Señalar o fijar un dato abre una ventana breve de render continuo y después la escena vuelve a `demand`, como antes.

## Lo que no cambia

- HTML narrativo, cifras, fuentes y advertencias; fallback 2D, `prefers-reduced-motion`, ahorro de datos y detección de WebGL2; política de `frameloop` y `PerformanceMonitor`; sin modelos, HDR, fuentes ni texturas externas; sin nuevas dependencias.
- El canvas solo recibe el puntero con `(hover: hover) and (pointer: fine)`. En tacto no hay picking para no interferir con el desplazamiento del documento; el panel y su recorrido sí funcionan en tacto y teclado.
- Tono sobrio: realces de contorno y luz, sin partículas nuevas ni efectos de videojuego; la baliza ámbar conserva su pulso leve y no destella.

## Verificación

Ejecutada el 08/10/2026 sobre el build final (Node 22.22.0, Chromium de Playwright 1.56.1):

- Prettier, ESLint (0 avisos) y TypeScript de aplicación y E2E aprobados.
- 329/329 pruebas unitarias en 20 archivos; las 11 nuevas (`tests/cinematica-interactiva.test.ts`) cubren óptica, presencia, acentos, mirada libre, velocidad, catálogo (conteos, enlaces, recorrido circular, ausencia de conteos fijos) y el store compartido. Smoke portable del dominio compilado: 45/45.
- Build de producción: 239 páginas; precache de 28 recursos; campo 258 821 y dashboard 239 449 bytes gzip iniciales (objetivo < 307 200).
- Playwright: 27/27 pruebas en Chromium aprobadas y 1 omitida (GPU física), como en la entrega anterior: narrativa 2D, fallback sin WebGL, axe WCAG AA, 360 px sin desborde, sin JavaScript, filtros conservados y módulos operativos.
- Recorrido 3D con WebGL por software (SwiftShader, 1440 × 900, pistas de 8 núcleos / 8 GB): modo 3D en calidad Alta; el botón «Explorar» abre el panel con el primer dato de la escena, las flechas lo recorren y Escape lo cierra devolviendo el foco; señalar con el puntero muestra el rótulo y el cursor de acción; el clic fija el dato con su enlace exacto (`/eventos/EV-2009-001`, `/eventos?proyectos=%22CL%22`); un clic en vacío deselecciona; en reposo el render vuelve a `demand`; sin errores de consola ni desborde horizontal. En 390 px táctil: modo 3D, sin desborde, canvas sin puntero.
- Sonda de hover: con el puntero quieto y la cámara girando, el realce se actualiza por frame (`events.update()`) y el clic coincide con el último estado señalado.
- Constelación y muro comparados con la exportación anterior en la misma GPU por software: antes negros en ambas; ahora con color por instancia y las tres tarjetas verdes visibles.

## Límites

- La prueba en GPU física sigue pendiente, igual que en la entrega anterior. Aquí el recorrido se verificó con WebGL por software (SwiftShader) en Chromium headless, que no mide el rendimiento real.
- `animation-timeline` requiere Chrome/Edge 115+ (Safari y Firefox según versión); sin soporte el contenido se ve estático, sin pérdida de información.
- Los hotspots no sustituyen al texto: el panel repite la identidad del dato y enlaza a su ficha, pero las cifras oficiales, sus períodos y sus fuentes siguen en la narrativa HTML.
