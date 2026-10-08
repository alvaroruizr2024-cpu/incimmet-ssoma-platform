# Validación del paso 4: correcciones para el paso 5

Entorno: Node v20.19.2 y npm 9.2.0 (Linux). Probé el problema de `overrides` también con npm 10.9.2. Navegador: Chrome headless con WebGL2 por software (SwiftShader), a 1280×800 y 390×844. Instalé el zip `incimmet-ssoma-platform_paso4.zip` (229 archivos) tal cual y ejecuté `cp .env.example .env.local`. Solo apliqué los parches mínimos de la última sección.

`package-lock.json` generado (después de los parches): `incimmet-ssoma-platform/package-lock.json`, SHA-256 `4de888f6…698533c`.

## Resultado por comando

| Comando | Original | Con los parches |
|---|---|---|
| `npm install` | **FALLA**: `npm ERR! Unable to resolve reference $playwright-core` (npm 10.9.2: `Unable to resolve reference $postcss`) | OK, 548 paquetes |
| `npm run verify:deps` | **FALLA**: `npm ls` da `ELSPROBLEMS`, con `invalid: picomatch@4.0.7` (vite, vitest, tinyglobby) | OK |
| `npm run verify:data` | OK (SHA-256 `72883232…5181347`; 225/168/22/12/33) | OK |
| `npm run format:check` | OK | OK |
| `npm run lint` | **FALLA**: 9 errores y 1 warning (B3) | OK |
| `npm run typecheck` / `typecheck:e2e` | OK / OK | OK / OK |
| `npm test` (vitest 4.1.11) | OK, 17 archivos y 288/288 pruebas | OK |
| `npm run build` | **FALLA** (por lint) | OK. Además, las 225 fichas `/eventos/[id]` se generan como SSG |
| `npm run verify:step4` | **FALLA** (verify:deps) | OK |
| `npm audit` / `audit:prod` | 10 (7 altas y 3 moderadas, todas de desarrollo) / **0** | igual |
| `npm run test:e2e` | No se ejecutó: el entorno de validación no tiene los navegadores de Playwright | — |
| Servidor y rutas | 200 en todas las rutas. `/eventos/NO-EXISTE` da **404**, `favicon.ico` e `icon.svg` dan 200, data.json tiene el SHA-256 idéntico y cada página tiene su propio `<title>` | — |

Lo verificado en el navegador que funciona bien:
- **Filtros cruzados:** un clic en la barra CL de "Eventos por proyecto" lleva a `?proyectos="CL"`, con 138 eventos y 35 acciones. Filtrar desde "Ver datos" (Daño a la propiedad) da 103/22.
- **Reproducción:** "Simular tiempo real" avanza 1→8 de 52 en 12 s con `contexto=reproduccion`, y funcionan Pausar, Siguiente y Salir.
- **Acciones:** el kanban muestra 5 columnas (3/13/14/11/127 = 168) y el diálogo de evidencia abre.
- **Eventos:** la tabla abre la ficha correcta.
- **Rol:** el rol se conserva al recargar (SSOMA en Catálogos, Supervisor con proyecto CL en Campo) y el CTA "Reportar en campo" sobrevive a la recarga.
- **Intro:** el 3D se mantiene en escritorio (Alta) y en móvil (Equilibrada→Bajo consumo, ya sin caer a 2D). La barra de escenas no tapa contenido y las cifras ya no se superponen. No hay errores JS.

## Estado de FIXES_PASO3 (19 ítems)

**18 corregidos y 1 parcial.**
- **Corregidos:** B1 (los errores originales del 3D), B2, A1, A2, A3, A4, M1, M2, M3, M4, L1, L2, L3, L4, L5, L6, L7 y L8.
- **Parcial:** M5. Producción queda en 0 vulnerabilidades, pero quedan 10 en herramientas de desarrollo (cadena de `tailwindcss@3.4.17` y `eslint-config-next` vía fast-glob). Ver L1 abajo.
- Además, las correcciones introdujeron problemas nuevos: B1–B3 y A1.

## Problemas, por prioridad

### Bloqueantes

**B1. `npm install` falla por referencias `$` en `overrides`.**
- Comando y error: `npm install` da `npm ERR! Unable to resolve reference $playwright-core`. Con npm 10.9.2 el error es `Unable to resolve reference $postcss`.
- Dónde: `package.json`, en `overrides`: `"postcss": "$postcss"`, `"vite": "$vite"` y `"playwright-core": "$playwright-core"`. Las referencias `$` solo resuelven contra `dependencies`, y estos tres paquetes están en `devDependencies`.
- Corrección: usar versiones literales: `"postcss": "8.5.29"`, `"vite": "6.4.4"` y `"playwright-core": "1.56.1"`.

