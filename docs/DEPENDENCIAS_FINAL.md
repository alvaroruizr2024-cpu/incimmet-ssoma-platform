# Dependencias y lockfile final

No se añadieron, eliminaron ni cambiaron versiones de dependencias npm respecto al árbol real aportado. `package-lock.paso4.json` se copió como `package-lock.json` sin reserialización, sin regeneración y sin modificación de metadata.

- SHA-256: `4de888f62b2759a58b3a8b8beeec301b244ae945294387bc3016f3868698533c`.
- `lockfileVersion`: 3. Versión del paquete conservada: `0.4.0`.
- Node de referencia del usuario: 20.19.2; npm 9.2.0. Contenedor de autoría: Node 22.16.0/npm 10.9.2.
- Next/eslint-config-next 16.4.0; React/React DOM 19.2.4; Three 0.175.0; Fiber 9.4.0; drei 10.0.7; GSAP 3.13.0.
- ECharts 6.1.0; TanStack Table 8.21.3; Query 5.90.5; Zustand 5.0.8; idb 8.0.3; Fuse.js 7.1.0.
- Vitest/coverage-v8 4.1.11; TypeScript de proyecto 5.9.3; Prettier 3.9.9; Vite 6.4.4; PostCSS 8.5.29; Playwright core/test 1.56.1.

Los nuevos overrides son los parches literales especificados por el informe del usuario. No hay selectores picomatch. `verify:lock` contrasta ambos manifiestos de dependencias directas y rechaza las referencias `$` de dependencias solo de desarrollo; `verify:deps` sigue comprobando un árbol npm realmente instalado. No se sustituyó esa comprobación por una simple lectura del lock.

Para conservar la reproducibilidad del árbol validado, el worker usa Workbox 7.3.0 desde su CDN oficial en la primera instalación. Es una dependencia de ejecución del worker **fuera del árbol npm**, declarada también en README, CSP y nota de materiales. Los módulos son descargados por el navegador, no están falsamente incluidos como ficheros locales. Si se requiere autoalojamiento o se decide migrar Tailwind, será necesario un cambio revisado de dependencias/lock, licencias y QA.

`@react-three/drei` puede traer dependencias transitivas que la escena no usa: no se borran manualmente entradas del lock ni paquetes internos. Los imports de ECharts son modulares; el motor 3D es dinámico; no se añadió otro motor de gráficos, un SDK Supabase sin uso ni una biblioteca para comprimir imágenes. La compresión utiliza Canvas nativo.

Riesgos residuales de las herramientas del árbol: consulte SEGURIDAD_FINAL. Ni el hash del lock ni el número de paquetes prueban ausencia de vulnerabilidades.
