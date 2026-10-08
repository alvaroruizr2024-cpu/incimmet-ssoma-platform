# Código nuevo o modificado — INCIMMET · PASO 3

Este documento contiene el contenido completo de los archivos de implementación y configuración nuevos o modificados respecto al ZIP del paso 2. El repositorio completo, incluidos los archivos heredados sin cambios, se entrega en `incimmet-ssoma-platform_paso3.zip`. Los registros de pruebas y documentación se consultan dentro de `docs/`.

La instalación del árbol npm y la compilación completa de Next.js no se pudieron verificar en el contenedor de autoría. Véase `docs/VERIFICACION_PASO3.md`.

## Índice de archivos

1. `.gitignore`
2. `app/(marketing)/page.tsx`
3. `app/(marketing)/presentacion.css`
4. `app/globals.css`
5. `components/brand/wordmark.tsx`
6. `components/marketing/animated-number.tsx`
7. `components/marketing/browser-state.ts`
8. `components/marketing/cinematic-experience.tsx`
9. `components/marketing/context-link.tsx`
10. `components/marketing/fallback-gallery.tsx`
11. `components/marketing/motion-context.tsx`
12. `components/marketing/story.tsx`
13. `components/shell/app-shell.tsx`
14. `components/three/atmosphere.tsx`
15. `components/three/camera-rig.tsx`
16. `components/three/geometry.ts`
17. `components/three/instanced-support.tsx`
18. `components/three/mine-canvas.tsx`
19. `components/three/tunnel-geometry.tsx`
20. `lib/data/presentacion.server.ts`
21. `lib/domain/cinematica.ts`
22. `lib/domain/presentacion.ts`
23. `messages/es-PE.ts`
24. `package.json`
25. `playwright.config.ts`
26. `scripts/cinematica-smoke.cjs`
27. `scripts/verify-dependencies.mjs`
28. `tests/cinematica.test.ts`
29. `tests/e2e/intro.spec.ts`
30. `tests/presentacion.test.ts`

## `.gitignore`

```text
node_modules/
.next/
out/
.verification/
coverage/
.env*
!.env.example
*.tsbuildinfo
.DS_Store

playwright-report/
test-results/
```

## `app/(marketing)/page.tsx`

```tsx
import type { Metadata } from 'next';
import { cargarPresentacion } from '@/lib/data/presentacion.server';
import { CinematicExperience } from '@/components/marketing/cinematic-experience';
import { Story } from '@/components/marketing/story';
import './presentacion.css';

export const metadata: Metadata = {
  title: 'Del reporte a la evidencia · Gestión SSOMA',
  description:
    'Presentación documental INCIMMET: proyectos, indicadores oficiales y trazabilidad de acciones.',
};
export const dynamic = 'force-static';
export const runtime = 'nodejs';

export default async function Presentacion() {
  const data = await cargarPresentacion();
  return (
    <CinematicExperience projectCount={data.proyectos}>
      <Story data={data} />
    </CinematicExperience>
  );
}
```

## `app/(marketing)/presentacion.css`

```css
/* Presentación aislada del tema del dashboard. Paleta corporativa del brief §8. */
.intro-root {
  --intro-navy: #151f44;
  --intro-accent: #1d7dcc;
  --intro-deep: #002060;
  --intro-blue: #0070c0;
  --intro-cyan: #00b0f0;
  position: relative;
  isolation: isolate;
  background: #0f172a;
  color: #fff;
  font-family: Inter, system-ui, Arial, sans-serif;
}
.intro-root *,
.intro-root *::before,
.intro-root *::after {
  box-sizing: border-box;
}
.intro-root :is(a, button, summary, select, section):focus-visible {
  outline: 2px solid #00b0f0;
  outline-offset: 5px;
}
.intro-header {
  position: fixed;
  inset: 0 0 auto;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 18px clamp(18px, 4.5vw, 80px);
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.66), transparent);
}
.intro-header > a {
  flex-shrink: 0;
}
.intro-header-actions {
  display: flex;
  align-items: center;
  gap: 24px;
}
.intro-demo {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.19em;
  color: #cbd5e1;
}
.intro-skip,
.intro-toggle {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  font-size: 13px;
  font-weight: 600;
}
.intro-skip {
  border-bottom: 1px solid #00b0f0;
  color: #fff;
}
.intro-toggle {
  color: #e2e8f0;
  border: 1px solid #70819c;
  border-radius: 6px;
  padding: 0 12px;
  background: rgba(15, 23, 42, 0.9);
}
.intro-toggle:disabled {
  cursor: default;
  color: #cbd5e1;
}
.intro-backdrop {
  position: sticky;
  top: 0;
  height: 100vh;
  height: 100svh;
  margin-bottom: -100vh;
  margin-bottom: -100svh;
  z-index: -1;
  overflow: hidden;
  background: #151f44;
  pointer-events: none;
}
.intro-gallery-svg,
.intro-canvas {
  position: absolute !important;
  inset: 0;
  width: 100%;
  height: 100%;
}
.intro-vignette {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      90deg,
      rgba(8, 16, 32, 0.96) 0%,
      rgba(15, 23, 42, 0.88) 26%,
      rgba(15, 23, 42, 0.38) 61%,
      rgba(15, 23, 42, 0.12) 100%
    ),
    linear-gradient(180deg, rgba(15, 23, 42, 0.2) 65%, rgba(15, 23, 42, 0.65));
}
.intro-main {
  position: relative;
}
.intro-scene {
  min-height: 105vh;
  min-height: 105svh;
  padding: 150px clamp(22px, 8vw, 150px) 130px;
  display: flex;
  align-items: center;
  scroll-margin-top: 0;
}
.intro-scene-content {
  width: 100%;
  max-width: 740px;
}
.intro-wide .intro-scene-content {
  max-width: 970px;
}
.intro-eyebrow {
  display: flex;
  align-items: center;
  gap: 20px;
  color: #b8d9f4;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.17em;
  text-transform: uppercase;
  margin: 0 0 30px;
}
.intro-eyebrow span {
  color: #cbd5e1;
  border-right: 1px solid #657992;
  padding-right: 20px;
  font-variant-numeric: tabular-nums;
}
.intro-label {
  margin: 0 0 22px;
  font-size: 12px;
  line-height: 1.6;
  color: #bae6fd;
  font-weight: 600;
  letter-spacing: 0.16em;
}
.intro-root h1 {
  font-size: clamp(42px, 5.8vw, 84px);
  line-height: 1.08;
  letter-spacing: -0.045em;
  font-weight: 650;
  margin: 0;
}
.intro-root h2 {
  font-size: clamp(33px, 4.2vw, 62px);
  line-height: 1.13;
  letter-spacing: -0.035em;
  font-weight: 600;
  margin: 0 0 34px;
}
.intro-root em {
  color: #8ed7ff;
  font-style: normal;
}
.intro-lead {
  max-width: 580px;
  font-size: clamp(16px, 1.35vw, 19px);
  line-height: 1.8;
  margin: 28px 0;
  color: #e2e8f0;
}
.intro-motto {
  font-size: 15px;
  font-weight: 600;
  margin: 25px 0;
  color: #bae6fd;
}
.intro-hero-links,
.intro-cta-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 24px;
  margin: 32px 0;
}
.intro-explore,
.intro-text-link {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-height: 48px;
  font-size: 14px;
  font-weight: 600;
}
.intro-explore {
  border-bottom: 1px solid #00b0f0;
}
.intro-text-link {
  color: #bae6fd;
  text-decoration: underline;
  text-underline-offset: 5px;
}
.intro-fine {
  max-width: 740px;
  color: #cbd5e1;
  font-size: 12px;
  line-height: 1.8;
  margin-top: 24px;
}
.intro-number {
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.04em;
}
.intro-stat-xl {
  margin: 22px 0 0;
  font-size: clamp(90px, 11vw, 164px);
  font-weight: 550;
  line-height: 1.12;
}
.intro-stat-label {
  font-size: clamp(18px, 2vw, 24px);
  color: #bae6fd;
  margin: 8px 0 22px;
}
.intro-note {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  max-width: 780px;
  border-left: 2px solid #1d7dcc;
  padding: 12px 18px;
  background: rgba(15, 23, 42, 0.86);
  color: #e2e8f0;
  font-size: 13px;
  line-height: 1.8;
  margin: 24px 0;
}
.intro-inline-stat {
  display: flex;
  align-items: center;
  gap: 28px;
  margin: 22px 0 32px;
}
.intro-inline-stat > .intro-number {
  font-size: clamp(72px, 8vw, 104px);
  line-height: 1.1;
  font-weight: 550;
}
.intro-inline-stat > span:last-child {
  font-size: 17px;
  line-height: 1.6;
  color: #cfe8ff;
}
.intro-project-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}
.intro-project-grid article {
  padding: 20px;
  border: 1px solid #53667e;
  background: rgba(15, 23, 42, 0.9);
  border-radius: 8px;
}
.intro-project-code {
  font-size: 11px;
  letter-spacing: 0.2em;
  color: #7dd3fc;
  margin: 0 0 10px;
}
.intro-project-grid h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 15px;
}
.intro-project-grid article > p:last-child {
  font-size: 29px;
}
.intro-project-grid article > p:last-child > span:last-child {
  font-size: 12px;
  color: #cbd5e1;
}
.intro-details {
  max-width: 840px;
  margin-top: 22px;
  padding: 15px 18px;
  border: 1px solid #62748d;
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.95);
}
.intro-details summary {
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.6;
}
.intro-project-list {
  list-style: none;
  padding: 12px 0 0;
  margin: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 22px;
}
.intro-project-list li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-top: 1px solid #40526a;
  font-size: 12px;
}
.intro-project-list li span:last-child {
  white-space: nowrap;
  color: #bae6fd;
}
.intro-indicator-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  margin: 45px 0 28px;
}
.intro-indicator-grid article {
  border-top: 1px solid #7190ad;
  padding-top: 20px;
}
.intro-indicator-grid h3 {
  font-size: 13px;
  font-weight: 700;
  color: #bae6fd;
  letter-spacing: 0.15em;
}
.intro-indicator-grid p {
  font-size: clamp(32px, 4.8vw, 63px);
  font-weight: 550;
  margin: 6px 0;
}
.intro-indicator-grid article > span {
  color: #cbd5e1;
  font-size: 12px;
}
.intro-official {
  color: #dbeafe;
  font-size: 14px;
  line-height: 1.75;
}
.intro-original-values {
  display: grid;
  grid-template-columns: minmax(80px, 120px) minmax(0, 1fr);
  gap: 10px;
  margin: 20px 0 0;
  font-size: 13px;
  line-height: 1.8;
}
.intro-original-values dt {
  color: #bae6fd;
}
.intro-original-values dd {
  overflow-wrap: anywhere;
}
.intro-gap-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 28px;
  margin: 35px 0;
}
.intro-gap-grid article {
  border-top: 2px solid #00b0f0;
  padding: 18px 22px;
  background: rgba(15, 23, 42, 0.91);
}
.intro-gap-grid article:last-child {
  border-color: #9e9e9e;
}
.intro-gap-number {
  font-size: clamp(46px, 6.2vw, 80px);
  font-weight: 550;
  margin: 0 0 16px;
}
.intro-gap-grid h3 {
  font-size: 16px;
  line-height: 1.5;
  font-weight: 500;
  color: #e2e8f0;
}
.intro-gap-grid article > p:last-child {
  font-size: 12px;
  color: #cbd5e1;
  margin-top: 18px;
}
.intro-critical-note {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  background: rgba(15, 23, 42, 0.97);
  border: 1px solid #ffc000;
  border-left: 3px solid #ffc000;
  padding: 18px 20px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.8;
  max-width: 840px;
}
.intro-critical-note svg {
  color: #ffc000;
  flex-shrink: 0;
  margin-top: 3px;
}
.intro-critical-note strong {
  font-weight: 600;
}
.intro-module-grid {
  list-style: none;
  padding: 0;
  margin: 32px 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}
.intro-module-grid li {
  position: relative;
  border: 1px solid #5e7493;
  border-radius: 8px;
  padding: 25px 20px;
  background: rgba(15, 23, 42, 0.94);
}
.intro-module-grid svg {
  color: #7dd3fc;
  margin-bottom: 18px;
}
.intro-module-grid h3 {
  font-size: 16px;
  margin: 0 0 10px;
  font-weight: 600;
}
.intro-module-grid li > p {
  font-size: 13px;
  color: #cbd5e1;
  line-height: 1.7;
}
.intro-module-index {
  position: absolute;
  right: 20px;
  top: 24px;
  color: #cbd5e1;
  font-size: 11px;
}
.intro-cta,
.intro-cta-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 22px;
  min-height: 56px;
  padding: 15px 24px;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 650;
  transition: background-color 0.15s;
}
.intro-cta {
  background: #0070c0;
  border: 1px solid #56b6f0;
  color: white;
}
.intro-cta:hover {
  background: #005a9e;
}
.intro-cta-secondary {
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid #8ca4bf;
  color: #e2e8f0;
}
.intro-cta-secondary:hover {
  background: #002060;
}
.intro-quality ul {
  margin: 16px 0 0;
  padding-left: 20px;
  list-style: disc;
  font-size: 12px;
  line-height: 1.85;
  color: #e2e8f0;
}
.intro-quality li + li {
  margin-top: 8px;
}
.intro-scene-nav {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: calc(100% - 28px);
  padding: 6px;
  border: 1px solid #647b98;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.97);
  box-shadow: 0 8px 28px #0004;
}
.intro-scene-nav button {
  display: grid;
  place-items: center;
  min-width: 44px;
  min-height: 44px;
  border-radius: 5px;
  color: #e2e8f0;
}
.intro-scene-nav button:hover:not(:disabled) {
  background: #002060;
}
.intro-scene-nav button:disabled {
  color: #6e7e94;
}
.intro-scene-picker {
  min-width: 0;
}
.intro-scene-picker select {
  border: 0;
  background: transparent;
  min-height: 44px;
  color: #e2e8f0;
  font-size: 12px;
  padding: 0 10px;
  width: 260px;
}
.intro-scene-picker option {
  background: #0f172a;
  color: white;
}
.intro-render-mode {
  display: inline-block;
  white-space: nowrap;
  padding: 0 13px;
  border-left: 1px solid #647b98;
  font-size: 10px;
  color: #bae6fd;
}
.intro-footer {
  position: relative;
  background: #0f172a;
  padding: 25px clamp(22px, 8vw, 150px) 125px;
  color: #cbd5e1;
  font-size: 12px;
  line-height: 1.8;
  border-top: 1px solid #43536c;
}
.intro-footer a {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.intro-footer button {
  display: flex;
  gap: 8px;
  align-items: center;
  min-height: 48px;
}
.intro-up {
  transform: rotate(180deg);
}
.intro-data-error {
  min-height: 100vh;
  padding: 80px 30px;
  background: #151f44;
  color: white;
}
.intro-data-error p {
  margin: 25px 0;
}
.intro-data-error a {
  text-decoration: underline;
}
@keyframes intro-lamp {
  from {
    opacity: 0.45;
  }
  to {
    opacity: 1;
  }
}
.intro-root[data-mode='2d'][data-ambient='on'] .intro-svg-light {
  animation: intro-lamp 3s ease-out 1 both;
}
@media (min-width: 1800px) {
  .intro-scene {
    padding-left: max(10vw, calc((100vw - 1600px) / 2));
  }
}
@media (max-width: 767px) {
  .intro-header {
    padding: 12px 14px;
    gap: 12px;
    background: rgba(15, 23, 42, 0.96);
  }
  .intro-header-actions {
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .intro-header .incimmet-wordmark {
    padding: 8px 10px;
  }
  .intro-header .incimmet-wordmark-nombre {
    font-size: 18px;
  }
  .intro-header .incimmet-wordmark-lema {
    font-size: 10px;
  }
  .intro-demo {
    display: none;
  }
  .intro-toggle {
    min-height: 36px;
    font-size: 10px;
    padding: 0 8px;
  }
  .intro-toggle svg {
    display: none;
  }
  .intro-skip {
    font-size: 11px;
    min-height: 36px;
    gap: 6px;
  }
  .intro-header-actions {
    max-width: 155px;
  }
  .intro-scene {
    padding: 140px 22px 112px;
    min-height: 100svh;
  }
  .intro-eyebrow {
    margin-bottom: 24px;
    letter-spacing: 0.1em;
    font-size: 10px;
    gap: 12px;
  }
  .intro-hero h1 {
    font-size: clamp(39px, 9.5vw, 58px);
  }
  .intro-lead {
    font-size: 16px;
    line-height: 1.75;
  }
  .intro-vignette {
    background:
      linear-gradient(90deg, rgba(15, 23, 42, 0.94), rgba(15, 23, 42, 0.65)),
      linear-gradient(180deg, transparent, rgba(15, 23, 42, 0.6));
  }
  .intro-project-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .intro-project-grid article {
    display: grid;
    grid-template-columns: 30px 1fr auto;
    gap: 12px;
    align-items: center;
    padding: 14px;
  }
  .intro-project-code,
  .intro-project-grid h3 {
    margin: 0;
  }
  .intro-project-grid article > p:last-child {
    font-size: 24px;
  }
  .intro-project-grid article > p:last-child > span:last-child {
    display: block;
    font-size: 10px;
  }
  .intro-project-list {
    grid-template-columns: 1fr;
  }
  .intro-inline-stat {
    gap: 20px;
  }
  .intro-inline-stat > span:last-child {
    font-size: 14px;
  }
  .intro-indicator-grid {
    gap: 12px;
    margin: 25px 0;
  }
  .intro-indicator-grid article > span {
    font-size: 11px;
    line-height: 1.6;
    display: block;
  }
  .intro-indicator-grid p {
    font-size: clamp(25px, 7.5vw, 42px);
  }
  .intro-gap-grid {
    gap: 12px;
  }
  .intro-gap-grid article {
    padding: 15px 12px;
  }
  .intro-gap-grid h3 {
    font-size: 13px;
  }
  .intro-gap-number {
    font-size: clamp(38px, 10vw, 57px);
  }
  .intro-critical-note {
    padding: 16px;
    font-size: 12px;
  }
  .intro-module-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .intro-module-grid li {
    padding: 20px 14px;
  }
  .intro-module-grid li > p {
    font-size: 12px;
  }
  .intro-cta-row {
    gap: 12px;
  }
  .intro-cta,
  .intro-cta-secondary {
    width: 100%;
  }
  .intro-scene-nav {
    bottom: 12px;
    width: calc(100% - 28px);
    justify-content: space-between;
    gap: 0;
  }
  .intro-scene-picker {
    flex: 1;
  }
  .intro-scene-picker select {
    width: 100%;
    padding: 0 4px;
    font-size: 11px;
  }
  .intro-render-mode {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .intro-root *,
  .intro-root *::before,
  .intro-root *::after {
    animation: none !important;
    transition: none !important;
    scroll-behavior: auto !important;
  }
}
@media print {
  .intro-header,
  .intro-scene-nav,
  .intro-backdrop,
  .intro-footer {
    display: none !important;
  }
  .intro-root,
  .intro-root * {
    color: #0f172a !important;
    background: white !important;
  }
  .intro-scene {
    min-height: 0;
    padding: 28px 0;
    break-inside: avoid;
  }
  .intro-scene h1,
  .intro-scene h2 {
    font-size: 28px;
  }
  .intro-stat-xl {
    font-size: 70px;
  }
  .intro-details {
    display: block;
  }
  .intro-main {
    max-width: 100%;
  }
}
```