**B2. Los overrides de picomatch rompen el árbol y `verify:deps` (y por tanto `verify:step4`) falla.**
- Comando y error: `npm run verify:deps` responde "No se pudo verificar npm ls --all --json", con `ELSPROBLEMS invalid: picomatch@4.0.7 … "4.0.4" from node_modules/vite, "3.0.2" from node_modules/vite/node_modules/fdir`.
- Dónde: `package.json`, en `overrides`: `"picomatch@<2.3.2"`, `"picomatch@>=3.0.0 <3.0.2"` y `"picomatch@>=4.0.0 <4.0.4"`. npm aplica el selector sobre el rango pedido, no sobre la versión resuelta.
- Corrección: eliminar los tres. Lo verifiqué: sin ellos se resuelven `picomatch@2.3.2` y `4.0.7` (ambas parcheadas), `npm ls` queda limpio y `npm audit` no reporta picomatch.

**B3. `npm run lint` da 9 errores y 1 warning (con `--max-warnings=0`).**
- `components/three/camera-rig.tsx:38`: `react-hooks/immutability`, "Modifying component props or hook arguments is not allowed" (`timeline.current = progresoNarrativo(...)` escribe sobre la prop `timeline`).
  Corrección: el rig no debe mutar la prop. Hay que pasar un callback `onProgreso(p: number)` para que el padre escriba en su propia ref, o compartir el progreso con un store transitorio (por ejemplo, Zustand `getState/setState` sin suscripción).
- `components/three/data-moments.tsx:237` (8 veces, una por cada `ref={registrar(i)}` de las líneas 241, 266, 280, 299, 326, 348, 364 y 383): `react-hooks/refs`, "Cannot access refs during render. Passing a ref to a function may read its value during render".
  Corrección: extraer cada momento a un componente `<Momento indice={i} timeline={timeline}>` con su propia `useRef<Group>` y un `useFrame` que calcule su propia visibilidad. Otra opción son callbacks ref inline, `ref={(g) => { grupos.current[0] = g; }}`, sin la fábrica `registrar`.
- `components/screens/eventos.tsx:69`: warning `react-hooks/incompatible-library` ("TanStack Table's useReactTable() API returns functions that cannot be memoized safely").
  Corrección: agregar la directiva `'use no memo';` al inicio del componente `Eventos`, o un `eslint-disable-next-line` justificado.

### Alta

**A1. Desborde horizontal por `<select>` con opciones largas.**
- `/lecciones`: el scrollWidth es de **1472 px a 1280** y de **509 px a 390**. El select "Actividad crítica" mide 471 px por la opción "Limpieza y rehabilitación de labores con instalaciones eléctricas" (`components/screens/lecciones.tsx:110,119,128`).
- `/campo` con rol Supervisor: el scrollWidth es de **1537 px a 1280** y de **619 px a 390**. El select "Función responsable" de la cabecera mide 603 px y empuja fuera el botón de tema (`components/shell/app-shell.tsx:84-95`). El `max-w-[250px]` está en el `<label>`, pero la pista grid `auto` crece hasta el contenido.
- Corrección: agregar `w-full min-w-0` a todos los `<select>`, usar `grid-cols-[minmax(0,1fr)]` en los `<label className="grid …">` y agregar `min-w-0` al contenedor de acciones de la cabecera (línea 49). Opcionalmente, una regla global en `app/globals.css:29`: `label.grid { grid-template-columns: minmax(0,1fr); } select { width: 100%; text-overflow: ellipsis; }`.

**A2. Intro 3D: la textura de roca se ve pixelada, como un mosaico.**
- Dónde: `components/three/geometry.ts:35-47`. Es una `DataTexture` de 64×64 de ruido blanco por píxel, con los filtros por defecto de DataTexture (`NearestFilter`, sin mipmaps), `repeat.set(9, 42)`, y se usa como `map` y `bumpMap` (`tunnel-geometry.tsx:41-42,52`).
- Efecto: la bóveda parece de azulejos. Con la luz cálida de las escenas 5 y 8 parece un baño beige (ver `desk_5_potencial.png` y `desk_8_continuar.png`). Es lo que más resta calidad profesional a la intro.
- Corrección: `texture.magFilter = LinearFilter; texture.minFilter = LinearMipmapLinearFilter; texture.generateMipmaps = true; texture.anisotropy = gl.capabilities.getMaxAnisotropy(); texture.colorSpace = SRGBColorSpace`. Además, generar ruido suave tileable (fbm o value noise de 256–512 px), usarlo sobre todo como `roughnessMap`/`bumpMap` con `bumpScale` bajo, dejar el albedo casi uniforme con variación sutil y bajar el `repeat`.

### Media

