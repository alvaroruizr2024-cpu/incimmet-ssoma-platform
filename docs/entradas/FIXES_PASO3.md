# Validación del paso 3: correcciones para el paso 4

Entorno: Node v20.19.2 y npm 9.2.0 (Linux), Chrome headless con WebGL2 por software (SwiftShader). Instalé el zip `incimmet-ssoma-platform_paso3.zip` sin cambios y ejecuté `cp .env.example .env.local`. Solo apliqué los parches mínimos de la última sección, para poder seguir probando.

## Resultado por comando

| Comando | Resultado |
|---|---|
| `npm install` | OK. 569 paquetes y `package-lock.json` generado. Solo hubo un aviso EBADENGINE porque el entorno tiene npm 9 |
| `npm run verify:deps` | OK, aunque **no detectó** `playwright-core` duplicado (ver B2) |
| `npm run verify:data` | OK. SHA-256 `72883232…5181347` y conteos 225/168/22/12/33 |
| `npm run lint` | **FALLA**, 3 errores y 1 warning (B1) |
| `npm run typecheck` | **FALLA**, 2 errores TS en `tests/e2e/intro.spec.ts` (B2) |
| `npm test` (vitest) | OK, 12 archivos y 242/242 pruebas |
| `npm run build` | **FALLA**, porque encadena lint y typecheck. `next build --webpack` solo también falla, porque Next revisa los tipos de `tests/e2e`. Con los parches pasa: 11 rutas |
| `npx prettier --check .` | **FALLA**, 102 archivos sin formato |
| `npm run test:e2e` | No se ejecutó: el entorno de validación no tiene los navegadores de Playwright |
| Servidor y curl | Todas las rutas devuelven 200, incluido `/?intro=2d`. `/data/data.json` responde 200 con el SHA-256 idéntico |
| Intro en Chrome headless | Escritorio 1280×800: el 3D renderiza (canvas de 1280×800, "3D · Equilibrada", sin errores JS) y recorre las 8 escenas. Móvil 390×844: empieza en 3D y cae a 2D en menos de 5 s (ver M3). `/?intro=2d`: correcto y sin canvas. **No hay desborde horizontal en la intro móvil** (scrollWidth de 390). El JS de three.js solo se carga en modo 3D (21 archivos JS contra 15 en 2D) |

Todos los problemas del paso 2 (FIXES_PASO2.md 1–11) **siguen presentes**. Abajo aparecen marcados con [P2-n].

## Problemas, por prioridad

### Bloqueantes

**B1. `npm run lint` falla, y con él `npm run build` [incluye P2-1]**
- `components/three/atmosphere.tsx:28`: `react-hooks/immutability`, "This value cannot be modified" (se muta `material.uniforms.uTime.value`, que viene de un `useMemo`).
  Corrección: declarar el material en JSX con ref, `<shaderMaterial ref={matRef} uniforms={uniforms} … />`, y en `useFrame` hacer `const m = matRef.current; if (m) m.uniforms.uTime.value += …`. Mutar a través de una ref dentro del callback está permitido.
- `components/three/instanced-support.tsx:44`: `react-hooks/use-memo`. Cambiar `useMemo(pernosBoveda, [])` por `useMemo(() => pernosBoveda(), [])`.
- `components/three/tunnel-geometry.tsx:11`: `react-hooks/use-memo`. Cambiar `useMemo(crearRugosidad, [])` por `useMemo(() => crearRugosidad(), [])`.
- `postcss.config.mjs:1` [P2-1]: `import/no-anonymous-default-export`. Usar `const config = {…}; export default config;`.