## `app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
@layer base {
  :root {
    --background: #f8fafc;
    --foreground: #0f172a;
    --card: #ffffff;
    --muted: #e7e6e6;
    --border: #cbd5e1;
    --primary: #0070c0;
    --secondary-text: #475569;
  }
  .dark {
    --background: #0f172a;
    --foreground: #ffffff;
    --card: #1e293b;
    --muted: #334155;
    --border: #64748b;
    --primary: #0070c0;
    --secondary-text: #cbd5e1;
  }
  body {
    @apply m-0 bg-background font-sans text-base text-foreground antialiased;
  }
  h1 {
    @apply text-3xl font-bold leading-tight tracking-tight sm:text-4xl;
  }
  select {
    @apply min-h-12 max-w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground;
  }
  a,
  button,
  select,
  input,
  summary,
  [tabindex] {
    @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue;
  }
  table {
    @apply w-full border-collapse text-left text-sm;
  }
  thead {
    @apply sticky top-0 bg-muted;
  }
  th {
    @apply p-3 text-xs font-semibold;
  }
  td {
    @apply border-t border-border p-3 align-top;
  }
}
@layer components {
  .text-secondary {
    color: var(--secondary-text);
  }
  .skip-link {
    @apply sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-card focus:p-4;
  }
  .status-badge {
    @apply inline-block rounded-md border px-2 py-1 text-xs font-semibold;
  }
  .status-badge[data-estado='Cerrada con evidencia'] {
    background: #00b050;
    color: #0f172a;
    border-color: #007638;
  }
  .status-badge[data-estado='Declarada cerrada sin evidencia'] {
    background: #ffc000;
    color: #0f172a;
    border-color: #8a6500;
  }
  .status-badge[data-estado='Abierta'] {
    background: #e0f2fe;
    color: #002060;
    border-color: #1d7dcc;
  }
  .status-badge[data-estado='Vencida'] {
    background: #fff1f2;
    color: #991b1b;
    border-color: #e53935;
  }
  .status-badge[data-estado='Sin información'] {
    background: #e7e6e6;
    color: #0f172a;
    border-color: #9e9e9e;
  }
}
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}

/* Identidad compartida: placeholder tipográfico, no logotipo oficial. */
.incimmet-wordmark {
  display: inline-flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 14px;
  border-radius: 6px;
  background: #ffffff;
  color: #151f44;
}
.incimmet-wordmark-nombre {
  font-family: Inter, system-ui, Arial, sans-serif;
  font-size: 23px;
  font-weight: 800;
  letter-spacing: 0.12em;
  line-height: 1.1;
}
.incimmet-wordmark-lema {
  color: #1d7dcc;
  font-weight: 600;
  font-size: 12px;
  line-height: 1.35;
}
.incimmet-wordmark[data-compacto] .incimmet-wordmark-nombre {
  font-size: 19px;
}
```

## `components/brand/wordmark.tsx`

```tsx
import { mensajes } from '@/messages/es-PE';
export function Wordmark({ compacto = false }: { compacto?: boolean }) {
  return (
    <span
      className="incimmet-wordmark"
      role="img"
      aria-label={`${mensajes.marca}. ${mensajes.lema}`}
      data-compacto={compacto || undefined}
    >
      <span className="incimmet-wordmark-nombre" aria-hidden="true">
        {mensajes.marca}
      </span>
      <span className="incimmet-wordmark-lema" aria-hidden="true">
        {mensajes.lema}
      </span>
    </span>
  );
}
```

## `components/marketing/animated-number.tsx`

```tsx
'use client';
import { useEffect, useRef } from 'react';
import { formatoNarrativo } from '@/lib/domain/presentacion';
import { useIntroMotion } from './motion-context';

/** Solo la copia visual anima. La cifra accesible permanece estable y no anuncia cada frame. */
export function AnimatedNumber({
  value,
  decimals = 0,
  suffix = '',
}: {
  value: number | null;
  decimals?: number;
  suffix?: string;
}) {
  const visual = useRef<HTMLSpanElement>(null);
  const played = useRef(false);
  const animate = useIntroMotion();
  const final = formatoNarrativo(value, decimals) + (value === null ? '' : suffix);
  useEffect(() => {
    const element = visual.current;
    if (!element) return;
    element.textContent = final;
    if (!animate || played.current || value === null || !window.IntersectionObserver) return;
    let raf = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting) || played.current) return;
        played.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / 950);
          element.textContent =
            formatoNarrativo(value * (1 - (1 - progress) ** 3), decimals) + suffix;
          if (progress < 1 && !document.hidden) raf = requestAnimationFrame(tick);
          else element.textContent = final;
        };
        raf = requestAnimationFrame(tick);
        observer.disconnect();
      },
      { threshold: 0.35 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
      element.textContent = final;
    };
  }, [animate, value, decimals, suffix, final]);
  return (
    <span className="intro-number" data-value={value ?? 'no-consta'}>
      <span className="sr-only">{final}</span>
      <span ref={visual} aria-hidden="true">
        {final}
      </span>
    </span>
  );
}
```

## `components/marketing/browser-state.ts`

```ts
'use client';
import { useSyncExternalStore } from 'react';
const reducedQuery = '(prefers-reduced-motion: reduce)';
function subscribeReduced(cb: () => void) {
  const media = window.matchMedia(reducedQuery);
  media.addEventListener('change', cb);
  return () => media.removeEventListener('change', cb);
}
function snapshotReduced() {
  return window.matchMedia(reducedQuery).matches;
}
function reducedOnServer() {
  return true;
}
export function useReducedMotion() {
  return useSyncExternalStore(subscribeReduced, snapshotReduced, reducedOnServer);
}
function subscribeVisibility(cb: () => void) {
  document.addEventListener('visibilitychange', cb);
  return () => document.removeEventListener('visibilitychange', cb);
}
function snapshotVisible() {
  return document.visibilityState === 'visible';
}
function hiddenOnServer() {
  return false;
}
export function usePageVisible() {
  return useSyncExternalStore(subscribeVisibility, snapshotVisible, hiddenOnServer);
}
```

## `components/marketing/cinematic-experience.tsx`

```tsx
'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, Monitor, MoveRight } from 'lucide-react';
import { ESCENAS, modoInicial, type Calidad3D, type ModoGrafico } from '@/lib/domain/cinematica';
import { Wordmark } from '@/components/brand/wordmark';
import { IntroMotionContext } from './motion-context';
import { usePageVisible, useReducedMotion } from './browser-state';
import { ContextLink } from './context-link';
import { FallbackGallery } from './fallback-gallery';

// Esta es la única entrada del motor 3D; ningún import three/gsap se eleva al bundle inicial.
const MineCanvas = dynamic(() => import('@/components/three/mine-canvas'), {
  ssr: false,
  loading: () => null,
});

class SceneBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
interface NavigatorHints extends Navigator {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
}
function supportsWebGL2(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true });
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}
const qualityNames = {
  alta: 'Estándar',
  equilibrada: 'Equilibrada',
  baja: 'Bajo consumo',
  '2d': 'Lectura 2D',
} as const;

