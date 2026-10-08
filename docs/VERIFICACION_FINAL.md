# Verificación final — paso 5 de 5

**Fecha: 07/10/2026.** Este informe describe lo ejecutado sobre el repositorio final; no transforma pruebas del núcleo en una validación de toda la aplicación. Los resultados previos del usuario para el paso 4 parcheado se conservan como antecedente en `docs/entradas/FIXES_PASO4.md`.

## Entorno de autoría

Node 22.16.0, npm 10.9.2; TypeScript global 5.8.3. El proyecto fija TypeScript 5.9.3 y reproduce Node 20.19.2 mediante `.nvmrc` y workflow. Se usó Prettier oficial 3.9.9, obtenido en un paso anterior como artefacto upstream; su versión coincide con package.json. Chromium nativo 144.0.7559.96 permitió una comprobación aislada de compresión.

No hubo árbol npm completo instalado. El intento de `npm ci --offline --ignore-scripts --no-audit --no-fund --loglevel=error` terminó con **ENOTCACHED**; la consulta de auditoría al registro terminó con **EAI_AGAIN**. No se incluyeron stubs de dependencias ni un lock artificial para convertir las comprobaciones en éxito. El lock real del usuario permanece byte a byte.

## Comandos exigidos: resultado efectivo

| Comando                 | Resultado final del intento                                                      | Interpretación                                                             |
| ----------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `npm run lint`          | Exit 127: eslint no encontrado.                                                  | No aprobado; no es un resultado de análisis sobre dependencias instaladas. |
| `npm run typecheck`     | Exit 2: módulos/types React, Next y otros ausentes, con diagnósticos en cascada. | No aprobado; no permite certificar el conjunto de tipos de la aplicación.  |
| `npm run typecheck:e2e` | Exit 2: Playwright/types ausentes.                                               | No aprobado.                                                               |
| `npm test`              | Exit 127: vitest no encontrado.                                                  | Suite escrita, no ejecutada en este contenedor.                            |
| `npm run build`         | Exit 127 al encadenar lint.                                                      | Next.js no completó su build; no se generó una app shell final real.       |
| `npm audit --omit=dev`  | Exit 1: consulta al registro fallida.                                            | No se afirma una auditoría limpia de esta revisión.                        |

Los comandos, versiones, tiempos y códigos exactos están en `verificacion-final/comandos-npm.json` y los logs asociados. Las fallas no se suprimieron del script `verify:final` ni del build. **La condición de aceptación con lint, tipos, Vitest y build aprobados sigue pendiente.**

## Verificaciones ejecutadas satisfactoriamente

| Prueba                      | Resultado                                                                 | Alcance y exclusiones                                                                                                             |
| --------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Núcleo de dominio           | 290/290 aserciones portables.                                             | Compilación TypeScript estricta del núcleo; no React/Next/IndexedDB real.                                                         |
| Cinemática                  | 41/41 aserciones portables.                                               | Geometría/poses, narrativa y degradación; no render WebGL.                                                                        |
| Analítica                   | 55/55 aserciones portables.                                               | Agregaciones/modelos/utilidades; no canvas ECharts ni Playwright.                                                                 |
| Privacidad/formulario/ruido | 33/33 aserciones portables.                                               | DNI/nombres/diagnósticos, fecha Lima, campos permitidos, ruido reproducible. No React/Workbox/IndexedDB.                          |
| Generador PWA               | 2/2 tests de Node.                                                        | Fixtures HTML/Flight de QA; extrae dependencias y rechaza shell ausente. No es un build de Next.                                  |
| Opciones de gráficos        | 6/6 contratos aislados.                                                   | Función real transpila y se ejecuta: proyectos, enteros, patrones, ventana final, leyenda/cobertura y tasas. No render del motor. |
| Sintaxis/JSX                | 133 archivos TS/TSX, cero errores sintácticos o atributos JSX duplicados. | Revisión AST/transpilación; no resuelve las bibliotecas externas.                                                                 |
| Lock                        | Coinciden dependencias directas; SHA-256 idéntico al aportado.            | No reemplaza `npm ls` ni la instalación real.                                                                                     |
| JSON                        | 547976 bytes, SHA original, 225/168/22/12/33 y relaciones correctas.      | Integridad documental, no exhaustividad de los hechos.                                                                            |
| CSS de presentación         | Cero selectores duplicados dentro del mismo contexto de media query.      | Análisis CSS estático; las variaciones responsive son explícitas.                                                                 |
| Formato                     | Prettier 3.9.9 `--check .` aprobado.                                      | Misma configuración del proyecto; no modifica fuente JSON/lock.                                                                   |
| Tokens de contraste         | Pares principales de Campo calculados; foco oscuro cambiado a cian.       | No certificación de todas las pantallas ni auditoría AA.                                                                          |
| Íconos y paquete            | PNG 192/512/maskable512 presentes; ZIP sin directorios de ejecución.      | Resultado y hashes finales en el manifiesto e informe de empaquetado.                                                             |

Total del núcleo portable: **419 aserciones** (290 + 41 + 55 + 33). Los dos tests del generador y los seis contratos de gráficos se informan por separado. No se los presenta como «427 tests Vitest».

### Compresión real aislada en Chromium

Se transpilaron las funciones reales `fotos.ts` y `privacidad.ts` y se ejecutaron en Chromium, sin React ni Next. Una imagen de prueba de 3200×2400 se convirtió a JPEG de **1600×1200 y 18113 bytes**. Se comprobaron tres entradas inválidas y el camino alternativo sin `createImageBitmap`. Un UUID determinista permitió confirmar que el nombre final no activa el detector DNI. El JSON de resultado identifica explícitamente la sustitución del UUID y la ausencia de PWA integrada.

No se afirma haber probado instalación, captura física de cámara, dictado, actualización del worker, IndexedDB integrado, navegación a todas las rutas, WebGL final ni la entrega real de encabezados HTTP en este entorno.

## Pruebas incluidas para un entorno con npm

La suite conserva las pruebas anteriores y añade `tests/pwa-final.test.ts`, `tests/graficos-final.test.ts` y `tests/e2e/final.spec.ts`. Casos nuevos: validación antes de guardar, borrador/cola transaccionales, autosave tardío, reintento concurrente, error conservado, proyecto/limpieza, cuota agotada, ruido tileable, gráficos y UI responsive. E2E verifica 404 sin error React, privacidad/teclado/axe, permisos HTTP, instalación de worker, foto, reporte offline, recarga y reconexión sin duplicación.

```bash
npm ci
npm run verify:final
npx playwright install chromium
npm run test:e2e
npm audit
npm run audit:prod
```

Use una ejecución de producción; `npm run dev` no registra el worker. La primera instalación de Workbox requiere conexión al CDN. E2E no contiene un «skip» que convierta un fallo de preparación en éxito. La prueba WebGL adicional de la suite de intro es optativa mediante `E2E_WEBGL=1`, porque debe ejecutarse en una GPU compatible.

## Pendientes explícitos

Instalación/árbol npm completo, lint, typecheck total, Vitest, Next build, Playwright integrado, AA completa, Lighthouse móvil y medición de carga fría. El inventario de bundle se genera solo tras un build real y no se adjunta con valores inventados. También están pendientes la aceptación del riesgo residual de herramientas de desarrollo, los ensayos en dispositivos reales y el despliegue de Preview.

La matriz de la sección 11 del brief está en `ACEPTACION_FINAL.md`; el README es completo y documenta Preview, pero no hay promoción ni despliegue realizado.