**B2. `npm run typecheck` y `next build` fallan por los tests e2e**
- `tests/e2e/intro.spec.ts:5`: TS2353, "'reducedMotion' does not exist in type 'Fixtures<…>'". Corrección: `test.use({ contextOptions: { reducedMotion: 'reduce' } })`.
- `tests/e2e/intro.spec.ts:47`: TS2740, "Type 'Page' is missing the following properties from type 'Page'". La causa es un `playwright-core` duplicado: `@axe-core/playwright@4.10.2` instala la dependencia peer `playwright-core@1.63.0`, mientras `@playwright/test@1.56.1` usa la 1.56.1. Corrección: agregar `"playwright-core": "1.56.1"` en `devDependencies` (o en `overrides`).
- Prevención: excluir `tests/e2e` y `playwright.config.ts` de `tsconfig.json` y crear un `tsconfig.e2e.json` con su propio `typecheck:e2e`, para que un test no rompa el build de producción. Además, ampliar `scripts/verify-dependencies.mjs` para que falle si hay duplicados de `playwright-core`, `react` o `three` (`npm ls <pkg> --all --json`).

### Alta

**A1. [P2-2] La app (no la intro) sigue desbordándose en móvil.** En `/dashboard` y `/campo` a 390 px el scrollWidth es de 601–623 px. Está en `components/shell/app-shell.tsx:50`.
Corrección: `grid-cols-[minmax(0,1fr)] lg:grid-cols-[220px_minmax(0,1fr)]` y agregar `min-w-0` al `<aside>`.

**A2. [P2-3] El rol de demostración sigue sin guardarse** (`components/providers.tsx:37`, `useState`). Ahora además afecta a la intro: el CTA "Reportar en campo" cambia el rol solo en memoria (`components/marketing/context-link.tsx:12`), así que al recargar `/campo` aparece "Módulo no disponible para el rol seleccionado".
Corrección: Zustand `persist` con `sessionStorage` y un flag de hidratación, o `?rol=` en la URL.

**A3. En la intro, las cifras grandes se superponen con sus etiquetas.** `app/(marketing)/presentacion.css:54` (`.intro-indicator-grid p`) y `:62` (`.intro-gap-number`) no definen `line-height`, así que heredan 24 px con fuentes de 61–79 px. El `<p>` mide 24 px de alto y el número desborda: "2.71 / 283.92 / 0.769" pisa "IF / IS / IA", y "1.8% / 75.6%" pisa la línea superior y "con cierre verificado". Se ve en `desk_4_indicadores.png` y `desk_6_evidencia.png`.
Corrección: `line-height:1` (o `1.05`) y un `margin-top` de 8–12 px en ambas reglas, y `display:block` en `.intro-number` dentro de esos contenedores.

**A4. La barra flotante de escenas tapa contenido.** `presentacion.css:75` define `.intro-scene-nav` como `position:fixed; bottom:20px`. A 1280×800 la barra (top=722 px) tapa, recién cargada la página, "Base documental · Corte 07/10/2026 · America/Lima" de la escena 1. Además tapa las líneas de fuente de las escenas 2, 3 y 5, la fila inferior de módulos de la escena 7 y el desplegable de calidad de la escena 8.
Corrección: dar `padding-bottom ≥ 170px` a `.intro-scene` (línea 17) y hacer que cada escena entre en `100svh` a 1280×800. Una alternativa en escritorio es una navegación vertical de puntos en el borde derecho.

### Media

**M1. [P2-4]** `/eventos/NO-EXISTE` sigue devolviendo HTTP 200 (`app/eventos/[id]/page.tsx`).
Corrección: `generateStaticParams()` desde data.json, `dynamicParams = false` o `notFound()`.

**M2. [P2-5]** Ya corregido en `/` ("Del reporte a la evidencia · Gestión SSOMA | INCIMMET"), pero el resto de las rutas siguen con el `<title>` genérico.
Corrección: `export const metadata = { title: '…' }` en cada `app/**/page.tsx` y `generateMetadata` en `/eventos/[id]`.

**M3. El 3D pasa a 2D de forma definitiva y sin explicación clara.**
- `components/three/mine-canvas.tsx:64,77-78`: `PerformanceMonitor` mide mientras `busy`, y `busy` incluye `warming`. Es decir, mide durante los primeros 4 s, cuando se compilan los shaders, y eso provoca bajadas de calidad falsas: alta→equilibrada en escritorio, y equilibrada→baja→2D en móvil (390×844), con `onFallback()` que deja `failed=true`.
- `components/marketing/cinematic-experience.tsx:89` muestra entonces "El motor 3D se detuvo", que se lee como un error, y el botón de la línea 105 queda deshabilitado sin forma de volver a intentar.
- Corrección: no medir hasta 1.5–2 s después del primer frame, usar umbrales más tolerantes en móvil (`bounds` [24,50]) y distinguir el motivo: "Rendimiento insuficiente: se muestra la versión 2D" frente a un error real o la pérdida de contexto. Además, ofrecer un botón "Reintentar 3D".