export function CinematicExperience({
  children,
  projectCount,
}: {
  children: ReactNode;
  projectCount: number;
}) {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const visible = usePageVisible();
  const [inView, setInView] = useState(true);
  const [manual2d, setManual2d] = useState(false);
  const [failed, setFailed] = useState(false);
  const [activeScene, setActiveScene] = useState(0);
  const [quality, setQuality] = useState<Calidad3D>('equilibrada');
  const [capability, setCapability] = useState<{ mode: ModoGrafico; reason: string }>({
    mode: '2d',
    reason: 'Preparando presentación accesible.',
  });

  useEffect(() => {
    // El primer HTML es 2D y completo. La detección no cambia ni duplica la narrativa.
    const handle = requestAnimationFrame(() => {
      const nav = navigator as NavigatorHints;
      const force2d = new URLSearchParams(window.location.search).get('intro') === '2d';
      const webgl = !reduced && !force2d && supportsWebGL2();
      const mode = modoInicial({
        webgl,
        reducido: reduced,
        memoria: nav.deviceMemory,
        nucleos: nav.hardwareConcurrency,
        movil: matchMedia('(max-width: 767px)').matches,
        ahorro: nav.connection?.saveData,
      });
      const reason = reduced
        ? 'Movimiento reducido: narrativa sin animaciones.'
        : force2d
          ? 'Versión 2D solicitada en la URL.'
          : !webgl
            ? 'WebGL2 no disponible: se conserva todo el contenido.'
            : mode === '2d'
              ? 'Versión ligera por capacidad del dispositivo o ahorro de datos.'
              : 'Recorrido 3D procedural. La calidad se adapta al rendimiento.';
      setCapability({ mode, reason });
      if (mode !== '2d') setQuality(mode);
    });
    return () => cancelAnimationFrame(handle);
  }, [reduced]);

  useEffect(() => {
    const element = root.current;
    if (!element || !window.IntersectionObserver) return;
    const observer = new IntersectionObserver(([entry]) =>
      setInView(Boolean(entry?.isIntersecting)),
    );
    observer.observe(element);
    const sceneObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries.find((e) => e.isIntersecting);
        if (!entry) return;
        const index = ESCENAS.findIndex((scene) => scene.id === entry.target.id);
        if (index >= 0) setActiveScene(index);
      },
      { rootMargin: '-35% 0px -35% 0px', threshold: 0 },
    );
    element
      .querySelectorAll('[data-intro-scene]')
      .forEach((section) => sceneObserver.observe(section));
    return () => {
      observer.disconnect();
      sceneObserver.disconnect();
    };
  }, []);

  const onFailure = useCallback(() => setFailed(true), []);
  const is3d = capability.mode !== '2d' && !reduced && !manual2d && !failed;
  const activity = visible && inView;
  const reason = failed
    ? 'El motor 3D se detuvo; toda la narrativa sigue disponible en 2D.'
    : manual2d
      ? 'Modo de lectura elegido: sin recorrido ni contadores animados.'
      : capability.reason;
  const goTo = (index: number) => {
    const scene = ESCENAS[index];
    if (!scene) return;
    const section = document.getElementById(scene.id);
    section?.focus({ preventScroll: true });
    section?.scrollIntoView({ behavior: reduced || manual2d ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <IntroMotionContext.Provider value={is3d && activity}>
      <div
        ref={root}
        className="intro-root"
        data-mode={is3d ? '3d' : '2d'}
        data-motion={is3d && activity ? 'on' : 'off'}
        data-ambient={!reduced && !manual2d && activity ? 'on' : 'off'}
      >
        <header className="intro-header">
          <Link href="#inicio" aria-label="INCIMMET — inicio de la presentación">
            <Wordmark />
          </Link>
          <div className="intro-header-actions">
            <span className="intro-demo">DEMO DOCUMENTAL</span>
            <button
              type="button"
              className="intro-toggle"
              aria-pressed={manual2d}
              onClick={() => {
                if (manual2d && capability.mode !== '2d') setQuality(capability.mode);
                setManual2d((current) => !current);
              }}
              disabled={reduced || capability.mode === '2d' || failed}
              title={reason}
            >
              <Monitor size={16} aria-hidden="true" />
              <span>{manual2d || !is3d ? 'Lectura 2D' : 'Desactivar movimiento'}</span>
            </button>
            <ContextLink href="/dashboard" className="intro-skip">
              Saltar intro <MoveRight size={17} aria-hidden="true" />
            </ContextLink>
          </div>
        </header>
        <div className="intro-backdrop" aria-hidden="true">
          <FallbackGallery />
          {is3d && (
            <SceneBoundary onError={onFailure}>
              <MineCanvas
                active={activity}
                initialQuality={capability.mode as Calidad3D}
                projectCount={projectCount}
                onFallback={onFailure}
                onQualityChange={setQuality}
              />
            </SceneBoundary>
          )}
          <div className="intro-vignette" />
        </div>
        <main id="contenido" className="intro-main">
          <div id="cinematic-story">{children}</div>
        </main>
        <nav className="intro-scene-nav" aria-label="Navegación por escenas">
          <button
            type="button"
            aria-label="Escena anterior"
            onClick={() => goTo(activeScene - 1)}
            disabled={activeScene === 0}
          >
            <ArrowLeft size={18} />
          </button>
          <label className="intro-scene-picker">
            <span className="sr-only">Ir a una escena</span>
            <select value={activeScene} onChange={(event) => goTo(Number(event.target.value))}>
              {ESCENAS.map((scene, i) => (
                <option value={i} key={scene.id}>
                  {String(i + 1).padStart(2, '0')} / {ESCENAS.length} · {scene.titulo}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            aria-label="Escena siguiente"
            onClick={() => goTo(activeScene + 1)}
            disabled={activeScene === ESCENAS.length - 1}
          >
            <ArrowRight size={18} />
          </button>
          <span className="intro-render-mode" title={reason}>
            {is3d ? `3D · ${qualityNames[quality]}` : '2D · accesible'}
          </span>
        </nav>
        <footer className="intro-footer">
          <p>{reason}</p>
          <p>
            Geometría ilustrativa, no representación de una unidad real.{' '}
            <Link href="/privacidad">Privacidad y alcance de la demo</Link>
          </p>
          <button type="button" onClick={() => goTo(0)}>
            Volver al inicio <ArrowDown size={14} className="intro-up" aria-hidden="true" />
          </button>
        </footer>
      </div>
    </IntroMotionContext.Provider>
  );
}
```

## `components/marketing/context-link.tsx`

```tsx
'use client';
import Link from 'next/link';
import type { ComponentProps } from 'react';
import { useFiltros, useSesion } from '@/components/providers';
import { filtrosAParametros } from '@/lib/domain/filtrosURL';
export function ContextLink({
  href,
  children,
  ...props
}: Omit<ComponentProps<typeof Link>, 'href'> & { href: string }) {
  const filtros = useFiltros((s) => s.filtros);
  const { cambiar } = useSesion();
  const consulta = filtrosAParametros(filtros).toString();
  return (
    <Link
      {...props}
      href={`${href}${consulta ? `?${consulta}` : ''}`}
      onClick={(event) => {
        // El CTA de campo activa explícitamente el rol de demostración apropiado.
        if (href === '/campo') cambiar({ rol: 'Supervisor de campo' });
        props.onClick?.(event);
      }}
    >
      {children}
    </Link>
  );
}
```

## `components/marketing/fallback-gallery.tsx`

```tsx
/** Ilustración vectorial original. Decorativa: la narrativa está fuera del SVG. */
export function FallbackGallery() {
  return (
    <svg
      className="intro-gallery-svg"
      viewBox="0 0 1440 1000"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="intro-vault-light" cx="70%" cy="46%" r="68%">
          <stop stopColor="#1D7DCC" stopOpacity=".34" />
          <stop offset="1" stopColor="#151F44" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="intro-ground" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#0070C0" stopOpacity=".14" />
          <stop offset="1" stopColor="#0F172A" />
        </linearGradient>
      </defs>
      <rect width="1440" height="1000" fill="#151F44" />
      <rect width="1440" height="1000" fill="url(#intro-vault-light)" />
      <path d="M0 1000 770 530 1100 530 1440 1000Z" fill="url(#intro-ground)" />
      {[0, 1, 2, 3, 4, 5, 6].map((n) => (
        <path
          key={n}
          d="M50 1080 V410 A650 590 0 0 1 1350 410 V1080"
          transform={`translate(${(960 - 700) * (1 - 0.72 ** n)} ${420 * (1 - 0.72 ** n)}) translate(${700 * (1 - 0.72 ** n)} 0) scale(${0.72 ** n})`}
          fill="none"
          stroke="#00B0F0"
          strokeOpacity={0.25 - n * 0.025}
          strokeWidth="2"
        />
      ))}
      <g fill="none" stroke="#1D7DCC" strokeOpacity=".28">
        <path d="M0 780 955 503M1440 860 955 503M80 0 955 503M1380 0 955 503M430 0 955 503M0 370 955 503" />
      </g>
      <g className="intro-svg-light" fill="#D6EBFF">
        <circle cx="1110" cy="229" r="5" />
        <circle cx="1048" cy="344" r="3.5" />
        <circle cx="1008" cy="408" r="2.5" />
      </g>
    </svg>
  );
}
```

## `components/marketing/motion-context.tsx`

```tsx
'use client';
import { createContext, useContext } from 'react';
export const IntroMotionContext = createContext(false);
export function useIntroMotion() {
  return useContext(IntroMotionContext);
}
```

## `components/marketing/story.tsx`

```tsx
import {
  ArrowDown,
  ArrowUpRight,
  ArrowRight,
  ClipboardList,
  Search,
  ListChecks,
  FileCheck2,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { ESCENAS } from '@/lib/domain/cinematica';
import { formatoFecha } from '@/lib/domain/fechas';
import { formatoNarrativo, type ResumenPresentacion } from '@/lib/domain/presentacion';
import { mensajes } from '@/messages/es-PE';
import { AnimatedNumber } from './animated-number';
import { ContextLink } from './context-link';

function Scene({
  index,
  children,
  className = '',
}: {
  index: number;
  children: ReactNode;
  className?: string;
}) {
  const scene = ESCENAS[index];
  if (!scene) return null;
  return (
    <section
      id={scene.id}
      data-intro-scene
      tabIndex={-1}
      aria-labelledby={`${scene.id}-title`}
      className={`intro-scene ${className}`}
    >
      <div className="intro-scene-content">
        <p className="intro-eyebrow">
          <span>
            {String(index + 1).padStart(2, '0')} / {ESCENAS.length}
          </span>
          {scene.titulo}
        </p>
        {children}
      </div>
    </section>
  );
}
const modules = [
  { icon: ClipboardList, title: 'Reporte', detail: 'Registrar el hecho y su contexto.' },
  { icon: Search, title: 'Investigación', detail: 'Documentar causas, sin inferir cierres.' },
  { icon: ListChecks, title: 'Acciones', detail: 'Vincular alcance, rol y compromiso.' },
  { icon: FileCheck2, title: 'Evidencia', detail: 'Distinguir archivos de declaraciones.' },
  { icon: ShieldCheck, title: 'Cierre', detail: 'Exigir validación y cobertura suficiente.' },
  { icon: BookOpen, title: 'Lección', detail: 'Conservar y compartir el aprendizaje.' },
] as const;

/** Una sola narrativa HTML para WebGL, fallback, impresión y lectores de pantalla. */
export function Story({ data }: { data: ResumenPresentacion }) {
  return (
    <>
      <Scene index={0} className="intro-hero">
        <p className="intro-label">GESTIÓN DE INCIDENTES · SSOMA</p>
        <h1 id="inicio-title">
          La seguridad
          <br />
          se construye
          <br />
          <em>con evidencia.</em>
        </h1>
        <p className="intro-lead">
          Un camino trazable entre lo que ocurre en la mina, las acciones que se ejecutan y las
          lecciones que permanecen.
        </p>
        <p className="intro-motto">{mensajes.lema}</p>
        <div className="intro-hero-links">
          <a href="#eventos" className="intro-explore">
            Explorar la gestión <ArrowDown size={18} aria-hidden="true" />
          </a>
          <ContextLink href="/dashboard" className="intro-text-link">
            Ir al dashboard <ArrowUpRight size={16} aria-hidden="true" />
          </ContextLink>
        </div>
        <p className="intro-fine">
          Base documental · Corte {formatoFecha(data.corte)} · America/Lima
        </p>
      </Scene>

      <Scene index={1}>
        <h2 id="eventos-title">
          Una base para
          <br />
          entender lo ocurrido.
        </h2>
        <div className="intro-stat-xl">
          <AnimatedNumber value={data.eventos} />
        </div>
        <p className="intro-stat-label">
          eventos analizados · {data.anioDesde ?? 'No consta'}–{data.anioHasta ?? 'No consta'}
        </p>
        <p className="intro-lead">
          Registros de incidentes, accidentes y desvíos, reunidos con su clasificación y
          procedencia.
        </p>
        <div className="intro-note">
          <span className="intro-note-marker" />
          Cobertura documental desigual. El número de registros no equivale a una tasa de
          accidentabilidad.
        </div>
        <p className="intro-fine">
          Fuente: data.json · eventos[] · {formatoFecha(data.desde)}–{formatoFecha(data.hasta)}
        </p>
      </Scene>

      <Scene index={2} className="intro-wide">
        <h2 id="proyectos-title">
          Proyectos distintos.
          <br />
          Una lectura común.
        </h2>
        <div className="intro-inline-stat">
          <AnimatedNumber value={data.proyectos} />
          <span>
            proyectos
            <br />
            en la base documental
          </span>
        </div>
        <div className="intro-project-grid">
          {data.proyectosDetalle.slice(0, 3).map((project) => (
            <article key={project.codigo}>
              <p className="intro-project-code">{project.codigo}</p>
              <h3>{project.nombre}</h3>
              <p>
                <AnimatedNumber value={project.eventos} />
                <span> registros</span>
              </p>
            </article>
          ))}
        </div>
        <details className="intro-details">
          <summary>Ver todos los proyectos documentados</summary>
          <ul className="intro-project-list">
            {data.proyectosDetalle.map((project) => (
              <li key={project.codigo}>
                <span>
                  {project.codigo} · {project.nombre}
                </span>
                <span>{project.eventos} registros</span>
              </li>
            ))}
          </ul>
        </details>
        <p className="intro-fine">
          Conteos del detalle, no comparación de desempeño ajustada por horas de exposición. Fuente:
          proyectos[] y eventos[].
        </p>
      </Scene>

      <Scene index={3} className="intro-wide">
        <p className="intro-label">
          {data.indicadores.ambitoNombre} · {data.indicadores.anio}
        </p>
        <h2 id="indicadores-title">
          Indicadores con
          <br />
          fuente, período y ámbito.
        </h2>
        <div className="intro-indicator-grid">
          <article>
            <h3>IF</h3>
            <p>
              <AnimatedNumber value={data.indicadores.if} decimals={2} />
            </p>
            <span>Índice de frecuencia</span>
          </article>
          <article>
            <h3>IS</h3>
            <p>
              <AnimatedNumber value={data.indicadores.is} decimals={2} />
            </p>
            <span>Índice de severidad</span>
          </article>
          <article>
            <h3>IA</h3>
            <p>
              <AnimatedNumber value={data.indicadores.ia} decimals={3} />
            </p>
            <span>Índice de accidentabilidad</span>
          </article>
        </div>
        <p className="intro-official">
          Oficiales según documento fuente. No recalculados sobre el detalle incompleto.
        </p>
        <details className="intro-details">
          <summary>Consultar valores originales y procedencia</summary>
          <dl className="intro-original-values">
            <dt>IF original</dt>
            <dd>{data.indicadores.if ?? 'No consta'}</dd>
            <dt>IS original</dt>
            <dd>{data.indicadores.is ?? 'No consta'}</dd>
            <dt>IA original</dt>
            <dd>{data.indicadores.ia ?? 'No consta'}</dd>
            <dt>Fuente</dt>
            <dd>
              {data.indicadores.fuente ??
                (data.indicadores.versiones > 1
                  ? 'Varias versiones; requiere selección explícita.'
                  : 'No consta')}
            </dd>
          </dl>
        </details>
        <p className="intro-fine">{mensajes.oficiales}</p>
      </Scene>

      <Scene index={4}>
        <h2 id="potencial-title">
          La señal importa.
          <br />
          Incluso sin una lesión.
        </h2>
        <div className="intro-stat-xl">
          <AnimatedNumber value={data.altoPotencial} />
        </div>
        <p className="intro-stat-label">eventos marcados como alto potencial</p>
        <p className="intro-lead">
          Una mirada específica sobre los eventos que exigen revisar controles críticos e investigar
          con trazabilidad.
        </p>
        <div className="intro-note">
          La cifra usa la bandera de alto potencial del detalle. No se infiere a partir del tipo de
          evento ni del nivel de potencial.
        </div>
        <p className="intro-fine">
          Fuente: eventos[].alto_potencial. Escena ilustrativa; no se recrean accidentes.
        </p>
      </Scene>

      <Scene index={5} className="intro-wide">
        <h2 id="evidencia-title">
          Declarar no es
          <br />
          <em>verificar.</em>
        </h2>
        <div className="intro-gap-grid">
          <article>
            <p className="intro-gap-number">
              <AnimatedNumber value={data.porcentajeCierre} decimals={1} suffix="%" />
            </p>
            <h3>
              con cierre verificado
              <br />
              según corte documental
            </h3>
            <p>
              {data.cerradas} de {data.acciones} acciones.
            </p>
          </article>
          <article>
            <p className="intro-gap-number">
              <AnimatedNumber value={data.porcentajeSinInformacion} decimals={1} suffix="%" />
            </p>
            <h3>
              en estado
              <br />
              «Sin información»
            </h3>
            <p>
              {data.sinInformacion} de {data.acciones} acciones.
            </p>
          </article>
        </div>
        <div className="intro-critical-note">
          <FileCheck2 size={20} aria-hidden="true" />
          <p>
            <strong>
              {data.cierresParciales} de los {data.cerradas} cierres importados tienen evidencia de
              alcance parcial.
            </strong>{' '}
            La plataforma conserva esta advertencia; no presenta el{' '}
            {formatoNarrativo(data.porcentajeCierre, 1)}% como cumplimiento integral auditado.
          </p>
        </div>
        <p className="intro-fine">
          Fuente: acciones[].estado_verificado y observaciones · Corte {formatoFecha(data.corte)}.
          Referencia documental no equivale a archivo validado.
        </p>
        <ContextLink href="/analisis" className="intro-text-link">
          Revisar calidad de datos <ArrowUpRight size={16} aria-hidden="true" />
        </ContextLink>
      </Scene>

      <Scene index={6} className="intro-wide">
        <h2 id="plataforma-title">
          Un ciclo conectado.
          <br />
          Ningún cierre sin evidencia.
        </h2>
        <p className="intro-lead">
          La plataforma convierte registros dispersos en una secuencia de decisiones verificables.
        </p>
        <ol className="intro-module-grid">
          {modules.map(({ icon: Icon, title, detail }, i) => (
            <li key={title}>
              <span className="intro-module-index">{String(i + 1).padStart(2, '0')}</span>
              <Icon size={23} aria-hidden="true" />
              <h3>{title}</h3>
              <p>{detail}</p>
            </li>
          ))}
        </ol>
        <p className="intro-note">
          Flujo propuesto, no mejora medida. La demo incluye la base funcional y esta presentación;
          los gráficos, formularios y PWA completos se desarrollan en los pasos siguientes.
        </p>
      </Scene>

      <Scene index={7} className="intro-finale">
        <p className="intro-label">DEL APRENDIZAJE A LA ACCIÓN</p>
        <h2 id="continuar-title">
          Hagamos el camino
          <br />
          <em>juntos.</em>
        </h2>
        <div className="intro-inline-stat">
          <AnimatedNumber value={data.lecciones} />
          <span>
            lecciones catalogadas
            <br />
            para consultar y aprender
          </span>
        </div>
        <div className="intro-cta-row">
          <ContextLink href="/dashboard" className="intro-cta">
            Explorar dashboard <ArrowRight size={21} aria-hidden="true" />
          </ContextLink>
          <ContextLink href="/campo" className="intro-cta-secondary">
            Reportar en campo <ArrowUpRight size={17} aria-hidden="true" />
          </ContextLink>
        </div>
        <p className="intro-fine">
          Campo abre la base del módulo. Instalación PWA y formulario completo: fase posterior.
          Catalogada no acredita publicación ni difusión formal.
        </p>
        <details className="intro-details intro-quality">
          <summary>Calidad, alcance y advertencias del conjunto</summary>
          <ul>
            {data.advertencias.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
            <li>
              Complemento a la advertencia 2025: {data.eventos2025} registros recuperados; cobertura
              no exhaustiva.
            </li>
            <li>{data.cierresParciales} cierres importados presentan cobertura parcial.</li>
            <li>
              Fuentes y evidencias son referencias documentales, no archivos originales adjuntos.
            </li>
          </ul>
        </details>
      </Scene>
    </>
  );
}
```

## `components/shell/app-shell.tsx`

```tsx
'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Moon, Sun, ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import type { RolDemo } from '@/lib/types';
import { useSesion, useDataSource, useFiltros } from '@/components/providers';
import { useBase } from '@/lib/hooks/use-base';
import { formatoFecha } from '@/lib/domain/fechas';
import { filtrosAParametros } from '@/lib/domain/filtrosURL';
import { inicioPorRol, navegacion, rutaPermitida } from '@/lib/config/navegacion';
import { mensajes } from '@/messages/es-PE';
import { Button } from '@/components/ui/button';
import { Wordmark } from '@/components/brand/wordmark';
export function AppShell({ children }: { children: ReactNode }) {
  const ruta = usePathname();
  return ruta === '/' ? <>{children}</> : <OperationalShell>{children}</OperationalShell>;
}
function OperationalShell({ children }: { children: ReactNode }) {
  const ruta = usePathname();
  const router = useRouter();
  const { actor, cambiar } = useSesion();
  const { resolvedTheme, setTheme } = useTheme();
  const base = useBase();
  const source = useDataSource();
  const filtros = useFiltros((s) => s.filtros);
  const consulta = filtrosAParametros(filtros).toString();
  const href = (path: string) => `${path}${consulta ? `?${consulta}` : ''}`;
  const elegirRol = (rol: RolDemo) => {
    cambiar({ rol });
    router.push(href(inicioPorRol(rol)));
  };
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-4 lg:px-8">
          <Link
            href="/"
            className="rounded-md bg-white px-3 py-2 text-brand-navy"
            aria-label="INCIMMET, presentación"
          >
            <Wordmark />
          </Link>
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid gap-1 text-xs font-medium">
              Rol de demostración
              <select
                aria-label="Rol de demostración"
                value={actor.rol}
                onChange={(e) => elegirRol(e.target.value as RolDemo)}
              >
                {(['Gerencia', 'SSOMA corporativo', 'Supervisor de campo'] as const).map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
            {actor.rol === 'Supervisor de campo' && (
              <label className="grid gap-1 text-xs font-medium">
                Contexto de proyecto
                <select
                  aria-label="Contexto de proyecto"
                  value={actor.proyectoCodigo ?? ''}
                  onChange={(e) =>
                    cambiar({ ...actor, proyectoCodigo: e.target.value || undefined })
                  }
                >
                  <option value="">Seleccione proyecto</option>
                  {base.data?.proyectos.map((p) => (
                    <option key={p.codigo} value={p.codigo}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <Button
              variant="outline"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              aria-label="Cambiar tema claro u oscuro"
            >
              <Moon size={18} className="dark:hidden" />
              <Sun size={18} className="hidden dark:block" />
              <span className="sr-only">Cambiar tema</span>
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="border-b border-border p-3 lg:min-h-[calc(100vh-112px)] lg:border-b-0 lg:border-r lg:p-5">
          <p className="mb-3 hidden text-xs font-semibold uppercase tracking-widest text-secondary lg:block">
            Gestión SSOMA
          </p>
          <nav aria-label="Navegación principal" className="flex gap-2 overflow-x-auto lg:flex-col">
            {navegacion
              .filter((n) => n.roles.includes(actor.rol))
              .map((n) => (
                <Link
                  href={href(n.href)}
                  key={n.href}
                  aria-current={ruta.startsWith(n.href) ? 'page' : undefined}
                  className={`flex min-h-12 shrink-0 items-center justify-between gap-2 rounded-md px-3 text-sm font-medium ${ruta.startsWith(n.href) ? 'bg-brand-deep text-white' : 'hover:bg-muted'}`}
                >
                  {n.titulo}
                  {ruta.startsWith(n.href) && <ArrowRight size={14} aria-hidden="true" />}
                </Link>
              ))}
          </nav>
          <p className="mt-6 hidden text-xs leading-relaxed text-secondary lg:block">
            El selector de rol cambia la interfaz. No autentica ni protege el JSON público.
          </p>
        </aside>
        <main id="contenido" className="min-w-0 px-4 py-6 lg:px-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2 text-xs font-medium">
            <span className="rounded border border-brand-accent px-2 py-1">{mensajes.demo}</span>
            <span>
              Corte documental:{' '}
              {base.data ? formatoFecha(base.data.meta.fecha_corte_estados) : 'Cargando…'} ·
              America/Lima
            </span>
          </div>
          {base.data && (
            <details
              className="mb-6 rounded-lg border border-amber-400 bg-amber-50 p-4 text-slate-900"
              open
            >
              <summary className="cursor-pointer text-sm font-semibold">
                Calidad y cobertura de datos
              </summary>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed">
                {base.data.meta.advertencias.map((aviso) => (
                  <li key={aviso}>{aviso}</li>
                ))}
                <li>2025 contiene 3 registros recuperados; no es una base exhaustiva.</li>
                <li>AC-145 y AC-146: cierres importados con cobertura de evidencia parcial.</li>
              </ul>
            </details>
          )}
          {source.getAvisoPersistencia() && (
            <p role="status" className="mb-4 rounded border border-border p-3 text-sm">
              {source.getAvisoPersistencia()}
            </p>
          )}
          {rutaPermitida(ruta, actor.rol) ? (
            children
          ) : (
            <section>
              <h1>Módulo no disponible para el rol seleccionado</h1>
              <p>Cambie el rol de demo o regrese al inicio de campo.</p>
              <Button asChild className="mt-4">
                <Link href={href(inicioPorRol(actor.rol))}>Ir al inicio</Link>
              </Button>
            </section>
          )}
          <footer className="mt-12 border-t border-border pt-4 text-xs text-secondary">
            {mensajes.etapa} · Sin backend ni transmisión de reportes.{' '}
            <Link href="/privacidad" className="underline">
              Privacidad
            </Link>
          </footer>
        </main>
      </div>
    </div>
  );
}
```

## `components/three/atmosphere.tsx`

```tsx
'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferAttribute, BufferGeometry, Color, DoubleSide, Group, ShaderMaterial } from 'three';
import { aleatorioSemilla, perfilCalidad, type Calidad3D } from '@/lib/domain/cinematica';

const vertex = `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const fragment = `
  varying vec2 vUv; uniform float uTime; uniform float uOpacity; uniform vec3 uColor;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise(vec2 p){vec2 i=floor(p), f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);}
  void main(){
    vec2 uv=vUv; float edge=smoothstep(0.0,0.18,uv.x)*(1.0-smoothstep(0.82,1.0,uv.x))*smoothstep(0.0,0.22,uv.y)*(1.0-smoothstep(0.75,1.0,uv.y));
    float density=noise(uv*4.0+vec2(uTime*0.018,0.0))*0.65+noise(uv*9.0-vec2(0.0,uTime*0.012))*0.35;
    gl_FragColor=vec4(uColor,density*edge*uOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

/** Niebla local por capas volumétricas: sin raymarching ni postprocesado de pantalla completa. */
function Mist({ layers, moving }: { layers: number; moving: boolean }) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uOpacity: { value: 0.09 },
          uColor: { value: new Color('#9cb6ce') },
        },
        vertexShader: vertex,
        fragmentShader: fragment,
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);
  useFrame((_state, delta) => {
    if (moving && material.uniforms.uTime) material.uniforms.uTime.value += Math.min(delta, 0.05);
  });
  return (
    <group name="niebla-volumetrica-por-capas">
      {Array.from({ length: layers }, (_, i) => (
        <mesh key={i} position={[0, 2.5, -8 - i * 10]} material={material}>
          <planeGeometry args={[7.4, 4.7]} />
        </mesh>
      ))}
    </group>
  );
}
function Dust({ count, moving }: { count: number; moving: boolean }) {
  const group = useRef<Group>(null);
  const time = useRef(0);
  const geometry = useMemo(() => {
    const random = aleatorioSemilla(1820),
      positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++)
      positions.set([(random() - 0.5) * 6.5, 0.5 + random() * 4, 7 - random() * 85], i * 3);
    const buffer = new BufferGeometry();
    buffer.setAttribute('position', new BufferAttribute(positions, 3));
    buffer.computeBoundingSphere();
    return buffer;
  }, [count]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame((_state, delta) => {
    if (!moving || !group.current) return;
    time.current += Math.min(delta, 0.05);
    group.current.position.y = Math.sin(time.current * 0.15) * 0.09;
    group.current.position.x = Math.sin(time.current * 0.1) * 0.06;
  });
  return (
    <group ref={group} name="polvo-en-suspension">
      <points geometry={geometry}>
        <pointsMaterial
          color="#bbccdb"
          size={0.035}
          transparent
          opacity={0.4}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </group>
  );
}
export function Atmosphere({ quality, moving }: { quality: Calidad3D; moving: boolean }) {
  const profile = perfilCalidad(quality);
  return (
    <>
      <fogExp2 attach="fog" args={['#101b2c', 0.033]} />
      {profile.capasNiebla > 0 && <Mist layers={profile.capasNiebla} moving={moving} />}
      {profile.polvo > 0 && <Dust count={profile.polvo} moving={moving} />}
    </>
  );
}
```

## `components/three/camera-rig.tsx`

```tsx
'use client';
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Vector3 } from 'three';
import { poseCamara, progresoNarrativo } from '@/lib/domain/cinematica';

/** Scroll de documento, sin contenedor capturador ni scroll-jacking. */
export function CameraRig({ active, onMotion }: { active: boolean; onMotion: () => void }) {
  const progress = useRef(0);
  const { camera, invalidate } = useThree();
  const look = useRef(new Vector3(0, 2.05, -8));
  const position = useRef(new Vector3());
  const target = useRef(new Vector3());
  useEffect(() => {
    if (!active) return;
    const story = document.getElementById('cinematic-story');
    if (!story) return;
    gsap.registerPlugin(ScrollTrigger);
    let starts: number[] = [];
    const measure = () => {
      starts = [...story.querySelectorAll<HTMLElement>('[data-intro-scene]')].map(
        (element) => element.getBoundingClientRect().top + window.scrollY,
      );
    };
    const update = () => {
      if (document.hidden) return;
      progress.current = progresoNarrativo(window.scrollY, starts);
      invalidate();
      onMotion();
    };
    measure();
    const trigger = ScrollTrigger.create({
      trigger: story,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: update,
      onRefresh: () => {
        measure();
        update();
      },
      invalidateOnRefresh: true,
    });
    const resize =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => trigger.refresh());
    resize?.observe(story);
    update();
    return () => {
      resize?.disconnect();
      trigger.kill();
    };
  }, [active, invalidate, onMotion]);
  useFrame((_state, delta) => {
    if (!active) return;
    const pose = poseCamara(progress.current);
    position.current.set(...pose.posicion);
    target.current.set(...pose.mirada);
    const alpha = 1 - Math.exp(-8 * Math.min(delta, 0.05));
    camera.position.lerp(position.current, alpha);
    look.current.lerp(target.current, alpha);
    camera.lookAt(look.current);
    if (
      camera.position.distanceToSquared(position.current) > 0.00001 ||
      look.current.distanceToSquared(target.current) > 0.00001
    )
      invalidate();
  });
  return null;
}
```

## `components/three/geometry.ts`

```ts
import { BufferAttribute, BufferGeometry, DataTexture, RGBAFormat, RepeatWrapping } from 'three';
import { GALERIA, aleatorioSemilla, puntoBoveda, type Vec3 } from '@/lib/domain/cinematica';

/** Bóveda extruida con paredes verticales, relieve determinista y normales calculadas. */
export function crearBoveda(segmentos: number) {
  const geometry = new BufferGeometry();
  const cross: Vec3[] = [[GALERIA.radio, 0, 0]];
  for (let i = 0; i <= segmentos; i++) cross.push(puntoBoveda((i / segmentos) * Math.PI, 0));
  cross.push([-GALERIA.radio, 0, 0]);
  const positions: number[] = [],
    uv: number[] = [],
    indices: number[] = [];
  const rings = 48;
  for (let j = 0; j <= rings; j++) {
    const z = GALERIA.inicioZ + ((GALERIA.finZ - GALERIA.inicioZ) * j) / rings;
    cross.forEach(([x, y], i) => {
      const grain = Math.sin(i * 17.4 + j * 7.7) * Math.cos(i * 4.2 - j * 2.6) * 0.065;
      positions.push(x + Math.sign(x) * grain, y > 0 ? y + grain : y, z);
      uv.push(i / (cross.length - 1), j / rings);
    });
  }
  for (let j = 0; j < rings; j++)
    for (let i = 0; i < cross.length - 1; i++) {
      const a = j * cross.length + i,
        b = a + cross.length;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}
export function crearRugosidad() {
  const size = 64,
    bytes = new Uint8Array(size * size * 4),
    random = aleatorioSemilla(1407);
  for (let i = 0; i < size * size; i++) {
    const value = Math.floor(85 + random() * 150);
    bytes.set([value, value, value, 255], i * 4);
  }
  const texture = new DataTexture(bytes, size, size, RGBAFormat);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(9, 42);
  texture.needsUpdate = true;
  return texture;
}
```

## `components/three/instanced-support.tsx`

```tsx
'use client';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { InstancedMesh, Object3D, Vector3 } from 'three';
import { mallaBoveda, pernosBoveda, type Calidad3D, type Tramo } from '@/lib/domain/cinematica';

/** Cada conjunto comparte geometría/material; no hay un draw call por alambre o perno. */
export function SegmentInstances({
  segments,
  radius,
  color,
  name,
}: {
  segments: readonly Tramo[];
  radius: number;
  color: string;
  name: string;
}) {
  const mesh = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const target = mesh.current;
    if (!target) return;
    const temp = new Object3D(),
      from = new Vector3(),
      to = new Vector3(),
      direction = new Vector3(),
      up = new Vector3(0, 1, 0);
    segments.forEach((segment, i) => {
      from.set(...segment.desde);
      to.set(...segment.hasta);
      direction.subVectors(to, from);
      temp.position.copy(from).add(to).multiplyScalar(0.5);
      temp.scale.set(1, direction.length(), 1);
      temp.quaternion.setFromUnitVectors(up, direction.normalize());
      temp.updateMatrix();
      target.setMatrixAt(i, temp.matrix);
    });
    target.instanceMatrix.needsUpdate = true;
    target.computeBoundingSphere();
  }, [segments]);
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, segments.length]} name={name}>
      <cylinderGeometry args={[radius, radius, 1, 5]} />
      <meshStandardMaterial color={color} roughness={0.65} metalness={0.55} />
    </instancedMesh>
  );
}
function BoltPlates({ bolts }: { bolts: readonly Tramo[] }) {
  const mesh = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const target = mesh.current;
    if (!target) return;
    const temp = new Object3D(),
      normal = new Vector3(),
      up = new Vector3(0, 1, 0);
    bolts.forEach((bolt, i) => {
      temp.position.set(...bolt.desde);
      normal
        .set(
          bolt.hasta[0] - bolt.desde[0],
          bolt.hasta[1] - bolt.desde[1],
          bolt.hasta[2] - bolt.desde[2],
        )
        .normalize();
      temp.quaternion.setFromUnitVectors(up, normal);
      temp.updateMatrix();
      target.setMatrixAt(i, temp.matrix);
    });
    target.instanceMatrix.needsUpdate = true;
    target.computeBoundingSphere();
  }, [bolts]);
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, bolts.length]} name="placas-de-pernos">
      <boxGeometry args={[0.19, 0.025, 0.19]} />
      <meshStandardMaterial color="#8895a1" roughness={0.55} metalness={0.7} />
    </instancedMesh>
  );
}
export function InstancedSupport({ quality }: { quality: Calidad3D }) {
  const mesh = useMemo(() => mallaBoveda(quality), [quality]);
  const bolts = useMemo(pernosBoveda, []);
  return (
    <group name="sostenimiento-procedural">
      <SegmentInstances
        segments={mesh}
        radius={0.009}
        color="#78878e"
        name="malla-electrosoldada-instanciada"
      />
      <SegmentInstances
        segments={bolts}
        radius={0.027}
        color="#a1aab2"
        name="pernos-instanciados"
      />
      <BoltPlates bolts={bolts} />
    </group>
  );
}
```

## `components/three/mine-canvas.tsx`

```tsx
'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { ACESFilmicToneMapping, Group, Object3D, SRGBColorSpace } from 'three';
import { degradarCalidad, perfilCalidad, type Calidad3D } from '@/lib/domain/cinematica';
import { TunnelGeometry } from './tunnel-geometry';
import { CameraRig } from './camera-rig';
import { Atmosphere } from './atmosphere';

