# Cambios de entrega — PASO 3

**Origen:** `incimmet-ssoma-platform_paso2.zip`.
**SHA-256 del ZIP de origen:** `d29e293a32a7cc73bc3cbd0e391d234fbcc789de07a5ec108e501ab94b1aa1f1`.

Se conservaron los **106 archivos** del repositorio del paso 2. No se elimina ni reemplaza la base de datos original. La entrega es un repositorio completo, no un parche.

## Archivos heredados modificados

- `.gitignore`
- `README.md`
- `THIRD_PARTY_NOTICES.md`
- `app/(marketing)/page.tsx`
- `app/globals.css`
- `components/shell/app-shell.tsx`
- `components/three/README.md`
- `docs/ARBOL_ARCHIVOS.txt`
- `messages/es-PE.ts`
- `package.json`

## Archivos nuevos

- `app/(marketing)/presentacion.css`
- `components/brand/wordmark.tsx`
- `components/marketing/animated-number.tsx`
- `components/marketing/browser-state.ts`
- `components/marketing/cinematic-experience.tsx`
- `components/marketing/context-link.tsx`
- `components/marketing/fallback-gallery.tsx`
- `components/marketing/motion-context.tsx`
- `components/marketing/story.tsx`
- `components/three/atmosphere.tsx`
- `components/three/camera-rig.tsx`
- `components/three/geometry.ts`
- `components/three/instanced-support.tsx`
- `components/three/mine-canvas.tsx`
- `components/three/tunnel-geometry.tsx`
- `docs/CAMBIOS_PASO3.md`
- `docs/CODIGO_PASO3.md`
- `docs/DEPENDENCIAS_PASO3.md`
- `docs/MANIFIESTO_PASO3.json`
- `docs/PRESENTACION_PASO3.md`
- `docs/VERIFICACION_PASO3.md`
- `docs/entradas/PROMPT_03.md`
- `docs/verificacion/paso3/build.exit`
- `docs/verificacion/paso3/build.log`
- `docs/verificacion/paso3/cinematica.log`
- `docs/verificacion/paso3/data.log`
- `docs/verificacion/paso3/domain.log`
- `docs/verificacion/paso3/imports.log`
- `docs/verificacion/paso3/npm-install.exit`
- `docs/verificacion/paso3/npm-install.log`
- `docs/verificacion/paso3/playwright.exit`
- `docs/verificacion/paso3/playwright.log`
- `docs/verificacion/paso3/syntax.log`
- `docs/verificacion/paso3/vitest.exit`
- `docs/verificacion/paso3/vitest.log`
- `lib/data/presentacion.server.ts`
- `lib/domain/cinematica.ts`
- `lib/domain/presentacion.ts`
- `playwright.config.ts`
- `scripts/cinematica-smoke.cjs`
- `scripts/verify-dependencies.mjs`
- `tests/cinematica.test.ts`
- `tests/e2e/intro.spec.ts`
- `tests/presentacion.test.ts`

## Conservación y alcance

Se conservan las rutas operativas, tipos, adaptadores, reglas de dominio, pruebas del paso 2, SQL y documentos de diseño. La portada ya no usa la envoltura operativa, pero esta se mantiene en las demás rutas. El wordmark compartido usa el placeholder textual aprobado. Las advertencias y estados importados se mantienen.

Los archivos de verificación del paso 2 son antecedentes históricos. Los resultados actuales están en `docs/verificacion/paso3/` y `docs/VERIFICACION_PASO3.md`. `docs/CODIGO_PASO3.md` reproduce la implementación cambiada sin depender de fragmentos del chat.

El ZIP excluye solo dependencias instaladas, cachés, compilaciones temporales y reportes efímeros del navegador. No incluye `node_modules`, `.next`, `.verification`, secretos, fotos ni archivos tipográficos. El futuro `package-lock.json` debe proceder de una instalación real, no se ha fabricado.

## Verificaciones reproducibles

`npm run verify:data` comprueba el JSON; `npm run test:cinematica:portable` comprueba el nuevo dominio; `npm run verify:deps` requiere instalación completa. Consulte el README para build, Vitest y Playwright.
