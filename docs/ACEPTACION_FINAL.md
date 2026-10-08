# Criterios de aceptación final

Se conserva el texto de la sección 11 del brief. **Código implementado no equivale a aceptación integrada verificada.** `[x]` indica que se acreditó el criterio completo; `[ ]` mantiene abierta alguna parte. La validación del usuario para el paso 4 parcheado es antecedente, no una ejecución de la versión final. Véase VERIFICACION_FINAL para el alcance exacto de las pruebas portables/aisladas.

| Estado | Criterio del brief                                                                                                          | Evidencia disponible y pendiente                                                                                                                                                                                                  |
| ------ | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [ ]    | Presentación 3D con scroll fluida en un portátil promedio; fallback 2D verificado sin WebGL.                                | Escenas y fallback implementados; dominio cinemático probado. Falta render integrado final, ausencia de WebGL, movimiento reducido y medición en portátil real.                                                                   |
| [ ]    | El dashboard muestra 225 eventos y 168 acciones; los filtros cruzados actualizan todos los gráficos y la URL.               | Integridad/conteos y funciones de filtro comprobados; E2E escritos. Falta ejecución integrada final de todos los gráficos/URL.                                                                                                    |
| [ ]    | Pareto, mapa de calor proyecto×mes, tendencia, HPRI, IF/IS/IA (oficiales + metas 2026) y cumplimiento verificado funcionan. | Agregaciones y contratos de opciones pasan; interfaces incluidas. Falta ECharts/selecciones/exportación integrados de esta revisión.                                                                                              |
| [ ]    | Ficha de evento con acciones, lecciones y fuentes vinculadas.                                                               | Datos/relaciones y fichas preservados; baseline previo del usuario favorable. Falta navegación integrada final/404 sin hidratación.                                                                                               |
| [ ]    | Las acciones muestran estado verificado y semáforo; adjuntar evidencia (mock) cambia el estado según la regla.              | Reglas de dominio probadas; diálogo y almacenaje implementados. Falta carga/validación/recarga final con IndexedDB y navegador.                                                                                                   |
| [ ]    | La búsqueda de lecciones devuelve resultados relevantes (p. ej., «voladura», «malla», «equipos móviles»).                   | Fuse.js y filtros implementados; pruebas de búsqueda incluidas. Suite Vitest final no ejecutada.                                                                                                                                  |
| [ ]    | La PWA es instalable, el reporte funciona offline y se sincroniza al volver la conexión; no pide datos personales.          | Formulario/cola/Workbox/A2HS implementados; privacidad y compresión aisladas probadas. Falta instalación, recarga offline y reintento real bajo Next/Workbox. Sincronización de demo significa registro local, no envío servidor. |
| [ ]    | Accesibilidad básica verificada; Lighthouse dentro de los objetivos.                                                        | HTML accesible, teclado, aria-live y tablas presentes; revisión de tokens y pruebas axe escritas. Falta AA de pantallas, Lighthouse móvil ≥85/≥90 y bundle inicial medido.                                                        |
| [x]    | README completo; despliegue en Vercel documentado.                                                                          | README español, arquitectura, comandos, datos, integración futura, limitaciones y Preview documentados. El despliegue efectivo no se ha realizado.                                                                                |

## Comprobaciones parciales acreditadas

- [x] `data.json` conserva bytes, SHA-256 y conteos del original.
- [x] `package-lock.json` es idéntico al real aportado; las dependencias directas coinciden.
- [x] Overrides literales y eliminación de selectores picomatch, sin cambios de versiones.
- [x] No se añadieron supresiones ESLint en código para ocultar B3.
- [x] Núcleo compila con TypeScript global 5.8.3 y pasan 419 aserciones portables (290 + 41 + 55 + 33).
- [x] Dos tests Node del generador PWA pasan con fixtures HTML/Flight y fallo ante shell ausente.
- [x] Seis contratos aislados de opciones de gráficos pasan, sin renderer ECharts.
- [x] Compresión de imagen real aislada ejecutada en Chromium, con casos inválidos y fallback.
- [x] PNG de íconos PWA presente en 192/512 y maskable512; no incluye fuentes.
- [ ] `npm ci` completo y árbol de dependencias final instalado en el contenedor de autoría.
- [ ] `npm run lint`, tipos completos, `npm test` y `npm run build` finales aprobados.
- [ ] Auditoría final del árbol contra el registro y aceptación del riesgo residual de desarrollo.
- [ ] Playwright y axe contra la aplicación final.
- [ ] Preview y aprobación antes de producción.

Los checks de integridad/formato/sintaxis y el empaquetado se acompañan de sus resultados en `docs/verificacion-final/`. No se marcaron como aprobadas las puertas que no se pudieron ejecutar con el entorno requerido.