interface Props {
  active: boolean;
  initialQuality: Calidad3D;
  projectCount: number;
  onFallback: () => void;
  onQualityChange: (quality: Calidad3D) => void;
}
function ContextGuard({ onFallback }: { onFallback: () => void }) {
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => {
      event.preventDefault();
      onFallback();
    };
    canvas.addEventListener('webglcontextlost', lost);
    canvas.setAttribute('data-renderer', 'incimmet-three');
    return () => canvas.removeEventListener('webglcontextlost', lost);
  }, [gl, onFallback]);
  return null;
}
function Lights() {
  const group = useRef<Group>(null);
  const target = useMemo(() => new Object3D(), []);
  useFrame(({ camera }) => {
    group.current?.position.copy(camera.position);
  });
  return (
    <>
      <hemisphereLight args={['#aebfd1', '#222a35', 0.8]} />
      <ambientLight intensity={0.15} />
      <group ref={group} name="iluminacion-de-inspeccion">
        <primitive object={target} position={[0.3, 0.4, -13]} />
        <spotLight
          position={[0.15, 0.35, -0.25]}
          target={target}
          color="#d3e5f5"
          intensity={75}
          distance={31}
          angle={0.68}
          penumbra={0.68}
          decay={2}
          castShadow={false}
        />
        <pointLight
          position={[2.45, 2.3, -8]}
          color="#c8dceb"
          intensity={45}
          distance={20}
          decay={2}
        />
        <pointLight
          position={[-2.7, 0.7, -18]}
          color="#7198b6"
          intensity={18}
          distance={18}
          decay={2}
        />
      </group>
    </>
  );
}
/** Visible + interacción: always. Reposo: demand. Pestaña oculta/fuera de vista: never. */
export default function MineCanvas({
  active,
  initialQuality,
  projectCount,
  onFallback,
  onQualityChange,
}: Props) {
  const [quality, setQuality] = useState<Calidad3D>(initialQuality);
  const [moving, setMoving] = useState(false);
  const [warming, setWarming] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onMotion = useCallback(() => {
    setMoving(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMoving(false), 1400);
  }, []);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    if (!active) return;
    const start = setTimeout(() => setWarming(true), 0);
    const stop = setTimeout(() => setWarming(false), 4000);
    return () => {
      clearTimeout(start);
      clearTimeout(stop);
    };
  }, [active]);
  const decline = useCallback(() => {
    const next = degradarCalidad(quality);
    if (next === '2d') {
      onFallback();
      return;
    }
    setQuality(next);
    onQualityChange(next);
  }, [quality, onFallback, onQualityChange]);
  const busy = active && (warming || moving);
  return (
    <div
      className="intro-canvas"
      data-testid="mine-canvas-root"
      data-quality={quality}
      data-render-loop={!active ? 'never' : busy ? 'always' : 'demand'}
    >
      <Canvas
        dpr={[1, Math.min(1.5, perfilCalidad(quality).dprMax)]}
        frameloop={!active ? 'never' : busy ? 'always' : 'demand'}
        shadows={false}
        camera={{ position: [0, 1.65, 4], fov: 62, near: 0.1, far: 110 }}
        gl={{
          antialias: initialQuality === 'alta',
          alpha: false,
          powerPreference: 'low-power',
          preserveDrawingBuffer: false,
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.3;
          gl.outputColorSpace = SRGBColorSpace;
        }}
      >
        <color attach="background" args={['#101b2c']} />
        <ContextGuard onFallback={onFallback} />
        <CameraRig active={active} onMotion={onMotion} />
        <Lights />
        <TunnelGeometry quality={quality} projectCount={projectCount} />
        <Atmosphere quality={quality} moving={busy} />
        {/* No medir FPS durante demand: el reposo no es una GPU lenta. */}
        {busy && (
          <PerformanceMonitor
            key={quality}
            ms={200}
            iterations={5}
            threshold={0.6}
            factor={1}
            bounds={() => [28, 58]}
            onDecline={decline}
          />
        )}
      </Canvas>
    </div>
  );
}
```

## `components/three/tunnel-geometry.tsx`

```tsx
'use client';
import { useEffect, useMemo } from 'react';
import { DoubleSide } from 'three';
import { GALERIA, perfilCalidad, type Calidad3D, type Tramo } from '@/lib/domain/cinematica';
import { crearBoveda, crearRugosidad } from './geometry';
import { InstancedSupport, SegmentInstances } from './instanced-support';

