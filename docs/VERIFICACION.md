# Registro de verificación — PASO 2

Fecha de preparación: **07/10/2026**. Entorno disponible: Node **22.16.0**, npm **10.9.2**, compilador independiente TypeScript **5.8.3**. Objetivo del repositorio: Node 20.19+ y TS 5.9.3 según package.json.

## Resultados ejecutados

| Comprobación                                   | Resultado y alcance                                                                                                                                |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Compilación estricta de `tsconfig.domain.json` | Exit 0; dominio, tipos del JSON, normalización y validación runtime; no React/Next/idb                                                             |
| `scripts/domain-smoke.cjs`                     | **290/290 pruebas aprobadas**; incluye 165 acciones recalculables, fórmulas, filtros, cobertura, fechas, privacidad estructural y cierre operativo |
| `scripts/verify-data.mjs`                      | Exit 0; bytes, SHA-256, 225/168/22/12/33, IDs y relaciones                                                                                         |
| Comprobación sintáctica de TS/TSX              | **67 archivos TS/TSX sin errores de sintaxis**; ver `verificacion/syntax.log`; no equivale al typecheck con dependencias                           |

Huella del JSON: `72883232b0934397c2fde8eaaaa04f262b93fa6457e3ad1c3b0aae9cb5181347`, **547976 bytes**. Coincide byte a byte con el archivo adjunto recibido. Las fixtures sintéticas solo viven en pruebas y jamás se agregan a `public/data/data.json`.

El núcleo conserva IF Perú 2024 **2.7098** como oficial y **3 cierres documentales**, con **2 alertas parciales**. El recálculo IF matemático es distinto del redondeado oficial y no lo reemplaza.

## Verificaciones bloqueadas o pendientes

La conexión al registro npm no estaba disponible. El intento `npm install --offline --ignore-scripts --no-audit --no-fund` falló porque faltaba `@radix-ui/react-label` en caché (`ENOTCACHED`). No pudo instalarse Next/React/Vitest/Zustand/idb ni producirse el lockfile.

| Comando / prueba                                        | Estado                                                          |
| ------------------------------------------------------- | --------------------------------------------------------------- |
| `npm install` con resolución completa                   | No completado; entorno sin acceso al registro                   |
| `npm test` (Vitest)                                     | No validado; ejecutable no instalado                            |
| `npm run lint` / `npm run build`                        | No validados; ESLint y dependencias de aplicación no instalados |
| Typecheck completo con TS 5.9.3 y tipos de dependencias | Pendiente; el intento local registra módulos ausentes           |
| Navegación en navegador / SSR / IndexedDB / History API | Suite escrita y revisión de código; integración real pendiente  |
| SQL/RLS/pgTAP                                           | No ejecutados contra Postgres/Supabase                          |
| WCAG, Lighthouse, Vercel, instalación PWA               | No evaluados en este paso                                       |

Los logs de comandos efectivamente intentados están en `docs/verificacion/`. No se afirma que haya pasado el build ni Vitest. La revisión mental y sintáctica no sustituyen la ejecución real.

## Reproducir en un entorno con dependencias

```bash
npm install
npm run verify:data
npm test
npm run test:domain:portable
npm run typecheck
npm run lint
npm run build
```

Luego guardar el lockfile y usar `npm ci`. Para SQL, usar un proyecto de desarrollo vacío, revisar el script completo, aplicar el esquema e instalar pgTAP antes de ejecutar `supabase/tests/rls_smoke.sql`. No ejecutar el ejemplo a ciegas sobre una base productiva.

## Lista del PASO 2

- [x] Esqueleto, configuraciones y versiones directas fijadas.
- [x] Original JSON preservado.
- [x] Tipos exactos y tipos objetivo/lectura.
- [x] DataSource estático, persistencia idb, selector y stub Supabase.
- [x] Funciones de dominio y pruebas Vitest por familia.
- [x] Zustand y sincronización URL.
- [x] Layout, roles, calidad, temas y privacidad.
- [x] Esquema objetivo, identidad separada y ejemplos RLS.
- [x] Documentación, instrucciones originales, árbol y ZIP.
- [ ] Instalación completa, build/ESLint/Vitest y revisión en navegador: pendientes por entorno.

Los criterios globales del brief (3D, gráficos, PWA completa y despliegue) no se marcan como cumplidos por un esqueleto del paso 2.
