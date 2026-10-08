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

## Ampliación cinematográfica e interactiva (segunda iteración, 08/10/2026)

Petición: la página debía percibirse claramente cinematográfica e interactiva en cualquier dispositivo. Criterios aplicados de los skills instalados: dirección de diseño «rediseño que preserva» con movimiento motivado (apertura, jerarquía, respuesta al gesto), sin estética de videojuego; y la guía de interfaz de Vercel (reducción de movimiento, animar solo `transform`/`opacity`, control de pausa para el movimiento automático, gestos con alternativa de pulsación y teclado, `touch-action` que conserva el desplazamiento y el zoom).

- **Apertura** (`aperturaCamara`): la cámara llega desde 3,4 m atrás y 0,42 m más baja durante 2,6 s mientras la exposición sube desde el negro; el DOM funde desde negro y escalona el titular. Sin JavaScript o con movimiento reducido la página termina igualmente visible.
- **Latido ambiental**: en reposo el canvas sigue en `demand`, pero un reloj invalida 30 frames por segundo (24 en calidad baja) para mantener polvo, niebla, tres luminarias que titilan y una respiración de cámara milimétrica (`respiracionCamara`). El monitor de rendimiento sigue midiendo solo en ventanas de movimiento.
- **Arrastre para mirar** (`giroDesdeArrastre`, `giroHaciaReposo`): con ratón o dedo, el arrastre gira la mirada hasta ±0,62 rad en horizontal y ±0,3 rad en vertical y vuelve despacio al encuadre al soltar. El canvas usa `touch-action: pan-y pinch-zoom`: el desplazamiento vertical y el zoom siguen siendo del navegador. Soltar tras arrastrar no fija ni deselecciona nada.
- **Luz que responde**: el haz de inspección se orienta hacia el puntero fino o hacia el dedo que arrastra; al asentarse la cámara en una escena, su luz se enciende un instante (`realceLlegada`).
- **Marcadores y rótulos anclados**: cada dato lleva un marcador 3D de tamaño constante en pantalla (`pulsoMarcador`) y, en la escena activa, un botón DOM anclado a su instalación. El canvas proyecta las posiciones por frame y escribe solo el `transform`; `anclasVisibles` elige las más cercanas dentro del encuadre y `distribuirAnclas` las reparte sin solaparse ni tapar el bloque de texto de la escena, con histéresis para que no salten. Las escenas con cientos de instancias usan un único botón que abre el recorrido por el panel. En móvil, con el panel abierto, los rótulos se retiran; la instalación sigue respondiendo al toque.
- **Recorrido automático** (`posicionRecorrido`): viaje de 3,2 s y pausa de lectura de 4,4 s por escena, con botón de reproducir/pausar en la navegación; rueda, toque, tecla, pulsación o cualquier desplazamiento ajeno lo detienen. No existe con movimiento reducido.
- **Revelados y 2D**: cada bloque de escena entra escalonado al llegar al viewport, en 2D y 3D y en cualquier ancho; los contadores animan siempre que el movimiento esté permitido. En 2D el póster deriva lentamente, un barrido de luz recorre la escena y el diagrama de cada escena entra con un fundido.
- **Guía de gestos**: en la primera escena del 3D, un rótulo indica «Arrastre para mirar · Pulse un punto para abrirlo» y desaparece al primer gesto sobre el canvas o a los 15 s.

## Verificación

Ejecutada el 08/10/2026 sobre el build final (Node 22.22.0, Chromium de Playwright 1.56.1):

- Prettier, ESLint (0 avisos) y TypeScript de aplicación y E2E aprobados.
- 329/329 pruebas unitarias en 20 archivos; las 11 nuevas (`tests/cinematica-interactiva.test.ts`) cubren óptica, presencia, acentos, mirada libre, velocidad, catálogo (conteos, enlaces, recorrido circular, ausencia de conteos fijos) y el store compartido. Smoke portable del dominio compilado: 45/45.
- Build de producción: 239 páginas; precache de 28 recursos; campo 258 821 y dashboard 239 449 bytes gzip iniciales (objetivo < 307 200).
- Playwright: 27/27 pruebas en Chromium aprobadas y 1 omitida (GPU física), como en la entrega anterior: narrativa 2D, fallback sin WebGL, axe WCAG AA, 360 px sin desborde, sin JavaScript, filtros conservados y módulos operativos.
- Recorrido 3D con WebGL por software (SwiftShader, 1440 × 900, pistas de 8 núcleos / 8 GB): modo 3D en calidad Alta; el botón «Explorar» abre el panel con el primer dato de la escena, las flechas lo recorren y Escape lo cierra devolviendo el foco; señalar con el puntero muestra el rótulo y el cursor de acción; el clic fija el dato con su enlace exacto (`/eventos/EV-2009-001`, `/eventos?proyectos=%22CL%22`); un clic en vacío deselecciona; en reposo el render vuelve a `demand`; sin errores de consola ni desborde horizontal. En 390 px táctil: modo 3D, sin desborde, canvas sin puntero.
- Sonda de hover: con el puntero quieto y la cámara girando, el realce se actualiza por frame (`events.update()`) y el clic coincide con el último estado señalado.
- Constelación y muro comparados con la exportación anterior en la misma GPU por software: antes negros en ambas; ahora con color por instancia y las tres tarjetas verdes visibles.

### Segunda iteración

- Prettier, ESLint (0 avisos) y TypeScript aprobados; 337/337 pruebas unitarias (19 en el archivo de cinemática interactiva); smoke portable 49/49; build de 239 páginas y precache de 28 recursos; Playwright 28/28 aprobadas y 1 omitida (GPU), con una prueba nueva del recorrido automático en 2D.
- Recorrido con WebGL por software (1440 × 900): apertura activa y retirada; latido ambiental en reposo comprobado por diferencia entre capturas; rótulos anclados visibles y pulsables con panel y enlace exacto; arrastre que cambia el encuadre sin fijar datos; recorrido automático que avanza y se detiene al interactuar; sin errores de consola ni desborde. Móvil 390 px táctil en 3D Equilibrada: el toque abre el panel. 2D forzado: ambiente, revelado y contador.

## Límites

- La prueba en GPU física sigue pendiente, igual que en la entrega anterior. Con GPU por software el monitor de rendimiento puede degradar la calidad hasta 2D en segundos; eso es el comportamiento previsto del fallback, no una medida de rendimiento real. Aquí el recorrido se verificó con WebGL por software (SwiftShader) en Chromium headless, que no mide el rendimiento real.
- `animation-timeline` requiere Chrome/Edge 115+ (Safari y Firefox según versión); sin soporte el contenido se ve estático, sin pérdida de información.
- Los hotspots no sustituyen al texto: el panel repite la identidad del dato y enlaza a su ficha, pero las cifras oficiales, sus períodos y sus fuentes siguen en la narrativa HTML.