export function TunnelGeometry({
  quality,
  projectCount,
}: {
  quality: Calidad3D;
  projectCount: number;
}) {
  const segments = perfilCalidad(quality).segmentosBoveda;
  const vault = useMemo(() => crearBoveda(segments), [segments]);
  const rock = useMemo(crearRugosidad, []);
  useEffect(() => () => vault.dispose(), [vault]);
  useEffect(() => () => rock.dispose(), [rock]);
  const cables = useMemo<Tramo[]>(
    () =>
      [2.1, 2.3, 2.5].flatMap((y) =>
        Array.from({ length: 30 }, (_, i) => ({
          desde: [3.62, y + Math.sin(i * 0.8) * 0.04, 8 - i * 3] as [number, number, number],
          hasta: [3.62, y + Math.sin((i + 1) * 0.8) * 0.04, 5 - i * 3] as [number, number, number],
        })),
      ),
    [],
  );
  const hangers = useMemo<Tramo[]>(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        desde: [3.75, 2.05, 7 - i * 3],
        hasta: [3.43, 2.05, 7 - i * 3],
      })),
    [],
  );
  const fixtures = useMemo(() => Array.from({ length: 15 }, (_, i) => -i * 6), []);
  return (
    <group name="galeria-minera">
      <mesh geometry={vault} name="boveda-roca">
        <meshStandardMaterial
          color="#657079"
          side={DoubleSide}
          roughness={0.94}
          metalness={0.04}
          bumpMap={rock}
          bumpScale={0.14}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.025, -37]} name="piso">
        <planeGeometry args={[GALERIA.radio * 2, 90, 1, 1]} />
        <meshStandardMaterial
          color="#414b54"
          roughness={0.92}
          metalness={0.06}
          bumpMap={rock}
          bumpScale={0.08}
        />
      </mesh>
      <InstancedSupport quality={quality} />
      {[0.58, 0.99].map((height) => (
        <mesh
          key={height}
          rotation={[Math.PI / 2, 0, 0]}
          position={[-3.48, height, -37]}
          name="tuberia-HDPE"
        >
          <cylinderGeometry args={[0.14, 0.14, 90, 12]} />
          <meshStandardMaterial color="#202b36" roughness={0.58} metalness={0.03} />
        </mesh>
      ))}
      <SegmentInstances segments={cables} radius={0.025} color="#252a30" name="cables-protegidos" />
      <SegmentInstances segments={hangers} radius={0.022} color="#84929e" name="soportes-cable" />
      {fixtures.map((z) => (
        <group key={z} position={[2.7, 4.04, z]} rotation={[0, 0, -0.38]} name="lampara-minera">
          <mesh>
            <boxGeometry args={[0.75, 0.13, 0.26]} />
            <meshStandardMaterial color="#354351" metalness={0.65} roughness={0.48} />
          </mesh>
          <mesh position={[0, -0.075, 0]}>
            <boxGeometry args={[0.58, 0.025, 0.18]} />
            <meshStandardMaterial
              color="#dcefff"
              emissive="#c6e2f4"
              emissiveIntensity={3}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
      {/* Los paneles representan proyectos, no un mapa geográfico ni tasas comparables. */}
      {Array.from({ length: projectCount }, (_, i) => (
        <group
          key={i}
          position={[3.52, 1.9, -16 - i * 1.3]}
          rotation={[0, -Math.PI / 2, 0]}
          name="panel-proyecto"
        >
          <mesh>
            <boxGeometry args={[0.85, 0.78, 0.06]} />
            <meshStandardMaterial color="#151F44" roughness={0.62} metalness={0.12} />
          </mesh>
          <mesh position={[0, 0.26, 0.04]}>
            <boxGeometry args={[0.65, 0.035, 0.012]} />
            <meshStandardMaterial color="#1D7DCC" emissive="#1D7DCC" emissiveIntensity={0.8} />
          </mesh>
        </group>
      ))}
      <group position={[-2.55, 0.78, -38]} name="casco-lampara-sin-persona">
        <mesh>
          <sphereGeometry args={[0.2, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#d3c3a3" roughness={0.7} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.24, 0.24, 0.025, 22]} />
          <meshStandardMaterial color="#d3c3a3" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.09, -0.19]}>
          <sphereGeometry args={[0.055, 10, 8]} />
          <meshStandardMaterial color="#e1f1ff" emissive="#c8e6ff" emissiveIntensity={2} />
        </mesh>
        <mesh position={[0, -0.42, 0.03]}>
          <boxGeometry args={[0.6, 0.72, 0.55]} />
          <meshStandardMaterial color="#354250" roughness={0.8} />
        </mesh>
      </group>
      {/* Estaciones abstractas del ciclo, sin cifras o métricas simuladas. */}
      <mesh position={[-3.45, 1.3, -52]} rotation={[0, Math.PI / 2, 0]} name="panel-de-seguimiento">
        <boxGeometry args={[2.8, 1.4, 0.1]} />
        <meshStandardMaterial
          color="#002060"
          emissive="#1D7DCC"
          emissiveIntensity={0.17}
          roughness={0.6}
        />
      </mesh>
      <mesh position={[-3.3, 1.8, -58]} rotation={[Math.PI / 2, 0, 0]} name="conexion-del-ciclo">
        <cylinderGeometry args={[0.025, 0.025, 12, 8]} />
        <meshStandardMaterial color="#00B0F0" emissive="#00B0F0" emissiveIntensity={1} />
      </mesh>
      <group position={[0, 0, -75]} name="estacion-final">
        <mesh position={[-2.4, 0.48, 0]}>
          <boxGeometry args={[0.65, 0.17, 3.8]} />
          <meshStandardMaterial color="#52606b" roughness={0.8} />
        </mesh>
        <mesh position={[2.5, 1.1, 0]}>
          <boxGeometry args={[0.7, 2.2, 1.7]} />
          <meshStandardMaterial color="#151F44" roughness={0.7} />
        </mesh>
        <mesh position={[2.13, 1.8, 0]}>
          <boxGeometry args={[0.03, 0.05, 1.4]} />
          <meshStandardMaterial color="#cceaff" emissive="#1D7DCC" emissiveIntensity={2} />
        </mesh>
      </group>
    </group>
  );
}
```

## `lib/data/presentacion.server.ts`

```ts
import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { normalizarDocumento } from './normalizar';
import { validarDocumento } from './validarDocumento';
import { resumenPresentacion } from '../domain/presentacion';

/** Adaptador de lectura documental para SSG. Solo envía el resumen al cliente, no el JSON completo. */
export async function cargarPresentacion() {
  const texto = await readFile(path.join(process.cwd(), 'public/data/data.json'), 'utf8');
  return resumenPresentacion(normalizarDocumento(validarDocumento(JSON.parse(texto))));
}
```

## `lib/domain/cinematica.ts`

```ts
/** Geometría y movimiento ilustrativos; no son dimensiones de una mina real. */
export type Calidad3D = 'alta' | 'equilibrada' | 'baja';
export type ModoGrafico = Calidad3D | '2d';
export type Vec3 = [number, number, number];
export interface Tramo {
  desde: Vec3;
  hasta: Vec3;
}
export const GALERIA = { radio: 3.8, arranque: 1.65, inicioZ: 8, finZ: -82 } as const;
export const ESCENAS = [
  { id: 'inicio', titulo: 'El camino' },
  { id: 'eventos', titulo: 'Base documental' },
  { id: 'proyectos', titulo: 'Proyectos' },
  { id: 'indicadores', titulo: 'Indicadores oficiales' },
  { id: 'potencial', titulo: 'Alto potencial' },
  { id: 'evidencia', titulo: 'La brecha de evidencia' },
  { id: 'plataforma', titulo: 'La plataforma' },
  { id: 'continuar', titulo: 'Del aprendizaje a la acción' },
] as const;
export function acotar(n: number, min = 0, max = 1): number {
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
}
export function degradarCalidad(actual: ModoGrafico): ModoGrafico {
  return actual === 'alta' ? 'equilibrada' : actual === 'equilibrada' ? 'baja' : '2d';
}
export function perfilCalidad(calidad: Calidad3D) {
  return calidad === 'alta'
    ? { dprMax: 1.5, segmentosBoveda: 28, pasoMalla: 0.6, polvo: 180, capasNiebla: 7 }
    : calidad === 'equilibrada'
      ? { dprMax: 1.25, segmentosBoveda: 20, pasoMalla: 0.85, polvo: 70, capasNiebla: 3 }
      : { dprMax: 1, segmentosBoveda: 14, pasoMalla: 1.2, polvo: 0, capasNiebla: 0 };
}
export function modoInicial(s: {
  webgl: boolean;
  reducido: boolean;
  memoria?: number;
  nucleos?: number;
  movil?: boolean;
  ahorro?: boolean;
}): ModoGrafico {
  if (
    !s.webgl ||
    s.reducido ||
    s.ahorro ||
    (s.memoria !== undefined && s.memoria <= 2) ||
    (s.nucleos !== undefined && s.nucleos <= 2)
  )
    return '2d';
  if ((s.memoria !== undefined && s.memoria <= 4) || (s.nucleos !== undefined && s.nucleos <= 4))
    return 'baja';
  return s.movil ? 'equilibrada' : 'alta';
}
/** Normaliza por posiciones reales de las secciones, incluso con zoom y texto largo. */
export function progresoNarrativo(scrollY: number, comienzos: readonly number[]): number {
  if (comienzos.length < 2) return 0;
  const first = comienzos[0] ?? 0;
  if (scrollY <= first) return 0;
  for (let i = 1; i < comienzos.length; i++) {
    const inicio = comienzos[i - 1] ?? first;
    const fin = comienzos[i] ?? inicio;
    if (scrollY < fin)
      return (
        (i - 1 + acotar((scrollY - inicio) / Math.max(1, fin - inicio))) / (comienzos.length - 1)
      );
  }
  return 1;
}
export function poseCamara(progreso: number): { posicion: Vec3; mirada: Vec3 } {
  const t = acotar(progreso) * (ESCENAS.length - 1);
  const tramo = Math.floor(t),
    local = t - tramo;
  // Pausa breve en torno a cada panel; interpolación de velocidad continua.
  const fase = acotar((local - 0.16) / 0.68);
  const suave = fase * fase * (3 - 2 * fase);
  const avance = (tramo + suave) / (ESCENAS.length - 1);
  const z = 4 - avance * 73;
  const x = Math.sin(avance * Math.PI * 2) * 0.45;
  return {
    posicion: [x, 1.65 + Math.sin(avance * Math.PI) * 0.16, z],
    mirada: [x * 0.35, 2.05, z - 12],
  };
}
export function puntoBoveda(angulo: number, z: number, radio: number = GALERIA.radio): Vec3 {
  return [Math.cos(angulo) * radio, GALERIA.arranque + Math.sin(angulo) * radio, z];
}
export function mallaBoveda(calidad: Calidad3D): Tramo[] {
  const p = perfilCalidad(calidad),
    segmentos = p.segmentosBoveda;
  const tramos: Tramo[] = [];
  for (let z: number = GALERIA.inicioZ; z >= GALERIA.finZ; z -= p.pasoMalla) {
    for (let i = 0; i < segmentos; i++) {
      tramos.push({
        desde: puntoBoveda((i / segmentos) * Math.PI, z, GALERIA.radio - 0.07),
        hasta: puntoBoveda(((i + 1) / segmentos) * Math.PI, z, GALERIA.radio - 0.07),
      });
    }
  }
  for (let i = 0; i <= segmentos; i++) {
    const angulo = (i / segmentos) * Math.PI;
    tramos.push({
      desde: puntoBoveda(angulo, GALERIA.inicioZ, GALERIA.radio - 0.07),
      hasta: puntoBoveda(angulo, GALERIA.finZ, GALERIA.radio - 0.07),
    });
  }
  return tramos;
}
export function pernosBoveda(): Tramo[] {
  const tramos: Tramo[] = [];
  for (let z: number = GALERIA.inicioZ; z >= GALERIA.finZ; z -= 2.5) {
    for (let i = 0; i < 7; i++) {
      const angulo = 0.18 + (i / 6) * (Math.PI - 0.36);
      tramos.push({
        desde: puntoBoveda(angulo, z, GALERIA.radio - 0.25),
        hasta: puntoBoveda(angulo, z, GALERIA.radio + 0.12),
      });
    }
  }
  return tramos;
}
/** PRNG local reproducible: ni aleatoriedad por render ni recursos externos. */
export function aleatorioSemilla(semilla: number) {
  let estado = semilla >>> 0;
  return () => {
    estado = (Math.imul(1664525, estado) + 1013904223) >>> 0;
    return estado / 4294967296;
  };
}
```

## `lib/domain/presentacion.ts`

```ts
import type { BaseNormalizada } from '../types';
import { resumenCumplimiento } from './agregaciones';
import { indicadoresOficiales } from './indicadores';
import { unicosPorId } from './filtros';

/** Selectores editoriales, no valores de indicadores ni conteos fijos. */
export const INDICADOR_NARRATIVO = { anio: 2024, ambito: 'PERU' } as const;

export function resumenPresentacion(
  base: BaseNormalizada,
  seleccion: { anio: number; ambito: string } = INDICADOR_NARRATIVO,
) {
  // La presentación siempre describe el corte importado, no nuevos cierres locales.
  const eventos = unicosPorId(base.eventos.filter((e) => e.origen === 'documental'));
  const acciones = base.acciones.map((a) => ({ ...a, estadoVerificado: a.estadoImportado }));
  const cumplimiento = resumenCumplimiento(acciones);
  const oficiales = indicadoresOficiales(base.indicadores, seleccion.anio, seleccion.ambito);
  const fechas = eventos.flatMap((e) => (e.fecha ? [e.fecha] : [])).sort();
  const anios = eventos.map((e) => e.anio).filter(Number.isFinite);
  const proyectos = [...new Map(base.proyectos.map((p) => [p.codigo, p])).values()]
    .map((p) => ({
      codigo: p.codigo,
      nombre: p.nombre,
      eventos: eventos.filter((e) => e.proyectoCodigo === p.codigo).length,
    }))
    .sort((a, b) => b.eventos - a.eventos || a.codigo.localeCompare(b.codigo));
  // Una versión ambigua nunca se elige en silencio.
  const oficial = oficiales.length === 1 ? oficiales[0] : undefined;
  const sinInformacion = cumplimiento.estados['Sin información'];
  return {
    eventos: eventos.length,
    proyectos: proyectos.length,
    proyectosDetalle: proyectos,
    acciones: cumplimiento.total,
    lecciones: unicosPorId(base.lecciones).length,
    altoPotencial: eventos.filter((e) => e.altoPotencial === true).length,
    desde: fechas[0] ?? null,
    hasta: fechas.at(-1) ?? null,
    anioDesde: anios.length ? Math.min(...anios) : null,
    anioHasta: anios.length ? Math.max(...anios) : null,
    corte: base.meta.fecha_corte_estados,
    cerradas: cumplimiento.cerradas,
    porcentajeCierre: cumplimiento.porcentajeCierre,
    cierresParciales: cumplimiento.cierresImportadosParciales,
    sinInformacion,
    porcentajeSinInformacion: cumplimiento.total
      ? (sinInformacion / cumplimiento.total) * 100
      : null,
    advertencias: [...base.meta.advertencias],
    eventos2025: eventos.filter((e) => e.anio === 2025).length,
    indicadores: {
      anio: seleccion.anio,
      ambito: seleccion.ambito,
      ambitoNombre: oficial?.ambito_nombre ?? seleccion.ambito,
      if: oficial?.if ?? null,
      is: oficial?.is ?? null,
      ia: oficial?.ia ?? null,
      fuente: oficial?.fuente ?? null,
      versiones: oficiales.length,
    },
  };
}
export type ResumenPresentacion = ReturnType<typeof resumenPresentacion>;

/** Punto decimal requerido por el brief, sin ceros inventados para nulos. */
export function formatoNarrativo(valor: number | null | undefined, decimales = 0): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return 'No consta';
  const precision = Math.max(0, Math.min(6, Math.trunc(decimales)));
  return valor.toFixed(precision);
}
```

## `messages/es-PE.ts`

```ts
export const mensajes = {
  marca: 'INCIMMET',
  lema: 'Hagamos el camino juntos',
  demo: 'DEMO · datos locales',
  cargando: 'Cargando base documental…',
  error: 'No se pudo cargar la base documental.',
  sinDatos: 'Sin registros para esta selección.',
  noConsta: 'No consta',
  oficiales:
    'Indicadores oficiales según documento fuente; los conteos del detalle pueden no coincidir con los agregados.',
  offline: 'Guardado local no significa envío ni recepción por SSOMA.',
  privacidad: 'No incluya nombres, DNI, diagnósticos, datos psicológicos ni documentos clínicos.',
  etapa: 'Paso 3 de 5 · Presentación cinemática y base funcional',
  contexto: 'Seleccione el proyecto para consultar el contexto de campo.',
} as const;
```

## `package.json`

```json
{
  "name": "incimmet-ssoma-platform",
  "version": "0.3.0",
  "private": true,
  "engines": {
    "node": ">=20.19.0 <25",
    "npm": ">=10"
  },
  "scripts": {
    "dev": "next dev",
    "build": "npm run lint && npm run typecheck && next build --webpack",
    "start": "next start",
    "lint": "eslint . --max-warnings=0",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:domain:portable": "tsc -p tsconfig.domain.json && node scripts/domain-smoke.cjs",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "verify:data": "node scripts/verify-data.mjs",
    "verify:syntax": "node scripts/syntax-check.cjs",
    "test:cinematica:portable": "tsc -p tsconfig.domain.json && node scripts/cinematica-smoke.cjs",
    "test:e2e": "playwright test",
    "verify:step3": "npm run verify:data && npm test && npm run build && npm run test:e2e",
    "verify:deps": "node scripts/verify-dependencies.mjs"
  },
  "dependencies": {
    "next": "16.4.0",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "@radix-ui/react-slot": "1.2.3",
    "@radix-ui/react-label": "2.1.7",
    "@tanstack/react-query": "5.90.5",
    "class-variance-authority": "0.7.1",
    "clsx": "2.1.1",
    "idb": "8.0.3",
    "lucide-react": "0.468.0",
    "next-themes": "0.4.6",
    "tailwind-merge": "2.6.0",
    "tailwindcss-animate": "1.0.7",
    "zustand": "5.0.8",
    "three": "0.175.0",
    "@react-three/fiber": "9.4.0",
    "@react-three/drei": "10.0.7",
    "gsap": "3.13.0",
    "server-only": "0.0.1"
  },
  "devDependencies": {
    "@types/node": "20.19.9",
    "@types/react": "19.2.2",
    "@types/react-dom": "19.2.2",
    "@vitest/coverage-v8": "3.2.4",
    "autoprefixer": "10.4.21",
    "eslint": "9.39.1",
    "eslint-config-next": "16.4.0",
    "eslint-config-prettier": "10.1.8",
    "fake-indexeddb": "6.2.4",
    "postcss": "8.5.6",
    "prettier": "3.6.2",
    "tailwindcss": "3.4.17",
    "typescript": "5.9.3",
    "vite": "6.4.1",
    "vitest": "3.2.4",
    "@types/three": "0.175.0",
    "@playwright/test": "1.56.1",
    "@axe-core/playwright": "4.10.2"
  }
}
```

## `playwright.config.ts`

```ts
import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  timeout: 40_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run start -- --port 3100',
    url: 'http://127.0.0.1:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