**M4. La presentación ejecutiva muestra jerga técnica.** `components/marketing/story.tsx:43,56,80,90` dicen "Fuente: data.json · eventos[]", "proyectos[] y eventos[]", "eventos[].alto_potencial" y "acciones[].estado_verificado".
Corrección: textos legibles, por ejemplo "Fuente: base documental SSOMA INCIMMET (Power BI SSOMA 2024–may 2026, alertas e informes 2009–2026), corte 07/10/2026".

**M5. [P2-11, empeoró] Dependencias con vulnerabilidades.** `npm audit` reporta 16 (3 críticas, 9 altas y 4 moderadas). Las críticas son `vitest@3.2.4`, `@vitest/coverage-v8@3.2.4` y `tinypool`; las altas son `vite@6.4.1` (≤6.4.2), `postcss@8.5.6`, la cadena de `tailwindcss@3.4.17` y `eslint-config-next` (vía fast-glob). Con `--omit=dev` quedan 9 (6 altas), todas de herramientas de build, porque `tailwindcss-animate` está en `dependencies`.
Corrección: `postcss` 8.5.29, `vite` 6.4.4, actualizar `vitest` y `@vitest/coverage-v8` a la versión parcheada que indique `npm audit` (la rama ≤4.1.10 está afectada), mover `tailwindcss-animate` a `devDependencies` y volver a ejecutar `npm audit`.

### Baja

- **L1.** Escena 8 con rótulo duplicado: `story.tsx:102` (`<p className="intro-label">DEL APRENDIZAJE A LA ACCIÓN</p>`) repite el eyebrow de la línea 13 ("08 / 8 · Del aprendizaje a la acción"). Hay que eliminarlo.
- **L2. [P2-6]** `/favicon.ico` sigue en 404 y aparece como error de consola en todas las páginas. Agregar `app/icon.svg` como placeholder neutro.
- **L3. [P2-7]** Siguen los prefetch masivos: 11 solicitudes RSC abortadas en `/eventos`. Usar `prefetch={false}` en los enlaces de tabla (`eventos.tsx:9`, `acciones.tsx:13`, `lecciones.tsx:11`) y aplicar `encodeURIComponent` en todos.
- **L4. [P2-8]** Siguen los avisos fijos en `components/shell/app-shell.tsx:70-71`. Hay que calcularlos desde los datos, sin modificar data.json.
- **L5. [P2-9]** `prettier --check` ahora falla en 102 archivos. Ejecutar `npm run format` y agregar `format:check` a la verificación.
- **L6. [P2-10]** `next-env.d.ts` sigue versionado y `next build` lo reescribe. Agregarlo a `.gitignore`.
- **L7.** El botón de la intro (`cinematic-experience.tsx:104-106`) dice "Lectura 2D" mientras está deshabilitado en modo 2D, lo que confunde. En ese estado debería decir "3D no disponible" y mostrar el motivo como texto visible, no solo en `title`.
- **L8.** `mine-canvas.tsx:68` usa `powerPreference: 'low-power'` también en calidad alta, lo que fuerza la GPU integrada en portátiles con dos GPU. Usar `'high-performance'` cuando `initialQuality === 'alta'`.

## Crítica visual de la intro 3D (capturas a 1280×800 y 390×844)

Nota: las capturas usan GPU por software (SwiftShader). En una GPU real la nitidez será mejor, pero la composición es la misma.

