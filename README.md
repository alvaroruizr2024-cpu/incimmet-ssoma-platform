# INCIMMET · Portal SSOMA mejorado

Entrega de rediseño · 07/10/2026 · Cinemática interactiva · 08/10/2026.

Navegación institucional marino/azul con iconos; indicadores prioritarios; tarjetas, tablas y controles más legibles; versiones clara y oscura; vistas adaptadas a móvil. Se conservan la presentación minera, los datos documentales y los flujos locales.

La presentación 3D incorpora apertura cinematográfica (travelling de llegada y fundido desde negro), movimiento ambiental continuo en reposo (polvo, niebla, luminarias y respiración de cámara), óptica y mirada libre, arrastre para mirar con ratón o dedo, haz de luz que sigue la mano, instalaciones de datos que se ensamblan al acercarse con marcadores visibles y rótulos pulsables anclados a cada dato (panel accesible, recorrido por teclado y enlaces a fichas y filtros de la plataforma), recorrido automático con pausa, acento lumínico por escena y revelados por scroll también en 2D. Sin dependencias nuevas y con los mismos fallbacks. Detalle, alcance y límites en docs/CINEMATICA_INTERACTIVA.md.

## Ejecutar el paquete ya compilado

Requiere Node 20.19 o superior compatible con package.json.

```sh
node scripts/serve-export.mjs --port 3100
```

Abra http://127.0.0.1:3100/ para la presentación 3D o http://127.0.0.1:3100/dashboard para la aplicación. El directorio out contiene las 239 páginas y recursos compilados. No necesita instalar dependencias para servir ese resultado.

## Desarrollo y verificación

```sh
npm ci
npm run verify:lock
npm run verify:deps
npm run verify:data
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

El build exporta páginas estáticas y regenera el manifiesto de precache. La ficha local utiliza /eventos/local?id=LOCAL-... para admitir identificadores creados después de publicar. Los filtros de contexto se conservan en sus enlaces.

Los encabezados del alojamiento están en public/_headers y out/_headers. El servidor de vista previa aplica las mismas políticas principales. Campo habilita cámara y micrófono; otras rutas los deshabilitan. La PWA requiere HTTPS o localhost y preparación inicial con conexión al CDN de Workbox.

Se utiliza Babel con next/babel y una sola tarea de generación para compatibilidad con el entorno Windows de verificación. La importación de PerformanceMonitor es directa y evita compilar módulos de Drei ajenos al portal.

## Resultados y límites

337 pruebas unitarias aprobadas (20 archivos). Build de producción y TypeScript aprobados; 239 páginas generadas. 28 pruebas en Chromium aprobadas y 1 omitida (GPU física). El recorrido 3D y su interacción se verificaron con WebGL por software; la prueba con GPU física sigue pendiente y no se garantiza funcionamiento universal al 100%. Las pruebas en navegador, la integridad del JSON y los controles de dependencias se documentan en el informe de entrega.

Es una demo documental: roles simulados, reportes y evidencias locales, sin autenticación operativa ni backend de transmisión. Los datos originales no se modificaron. Los cierres documentales y las coberturas parciales mantienen sus advertencias.

## Publicación

Sitio publicado en Vercel desde el repositorio GitHub `alvaroruizr2024-cpu/incimmet-ssoma-platform` (rama `main`, integración Git): https://incimmet-ssoma-platform.vercel.app. `vercel.json` fija el build (`npm run build`, webpack) y las cabeceras de seguridad equivalentes a `public/_headers`. La protección del proyecto es la estándar de Vercel: el dominio de producción es público y las URL de previsualización requieren iniciar sesión en Vercel.

`scripts/verificar-publicacion.sh <URL>` comprueba estados HTTP, contenido y cabeceras de `/`, `/dashboard`, `/eventos/EV-…`, `/campo`, `/sw.js`, el manifiesto y la respuesta 404; el workflow «Verificar publicación» lo ejecuta a mano desde Actions o al terminar cada despliegue de producción. El paquete no contiene credenciales.

Los documentos de pasos anteriores en docs son históricos. Este README y el informe de entrega describen la versión rediseñada; docs/CINEMATICA_INTERACTIVA.md describe la capa cinemática interactiva añadida el 08/10/2026.