## `scripts/cinematica-smoke.cjs`

```js
/* Verificación real del dominio compilado; no simula una ejecución de React/WebGL. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const load = (p) => require(path.join(root, '.verification/domain/lib', p));
const { normalizarDocumento } = load('data/normalizar.js');
const { validarDocumento } = load('data/validarDocumento.js');
const { resumenPresentacion, formatoNarrativo } = load('domain/presentacion.js');
const c = load('domain/cinematica.js');
const raw = JSON.parse(fs.readFileSync(path.join(root, 'public/data/data.json'), 'utf8'));
const base = normalizarDocumento(validarDocumento(raw));
let passed = 0,
  failed = 0;
const test = (name, fn) => {
  try {
    fn();
    passed++;
  } catch (e) {
    failed++;
    console.error(name, e.message);
  }
};
const s = resumenPresentacion(base);
for (const [key, value] of Object.entries({
  eventos: 225,
  acciones: 168,
  proyectos: 12,
  lecciones: 22,
  altoPotencial: 6,
  cerradas: 3,
  cierresParciales: 2,
  sinInformacion: 127,
  anioDesde: 2009,
  anioHasta: 2026,
}))
  test(key, () => assert.equal(s[key], value));
test('cierre', () => assert.equal(formatoNarrativo(s.porcentajeCierre, 1), '1.8'));
test('sin información', () =>
  assert.equal(formatoNarrativo(s.porcentajeSinInformacion, 1), '75.6'));
for (const [key, value] of Object.entries({ if: 2.7098, is: 283.92, ia: 0.7694 }))
  test(`oficial ${key}`, () => assert.equal(s.indicadores[key], value));
test('fuente', () => assert.ok(s.indicadores.fuente));
test('proyectos desde detalle', () =>
  assert.deepEqual(
    s.proyectosDetalle.slice(0, 3).map((p) => p.eventos),
    [138, 25, 23],
  ));
test('no alteración', () => {
  const before = JSON.stringify(base);
  resumenPresentacion(base);
  assert.equal(JSON.stringify(base), before);
});
test('metaconteo no sustituye filas', () => {
  const copy = structuredClone(base);
  copy.meta.conteos.eventos = 9999;
  assert.equal(resumenPresentacion(copy).eventos, 225);
});
test('sin local', () => {
  const copy = structuredClone(base);
  copy.eventos.push({ ...copy.eventos[0], id: 'SOLO-PRUEBA', origen: 'local' });
  assert.equal(resumenPresentacion(copy).eventos, 225);
});
test('corte original', () => {
  const copy = structuredClone(base);
  copy.acciones.forEach((a) => (a.estadoVerificado = 'Cerrada con evidencia'));
  assert.equal(resumenPresentacion(copy).cerradas, 3);
});
test('sin denominador', () =>
  assert.equal(resumenPresentacion({ ...base, acciones: [] }).porcentajeCierre, null));
test('no oficial ausente', () =>
  assert.equal(resumenPresentacion(base, { anio: 2099, ambito: 'PERU' }).indicadores.if, null));
test('versión ambigua', () => {
  const copy = structuredClone(base);
  copy.indicadores.anual_por_ambito.push({
    ...copy.indicadores.anual_por_ambito.find((i) => i.anio === 2024 && i.ambito === 'PERU'),
  });
  assert.equal(resumenPresentacion(copy).indicadores.if, null);
});
test('null != cero', () => {
  assert.equal(formatoNarrativo(null), 'No consta');
  assert.equal(formatoNarrativo(0), '0');
});
test('8 escenas', () => assert.equal(new Set(c.ESCENAS.map((e) => e.id)).size, 8));
test('reduced', () => assert.equal(c.modoInicial({ webgl: true, reducido: true }), '2d'));
test('no WebGL', () => assert.equal(c.modoInicial({ webgl: false, reducido: false }), '2d'));
test('memoria desconocida', () =>
  assert.equal(c.modoInicial({ webgl: true, reducido: false }), 'alta'));
test('memoria baja', () =>
  assert.equal(c.modoInicial({ webgl: true, reducido: false, memoria: 2 }), '2d'));
test('ahorro', () =>
  assert.equal(c.modoInicial({ webgl: true, reducido: false, ahorro: true }), '2d'));
test('móvil', () =>
  assert.equal(c.modoInicial({ webgl: true, reducido: false, movil: true }), 'equilibrada'));
test('degradación', () =>
  assert.deepEqual(['alta', 'equilibrada', 'baja', '2d'].map(c.degradarCalidad), [
    'equilibrada',
    'baja',
    '2d',
    '2d',
  ]));
test('DPR <= 1.5', () =>
  ['alta', 'equilibrada', 'baja'].forEach((q) => assert.ok(c.perfilCalidad(q).dprMax <= 1.5)));
test('baja sin efectos', () => {
  assert.equal(c.perfilCalidad('baja').polvo, 0);
  assert.equal(c.perfilCalidad('baja').capasNiebla, 0);
});
test('altura variable', () => assert.equal(c.progresoNarrativo(225, [0, 100, 350]), 0.75));
test('recorrido finito y monótono', () => {
  let z = Infinity;
  for (let i = 0; i <= 1000; i++) {
    const p = c.poseCamara(i / 1000);
    assert.ok(p.posicion.every(Number.isFinite));
    assert.ok(p.posicion[2] <= z);
    assert.ok(p.mirada[2] < p.posicion[2]);
    z = p.posicion[2];
  }
});
test('geometría determinista', () =>
  assert.deepEqual(c.mallaBoveda('baja'), c.mallaBoveda('baja')));
test('segmentos válidos', () =>
  [...c.mallaBoveda('alta'), ...c.pernosBoveda()].forEach((t) => {
    assert.ok([...t.desde, ...t.hasta].every(Number.isFinite));
    assert.ok(t.desde.some((n, i) => n !== t.hasta[i]));
  }));
test('menos geometría en baja', () =>
  assert.ok(c.mallaBoveda('baja').length < c.mallaBoveda('alta').length));
test('semilla repetible', () => {
  const a = c.aleatorioSemilla(5),
    b = c.aleatorioSemilla(5);
  for (let i = 0; i < 100; i++) assert.equal(a(), b());
});
console.log(
  `PASO 3 — pruebas portables: ${passed}/${passed + failed} aprobadas; ${failed} fallos.`,
);
console.log(
  `Node ${process.version}. No incluye renderizado Next.js, React, WebGL, Vitest ni navegador.`,
);
process.exitCode = failed ? 1 : 0;
```