**Veredicto: se ve profesional y sobria, pero todavía no tiene alto impacto.** Lo que funciona: tipografía y jerarquía limpias, una paleta navy/cyan coherente, un túnel creíble (bóveda con malla, pernos, cables y luminarias), un contraste de texto legible y una lectura 2D y móvil muy prolija. Lo que falla:
1. **El 3D es un fondo, no un relato.** Las 8 escenas muestran casi el mismo encuadre: la bóveda a la derecha, con un leve avance. Si se tapa el texto, no se distingue la escena 2 de la 5.
2. **Los datos no aparecen en 3D**, salvo los 12 paneles tenues de la escena 3 y un monolito negro sin explicación en la escena 8.
3. **Falta contraste y un punto focal.** Es gris azulado sobre navy, la viñeta izquierda es pesada y no hay un "hero shot".
4. **No hay narrativa de color.** El ámbar de riesgo aparece solo en una nota.
5. El wordmark sobre un recuadro blanco parece un sticker en la escena oscura.

Sugerencias concretas:
- **Un momento 3D por escena, ligado a los datos:**
  - E2: 225 puntos de luz instanciados a lo largo del túnel, coloreados por `tipo_grupo`.
  - E3: 12 estaciones o pórticos de proyecto con su rótulo, con Cerro Lindo como el más grande.
  - E4: tres tableros de indicadores integrados en la pared.
  - E5: 6 balizas ámbar (#FFC000) pulsando en la oscuridad.
  - E6: 168 tarjetas colgantes en gris, de las que solo 3 se iluminan en verde. Es la brecha de evidencia hecha imagen.
  - E7: 6 estaciones del ciclo (Reporte→Lección) a lo largo del camino.
  - E8: salida del túnel a la luz del día, cálida, que cierra "Hagamos el camino juntos". Reemplaza al monolito.
- **Cámara con intención:** dolly más marcado, con giro y pausa frente a cada momento 3D (GSAP ScrollTrigger con `scrub`), y un cambio de iluminación entre escenas.
- **Luz y postproceso:** cono de luz de casco con haz volumétrico, bloom selectivo en luminarias y balizas (solo en calidad alta), niebla con gradiente de profundidad, más variación de albedo en la roca y una viñeta más suave en la mitad derecha.
- **Composición:** texto en una columna de 40–45% como máximo, punto focal 3D a la derecha y cifras clave en cyan de marca con `line-height:1`.
- **Marca:** wordmark en versión blanca sin recuadro sobre fondo oscuro, y paleta corporativa (#002060, #0070C0, #00B0F0) con ámbar #FFC000 solo para riesgo.
- **Móvil y 2D:** en lugar del degradado navy plano, usar un póster renderizado (imagen o video webm corto del recorrido) para que la versión ligera también impacte, y mostrar ese póster mientras carga el JS 3D (~860 KB).

## Parches aplicados durante la validación (solo para desbloquear)

```diff
--- a/postcss.config.mjs
+++ b/postcss.config.mjs
-export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
+const config = { plugins: { tailwindcss: {}, autoprefixer: {} } };
+export default config;
--- a/components/three/instanced-support.tsx
+++ b/components/three/instanced-support.tsx
@@ -44 @@
-  const bolts = useMemo(pernosBoveda, []);
+  const bolts = useMemo(() => pernosBoveda(), []);
--- a/components/three/tunnel-geometry.tsx
+++ b/components/three/tunnel-geometry.tsx
@@ -11 @@
-  const rock = useMemo(crearRugosidad, []);
+  const rock = useMemo(() => crearRugosidad(), []);
--- a/components/three/atmosphere.tsx
+++ b/components/three/atmosphere.tsx
@@ -27,0 +28 @@
+  // eslint-disable-next-line react-hooks/immutability -- parche temporal de validación
--- a/tests/e2e/intro.spec.ts
+++ b/tests/e2e/intro.spec.ts
@@ -5 @@
-  test.use({ reducedMotion: 'reduce' });
+  test.use({ contextOptions: { reducedMotion: 'reduce' } });
--- a/package.json   (npm install -D --save-exact playwright-core@1.56.1; npm además reordenó alfabéticamente las dependencias)
+    "playwright-core": "1.56.1",
```
El `eslint-disable` de `atmosphere.tsx` es provisional. La corrección real es la de B1. `next build` regeneró `next-env.d.ts` y se creó `package-lock.json`.