**M1. Error de hidratación en la página 404.** En `/eventos/NO-EXISTE` (y en cualquier 404), en escritorio y móvil, aparece `pageerror: Minified React error #418 (args[]=HTML)`. La causa probable es que la 404 se prerenderiza con `usePathname() === '/_not-found'` y en el cliente vale la ruta real, así que el estado activo del menú (`app-shell.tsx:132-136`, `ruta.startsWith(n.href)`) y `rutaPermitida` (línea 175) difieren entre servidor y cliente.
Corrección: calcular `aria-current` y la clase activa recién después de montar (`useEffect` y estado `montado`), o renderizar en `app/not-found.tsx` un contenido que no dependa de la ruta. Se puede verificar con `next start` mirando la consola en una URL inexistente.

**M2. Legibilidad de los gráficos ECharts** (`lib/analytics/echarts-options.ts`):
- Se omiten etiquetas del eje X: "Eventos por proyecto" solo muestra CL, OR, SM, RO, RA, AN, y "Accidentes por nivel" solo I, III, V. Corrección: `axisLabel.interval: 0` (líneas 44-49) y, para proyectos, barras horizontales ordenadas con el nombre completo.
- Hay ticks decimales en conteos: "Alto potencial por proyecto" muestra 0.5 y 1.5, y "Tendencia mensual" también. Corrección: `yAxis.minInterval: 1` (líneas 52-57).
- `dataZoom` arranca en `start: 0` (líneas 197-205): la tendencia mensual abre en 2009-01…2010-07, que está vacío. Además, el slider aparece en gráficos donde sobra. Corrección: abrir la ventana en los últimos 24 meses (`start` calculado al final), y mostrar el slider solo cuando haya más de 24 categorías y nunca en móvil.
- Las leyendas `type:'scroll'` (líneas 107 y 154) se paginan (1/2, 1/3) y truncan el texto ("Declarada cerrada sin evidenc…"). Corrección: leyenda `plain` abajo, con varias líneas y etiquetas cortas.
- `aria.decal.show: true` (línea 31) aplica tramas a todas las series y genera ruido visual. Corrección: activarlo solo con un toggle de "alto contraste / patrones".
- En "Tendencia anual", 2024 domina porque es el único año con detalle completo. Corrección: agregar un `markArea` "detalle completo 2024–may 2026" y una nota de cobertura en el propio gráfico.

**M3. El aviso "Calidad y cobertura de datos" ocupa la parte visible en todas las pantallas.** Está abierto por defecto y tiene 6 viñetas. En móvil (390×844) empuja los KPI fuera de la primera pantalla.
Corrección: mostrarlo plegado por defecto como un chip "Calidad de datos · 6 avisos", recordar su estado en `sessionStorage` y desplegarlo solo en el dashboard la primera vez.

**M4. Composición 3D en móvil y en las escenas 6 y 7.**
- En móvil los rótulos 3D ("2009—2026", "225", "6") quedan detrás de la columna de texto y la ensucian (`contact_mob_intro_a.png`).
- En la escena 6, el muro de 168 tarjetas se extiende detrás de las tarjetas de texto y las 3 cerradas no se distinguen.
- En la escena 7, las estaciones quedan tapadas por la grilla de módulos.
- Corrección: en móvil, ocultar los rótulos 3D o llevarlos a una franja superior. En escritorio, colocar los grupos de `data-moments.tsx` (líneas 348 y 364) a la derecha del 55% del ancho, dar a las 3 tarjetas cerradas un emisivo verde con bloom y atenuar el resto.

### Baja

- **L1 (resto de M5 del paso 3).** `npm audit` reporta 10 vulnerabilidades de desarrollo: `tailwindcss@3.4.17` → chokidar, braces, micromatch y fast-glob (sin corrección en 3.x); `postcss-nested` / `postcss-selector-parser`; y `eslint-config-next@16.4.0` → `@next/eslint-plugin-next` → fast-glob. Producción queda en 0. Corrección: documentarlo como riesgo solo de build, o planificar Tailwind v4 (`@tailwindcss/postcss`).
- **L2.** El diálogo de evidencia usa el `<input type="file">` nativo y muestra "Choose File / No file chosen" en inglés (`components/actions/evidence-dialog.tsx:346`). Usar un input oculto con un `<Button>` "Seleccionar archivo" y el nombre del archivo en español.
- **L3.** El chip de filtro muestra el valor crudo "Contexto: reproduccion" (`components/shell/filtro-chips.tsx`, `String(v)`). Mapear `reproduccion` → "Reproducción histórica 2026" y `base+local` → "Base + cambios locales".
- **L4.** En consola, en `/analisis` y `/lecciones`: `The resource …/_next/static/css/fc82f808c1e07978.css was preloaded using link preload but not used`. Revisar qué CSS de ruta se precarga sin usarse, probablemente la de la presentación.
- **L5.** En las tarjetas del kanban, "No consta" aparece tres veces (Responsable, fecha y caja de compromiso), en `components/screens/acciones.tsx` alrededor de las líneas 183-200. Hay que unificarlo en una sola línea "Responsable y fecha: no constan".
- **L6.** `app/(marketing)/presentacion.css` tiene 1169 líneas con selectores duplicados (`.intro-scene` en las líneas 108, 589, 632, 775, 991, 999, 1115, 1160 y 1166, y algo parecido con `.intro-scene-nav`), porque los cambios del paso 4 se agregaron como sobrescrituras. Consolidar en una sola definición por selector antes de seguir iterando.

