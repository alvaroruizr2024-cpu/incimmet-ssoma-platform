# Verificación de entrega — PASO 3

## Ejecutado

| Verificación                                                    | Resultado                                                          |
| --------------------------------------------------------------- | ------------------------------------------------------------------ |
| Compilación estricta de dominio con TypeScript 5.8.3 disponible | Aprobada                                                           |
| Pruebas portables heredadas                                     | 290/290 aprobadas                                                  |
| Pruebas portables nuevas                                        | 41/41 aprobadas                                                    |
| Sintaxis TS/TSX                                                 | 88 archivos, 0 errores (no sustituye resolución de tipos externos) |
| Datos originales                                                | 547976 bytes, SHA-256 y relaciones verificados                     |
| Integridad del ZIP y conservación de archivos del paso 2        | Verificadas al empaquetar; ver manifiesto                          |

SHA-256 de `public/data/data.json`:
`72883232b0934397c2fde8eaaaa04f262b93fa6457e3ad1c3b0aae9cb5181347`

Las 41 verificaciones nuevas cubren cifras/denominadores, nulos, versiones oficiales ambiguas, aislamiento de modificaciones locales, 8 escenas, degradación, heurísticas de capacidad, límites de DPR, tramos de scroll de altura variable, continuidad/monotonía del recorrido y geometría determinista. No son 41 pruebas de navegador.

Se inspeccionó la maquetación CSS con un harness HTML estático en Chromium, a 1440×1000 y 360×800; el documento estático de revisión no presentó desborde horizontal a 360 px. Ese harness no ejecuta React, Next, GSAP ni WebGL y no se distribuye como sustituto de la aplicación. No acredita el comportamiento responsive final de la app compilada.

## Intentado, pero bloqueado

- `npm install --fetch-retries=0 --fetch-timeout=3000 --no-audit --no-fund`: **EAI_AGAIN**, fallo DNS al resolver registry.npmjs.org. Código 1.
- `npm run build`: detenido en `eslint: not found`, porque no se pudieron instalar dependencias. No llegó a Next ni al typecheck completo.
- `npm test`: `vitest: not found`.
- `npm run test:e2e`: `playwright: not found` (CLI del proyecto no instalada).

Los logs y códigos de salida están en `docs/verificacion/paso3/`. El entorno del usuario puede tener red aunque este contenedor no la tenga.

## Pendiente de validación real

Instalación/resolución completa, typecheck de dependencias externas, ESLint, build Next, suite Vitest, e2e/axe del proyecto, render WebGL, FPS en GPU física, pausa/reanudación reales de pestaña, Lighthouse y tamaño de bundles. No se certifica WCAG AA ni se afirma alcanzar objetivos de rendimiento sin esas mediciones.

## Procedimiento de aceptación con npm disponible

```bash
npm install
npm run verify:deps
npm run verify:data
npm run test:domain:portable
npm run test:cinematica:portable
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run dev
```

La suite e2e usa el build de producción servido en 127.0.0.1:3100 y comprueba cifras del HTML, navegación por teclado, conservación de filtros, 360 px, contenido sin JavaScript, fallback sin WebGL y axe. El caso WebGL se omite deliberadamente salvo `E2E_WEBGL=1`: necesita un equipo que pueda crear WebGL2 sin caveat mayor. En PowerShell: `$env:E2E_WEBGL='1'; npm run test:e2e`.

Pruebas manuales adicionales: desplegar cada detalle con zoom; desactivar/reactivar movimiento; activar movimiento reducido durante la visita; ocultar y recuperar la pestaña; simular context loss con herramientas del navegador; salir por ambos CTA; confirmar datos y filtros en el dashboard heredado. No introducir contadores ficticios para compensar un fallo.