## `scripts/verify-dependencies.mjs`

```js
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
const manifest = JSON.parse(fs.readFileSync('package.json', 'utf8'));
let invalid = false;
for (const [name, version] of Object.entries({
  ...manifest.dependencies,
  ...manifest.devDependencies,
})) {
  if (!/^\d+\.\d+\.\d+(-[a-z0-9.-]+)?$/i.test(version)) {
    invalid = true;
    console.error(`Versión directa no fijada: ${name} ${version}`);
  }
}
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const result = spawnSync(npm, ['ls', '--all', '--json'], {
  encoding: 'utf8',
  maxBuffer: 20 * 1024 * 1024,
  shell: process.platform === 'win32',
});
if (result.error || result.status !== 0) {
  console.error(
    'No se pudo verificar el árbol instalado. Ejecute npm install y revise npm ls --all.',
  );
  console.error(result.error?.message ?? result.stderr);
  invalid = true;
} else {
  const tree = JSON.parse(result.stdout);
  for (const [name, version] of Object.entries({
    ...manifest.dependencies,
    ...manifest.devDependencies,
  })) {
    if (tree.dependencies?.[name]?.version !== version) {
      invalid = true;
      console.error(`La versión instalada de ${name} no coincide con ${version}.`);
    }
  }
}
console.log(
  invalid
    ? 'Dependencias NO verificadas.'
    : 'Versiones directas exactas y árbol instalado sin conflictos reportados por npm.',
);
process.exitCode = invalid ? 1 : 0;
```

