# Verificación del PASO 4

## Resultado principal

**No se acredita todavía la condición solicitada de cuatro comandos aprobados.** Se intentaron `lint`, `typecheck`, `test` y `build`; sus resultados no fueron satisfactorios en el contenedor, donde las dependencias no pudieron instalarse. El ZIP entrega la implementación completa para revisión, no una certificación de build.

Entorno usado: Node 22.16.0, npm 10.9.2, TypeScript global 5.8.3. Objetivo del usuario: Node 20.19.2; está fijado en `.nvmrc`, pero no se ejecutó ese runtime aquí.

| Comprobación                | Resultado real                                                                                      |
| --------------------------- | --------------------------------------------------------------------------------------------------- |
| npm install                 | EAI_AGAIN al resolver registry.npmjs.org.                                                           |
| npm run lint                | Código 127: eslint no instalado.                                                                    |
| npm run typecheck           | Código 2: dependencias/tipos React, Next, Vitest, etc. ausentes; no sirve como validación completa. |
| npm test                    | Código 127: vitest no instalado.                                                                    |
| npm run build               | Código 127: se detuvo en lint; no se obtuvo build Next.js.                                          |
| npm run typecheck:e2e       | Código 2 por paquetes/tipos Playwright ausentes.                                                    |
| npm run verify:deps         | Código 1: dependencias ausentes; el verificador no da un éxito falso.                               |
| npm audit                   | ENOLOCK; sin árbol/lock instalado, no hay auditoría válida.                                         |
| Compilación del núcleo      | Aprobada: tsc -p tsconfig.domain.json, estricto. No incluye interfaz ni dependencias externas.      |
| Pruebas portables heredadas | 290 de dominio + 41 cinemáticas aprobadas.                                                          |
| Pruebas portables nuevas    | 55 de analítica/modelos/reproducción/exportación aprobadas.                                         |
| Revisión sintáctica         | 119 TS/TSX, cero errores de sintaxis. No comprueba APIs externas ni lint.                           |
| JSON                        | 547976 bytes, SHA-256 original y relaciones/conteos verificados.                                    |
| Formato                     | Ejecutado con Prettier 3.9.9 estable; consultar format-check.log para la comprobación final.        |

Los logs y códigos de salida se encuentran en `docs/verificacion/paso4`. `resultados.json` guarda comando, código, entorno y fecha. Los logs anteriores se conservan como históricos y no se utilizan para aprobar este paso.

## Verificación aislada de exportaciones

Se compilaron las funciones reales de cliente y sus dependencias puras. En Chromium se ejecutaron la generación/descarga de las fichas LA-001, LA-014 y LA-022: PNG de 1440 px de ancho, con todo el contenido y sin errores de JavaScript. Se probó descarga CSV con neutralización de fórmulas y escape de comillas, y el contenedor PNG de gráfico con un canvas de prueba.

**Alcance:** se prueban las utilidades reales, no el montaje React ni el render ECharts. Informe `aislado/export-report.json`; ejemplos de fichas incluidos. La prueba de gráfico no demuestra que ECharts esté instalado.

## Verificación CSS aislada

Se extrajo la estructura de los TSX de intro mediante un serializador JSX mínimo, se aplicó el CSS real y un reset equivalente para las reglas utilizadas. Se comprobaron ocho escenas en 1280×800, 390×844 y 360×800. Después de corregir la navegación móvil, no hubo desbordamiento horizontal, intersección de la navegación con la columna al posicionar cada escena ni colisión de cifras con sus etiquetas.

**Alcance:** fixture estática de CSS; no usa el runtime React19, la hidratación Next, sus fuentes calculadas ni WebGL. No valida rutas operativas, respuesta HTTP, WCAG ni rendimiento. Los reportes y capturas están identificados expresamente como fixtures.

## Formateador utilizado

Se obtuvo el artefacto oficial estable Prettier 3.9.9 del repositorio público de Prettier, tag 3.9.9 / commit cdd17f2288b28b170a76416c72dac56e3ea5daff, artifact 10735133596. Se ejecutó su CLI, que informa 3.9.9. Solo se utiliza como herramienta de autoría: no se distribuye su ZIP, node_modules ni fuentes tipográficas.

## Puerta de aceptación en un entorno con npm

```bash
npm install
npm run verify:step4
npm audit
npm audit --omit=dev
npx playwright install chromium
npm run test:e2e
```

Conservar el lock real generado. No eliminar lint, no usar ignoreBuildErrors, no hacer casts de Page ni desactivar reglas para aparentar éxito. Revalidar la auditoría, los seis módulos a 390 px, la carga/validación real en IndexedDB, las descargas, la restauración de filtros, la persistencia de rol y el recorrido con GPU.