## Crítica visual

**Intro 3D.** Es un salto claro respecto del paso 3. Cada escena tiene ahora su momento basado en datos:

| Escena | Momento 3D |
|---|---|
| 1 | Portal "2009—2026" |
| 2 | 225 partículas |
| 3 | 12 pórticos de proyecto (CL 138) |
| 4 | Tableros IF/IS/IA |
| 5 | 6 balizas |
| 6 | Muro 3/168 |
| 7 | Estaciones del ciclo |
| 8 | Salida a la luz |

Además, la cámara avanza de verdad, la navegación vertical de escenas es elegante y el texto está limpio. **Ya se ve profesional, con impacto medio-alto.** Para llegar a alto impacto falta:
1. Arreglar la textura de roca (A2), que hoy abarata todo.
2. Hacer que los rótulos 3D sean nítidos y legibles: CanvasTexture con más resolución y `anisotropy` máxima (en `data-moments.tsx:117-119` hoy es 2).
3. Dar acentos de color con intención: balizas en ámbar real #FFC000 con pulso y bloom, y las 3 tarjetas cerradas en verde.
4. En la escena 8, una salida con cielo en gradiente y brillo, en lugar de un rectángulo blanco plano.
5. En móvil, priorizar el texto (M4) o usar el póster `public/intro/*.webp` como fondo fijo.

**Dashboard.** La estructura es sólida y profesional: KPI claros con su procedencia, filtros cruzados que funcionan, reproducción histórica, exportación CSV/PNG y una tabla accesible por gráfico. Lo que hoy le resta:
1. Las tramas (decal) en todas las series y los ejes con etiquetas omitidas y ticks decimales (M2) hacen que los gráficos se vean "de plantilla".
2. El aviso de calidad abierto ocupa la parte visible (M3).
3. No hay una lectura ejecutiva inmediata. Sugerencia: una franja superior "Lo que dicen los datos" con 3 hallazgos automáticos, por ejemplo: "CL concentra 61% de los eventos"; "1.8% de acciones con cierre verificado"; "127 acciones sin información".
4. Las tarjetas de gráfico son altas y tienen mucho espacio vacío bajo el área de trazado. Hay que ajustar `grid.bottom` y la altura según el tipo.
5. La paleta categórica (violeta y verde azulado) no es corporativa. Usar la gama navy/azul/cyan de INCIMMET más el ámbar solo para riesgo.

## Parches aplicados durante la validación (solo para desbloquear)

```diff
--- a/package.json
+++ b/package.json
@@ "overrides" @@
-    "postcss": "$postcss",
-    "vite": "$vite",
-    "playwright-core": "$playwright-core",
+    "postcss": "8.5.29",
+    "vite": "6.4.4",
+    "playwright-core": "1.56.1",
     "react": "$react",
     "react-dom": "$react-dom",
-    "three": "$three",
-    "picomatch@<2.3.2": "2.3.2",
-    "picomatch@>=3.0.0 <3.0.2": "3.0.2",
-    "picomatch@>=4.0.0 <4.0.4": "4.0.4"
+    "three": "$three"
--- a/components/three/camera-rig.tsx
+++ b/components/three/camera-rig.tsx
@@ -37 @@
+      // eslint-disable-next-line react-hooks/immutability -- parche temporal de validación
       timeline.current = progresoNarrativo(driver.scroll, starts);
--- a/components/three/data-moments.tsx
+++ b/components/three/data-moments.tsx
@@ -236 @@
+    // eslint-disable-next-line react-hooks/refs -- parche temporal de validación
     grupos.current[i] = g;
--- a/components/screens/eventos.tsx
+++ b/components/screens/eventos.tsx
@@ -68 @@
+  // eslint-disable-next-line react-hooks/incompatible-library -- parche temporal de validación
   const table = useReactTable({
```
Los tres `eslint-disable` son provisionales. La corrección real es la de B3. Se generó `package-lock.json` y no hubo otros cambios.