## `tests/cinematica.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import {
  acotar,
  aleatorioSemilla,
  degradarCalidad,
  ESCENAS,
  GALERIA,
  mallaBoveda,
  modoInicial,
  perfilCalidad,
  pernosBoveda,
  poseCamara,
  progresoNarrativo,
} from '@/lib/domain/cinematica';

describe('Narrativa, capacidades y geometría determinista', () => {
  it('define ocho escenas únicas', () => {
    expect(ESCENAS).toHaveLength(8);
    expect(new Set(ESCENAS.map((s) => s.id)).size).toBe(8);
  });
  it('prioriza las preferencias de movimiento y disponibilidad de WebGL', () => {
    expect(modoInicial({ webgl: true, reducido: true })).toBe('2d');
    expect(modoInicial({ webgl: false, reducido: false })).toBe('2d');
    expect(modoInicial({ webgl: true, reducido: false, ahorro: true })).toBe('2d');
  });
  it('usa pistas conservadoras, sin tratar memoria ausente como cero', () => {
    expect(modoInicial({ webgl: true, reducido: false })).toBe('alta');
    expect(modoInicial({ webgl: true, reducido: false, memoria: 2 })).toBe('2d');
    expect(modoInicial({ webgl: true, reducido: false, memoria: 4 })).toBe('baja');
    expect(modoInicial({ webgl: true, reducido: false, movil: true })).toBe('equilibrada');
  });
  it('degrada de forma monotónica y termina en 2D', () => {
    expect(degradarCalidad('alta')).toBe('equilibrada');
    expect(degradarCalidad('equilibrada')).toBe('baja');
    expect(degradarCalidad('baja')).toBe('2d');
    expect(degradarCalidad('2d')).toBe('2d');
  });
  it('respeta el máximo DPR y retira los efectos del nivel bajo', () => {
    for (const quality of ['alta', 'equilibrada', 'baja'] as const)
      expect(perfilCalidad(quality).dprMax).toBeLessThanOrEqual(1.5);
    expect(perfilCalidad('baja')).toMatchObject({ polvo: 0, capasNiebla: 0, dprMax: 1 });
  });
  it('normaliza según posiciones reales, no una altura fija por escena', () => {
    expect(progresoNarrativo(0, [0, 100, 350])).toBe(0);
    expect(progresoNarrativo(100, [0, 100, 350])).toBe(0.5);
    expect(progresoNarrativo(225, [0, 100, 350])).toBe(0.75);
    expect(progresoNarrativo(999, [0, 100, 350])).toBe(1);
    expect(progresoNarrativo(0, [])).toBe(0);
  });
  it('mantiene la cámara dentro de la galería y sin retroceso involuntario', () => {
    let previous = Infinity;
    for (let i = 0; i <= 100; i++) {
      const { posicion, mirada } = poseCamara(i / 100);
      expect(posicion.every(Number.isFinite)).toBe(true);
      expect(Math.abs(posicion[0])).toBeLessThan(GALERIA.radio);
      expect(posicion[2]).toBeLessThanOrEqual(previous);
      expect(mirada[2]).toBeLessThan(posicion[2]);
      previous = posicion[2];
    }
  });
  it('produce malla y pernos finitos sin segmentos vacíos', () => {
    const segments = [...mallaBoveda('alta'), ...pernosBoveda()];
    expect(segments.length).toBeGreaterThan(500);
    expect(segments.every((s) => [...s.desde, ...s.hasta].every(Number.isFinite))).toBe(true);
    expect(segments.every((s) => s.desde.some((n, i) => n !== s.hasta[i]))).toBe(true);
    expect(mallaBoveda('baja').length).toBeLessThan(mallaBoveda('alta').length);
  });
  it('reproduce la semilla sin Math.random durante el render', () => {
    const a = aleatorioSemilla(5),
      b = aleatorioSemilla(5);
    for (let i = 0; i < 100; i++) expect(a()).toBe(b());
  });
  it('acota entradas no finitas sin propagar NaN', () => {
    expect(acotar(NaN)).toBe(0);
    expect(acotar(2)).toBe(1);
    expect(acotar(-1)).toBe(0);
  });
});
```

## `tests/e2e/intro.spec.ts`

```ts
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Narrativa accesible y fallback', () => {
  test.use({ reducedMotion: 'reduce' });
  test('ocho escenas y números del conjunto original', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    await expect(page.locator('[data-intro-scene]')).toHaveCount(8);
    await expect(page.locator('#eventos [data-value="225"] .sr-only')).toHaveText('225');
    await expect(page.locator('#proyectos .intro-inline-stat .sr-only')).toHaveText('12');
    await expect(page.locator('#indicadores .intro-indicator-grid .sr-only')).toHaveText([
      '2.71',
      '283.92',
      '0.769',
    ]);
    await expect(page.locator('#evidencia .intro-gap-number .sr-only')).toHaveText([
      '1.8%',
      '75.6%',
    ]);
    await expect(page.locator('canvas')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
  test('Saltar intro conserva los filtros aprobados', async ({ page }) => {
    await page.goto('/?anios=2024');
    const skip = page.getByRole('link', { name: 'Saltar intro' });
    await expect(skip).toHaveAttribute('href', '/dashboard?anios=2024');
    await skip.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/dashboard\?anios=2024/);
  });
  test('selección de escena accesible mueve el foco y mantiene el HTML', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('combobox', { name: 'Ir a una escena' }).selectOption('5');
    await expect(page.locator('#evidencia')).toBeFocused();
    await expect(page.locator('[data-intro-scene]')).toHaveCount(8);
  });
  test('360 px: no desborde horizontal; CTA accesible', async ({ page }, info) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.screenshot({ path: info.outputPath('intro-mobile-2d.png'), fullPage: true });
    await page.getByRole('combobox', { name: 'Ir a una escena' }).selectOption('7');
    await expect(page.getByRole('link', { name: 'Explorar dashboard', exact: true })).toBeVisible();
  });
  test('texto y cifras también existen sin JavaScript', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:3100/');
    await expect(page.locator('[data-intro-scene]')).toHaveCount(8);
    await expect(page.locator('#eventos')).toContainText('225');
    await expect(page.getByRole('link', { name: 'Saltar intro' })).toHaveAttribute(
      'href',
      '/dashboard',
    );
    await context.close();
  });
  test('axe WCAG AA sobre la narrativa 2D', async ({ page }) => {
    await page.goto('/');
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(result.violations).toEqual([]);
  });
});

test('WebGL bloqueado conserva narrativa y controles', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value: function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
        return type === 'webgl' || type === 'webgl2'
          ? null
          : Reflect.apply(original, this, [type, ...args]);
      },
    });
  });
  await page.goto('/');
  await expect(page.locator('.intro-root')).toHaveAttribute('data-mode', '2d');
  await expect(page.locator('.intro-footer')).toContainText('WebGL2 no disponible');
  await expect(page.locator('[data-intro-scene]')).toHaveCount(8);
});

test.describe('WebGL real — requiere GPU/WebGL2 disponible', () => {
  test.skip(
    process.env.E2E_WEBGL !== '1',
    'Activar E2E_WEBGL=1 en un navegador con WebGL2. No se falsea la capacidad de GPU.',
  );
  test('recorrido, reposo demand, ocultación y pérdida de contexto', async ({ page }, info) => {
    await page.goto('/');
    const canvas = page.locator('[data-renderer="incimmet-three"]');
    await expect(canvas).toBeVisible();
    await page.waitForTimeout(6500);
    await expect(page.getByTestId('mine-canvas-root')).toHaveAttribute(
      'data-render-loop',
      'demand',
    );
    await page.getByRole('combobox', { name: 'Ir a una escena' }).selectOption('3');
    await page.waitForTimeout(2500);
    await page.screenshot({ path: info.outputPath('intro-webgl.png') });
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(page.getByTestId('mine-canvas-root')).toHaveAttribute('data-render-loop', 'never');
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await canvas.evaluate((element) =>
      element.dispatchEvent(new Event('webglcontextlost', { cancelable: true })),
    );
    await expect(page.locator('.intro-root')).toHaveAttribute('data-mode', '2d');
    await expect(page.locator('[data-intro-scene]')).toHaveCount(8);
  });
});
```

## `tests/presentacion.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { base } from './fixtures';
import { formatoNarrativo, resumenPresentacion } from '@/lib/domain/presentacion';

describe('Presentación documental sin cifras hardcodeadas', () => {
  it('resume las colecciones originales y su rango', () => {
    expect(resumenPresentacion(base)).toMatchObject({
      eventos: 225,
      proyectos: 12,
      acciones: 168,
      lecciones: 22,
      altoPotencial: 6,
      desde: '2009-12-29',
      hasta: '2026-09-30',
      anioDesde: 2009,
      anioHasta: 2026,
    });
  });
  it('conserva 3 cierres, 2 parciales y 127 sin información', () => {
    const result = resumenPresentacion(base);
    expect(result).toMatchObject({ cerradas: 3, cierresParciales: 2, sinInformacion: 127 });
    expect(formatoNarrativo(result.porcentajeCierre, 1)).toBe('1.8');
    expect(formatoNarrativo(result.porcentajeSinInformacion, 1)).toBe('75.6');
  });
  it('usa IF/IS/IA oficiales, nunca el detalle como reemplazo', () => {
    const result = resumenPresentacion(base);
    expect(result.indicadores).toMatchObject({
      anio: 2024,
      ambito: 'PERU',
      if: 2.7098,
      is: 283.92,
      ia: 0.7694,
    });
    expect(formatoNarrativo(result.indicadores.if, 2)).toBe('2.71');
    expect(formatoNarrativo(result.indicadores.ia, 3)).toBe('0.769');
    expect(result.indicadores.fuente).toBeTruthy();
  });
  it('deriva proyectos del detalle, no del campo n_eventos', () => {
    const copy = structuredClone(base);
    copy.proyectos.forEach((p) => {
      p.n_eventos = 0;
    });
    expect(
      resumenPresentacion(copy)
        .proyectosDetalle.slice(0, 3)
        .map((p) => p.eventos),
    ).toEqual([138, 25, 23]);
  });
  it('ignora metaconteos alterados en una copia sintética', () => {
    const copy = structuredClone(base);
    copy.meta.conteos.eventos = 9999;
    expect(resumenPresentacion(copy).eventos).toBe(base.eventos.length);
  });
  it('no incorpora reportes locales a la narrativa del corte', () => {
    const copy = structuredClone(base);
    const first = copy.eventos[0];
    if (!first) throw new Error('Falta fixture');
    copy.eventos.push({ ...first, id: 'PRUEBA-LOCAL', origen: 'local' });
    expect(resumenPresentacion(copy).eventos).toBe(base.eventos.length);
  });
  it('no confunde nuevas validaciones locales con el estado importado', () => {
    const copy = structuredClone(base);
    copy.acciones.forEach((a) => {
      a.estadoVerificado = 'Cerrada con evidencia';
    });
    expect(resumenPresentacion(copy).cerradas).toBe(3);
  });
  it('cuenta IDs únicos y conserva el original', () => {
    const before = JSON.stringify(base);
    const copy = structuredClone(base);
    copy.eventos.push(...copy.eventos);
    copy.acciones.push(...copy.acciones);
    expect(resumenPresentacion(copy).eventos).toBe(225);
    expect(resumenPresentacion(copy).acciones).toBe(168);
    expect(JSON.stringify(base)).toBe(before);
  });
  it('un porcentaje sin denominador es nulo', () => {
    const copy = { ...base, acciones: [] };
    expect(resumenPresentacion(copy).porcentajeCierre).toBeNull();
    expect(resumenPresentacion(copy).porcentajeSinInformacion).toBeNull();
  });
  it('un indicador ausente no se presenta como cero', () => {
    expect(resumenPresentacion(base, { anio: 2099, ambito: 'PERU' }).indicadores.if).toBeNull();
  });
  it('no selecciona una versión oficial ambigua', () => {
    const copy = structuredClone(base);
    const official = copy.indicadores.anual_por_ambito.find(
      (i) => i.anio === 2024 && i.ambito === 'PERU',
    );
    if (!official) throw new Error('Falta fixture');
    copy.indicadores.anual_por_ambito.push({ ...official, if: 9, fuente: 'SINTETICA-PRUEBA' });
    expect(resumenPresentacion(copy).indicadores).toMatchObject({ if: null, versiones: 2 });
  });
  it.each([null, undefined, NaN, Infinity])('formatea %s como No consta', (value) => {
    expect(formatoNarrativo(value)).toBe('No consta');
  });
  it('conserva el cero explícito y el punto decimal', () => {
    expect(formatoNarrativo(0, 1)).toBe('0.0');
    expect(formatoNarrativo(283.92, 2)).toBe('283.92');
  });
});
```
