# PROMPT 03 — Presentación cinemática 3D e identidad visual

Sobre el repositorio del paso 2 (reutiliza su estructura y sus tipos), implementa la **landing de presentación cinemática** (`app/(marketing)/page.tsx`) según el storyboard del paso 1 y la sección 3.1 del brief:

1. Escena **react-three-fiber + drei** de una galería o rampa minera subterránea:
   - geometría procedural (túnel con perfil de bóveda, malla electrosoldada y pernos en la corona, cables, tuberías HDPE, luces de casco y lámparas, partículas de polvo, niebla volumétrica ligera);
   - materiales PBR sobrios;
   - cámara que avanza con `ScrollControls` o GSAP ScrollTrigger;
   - 6–8 escenas con overlays HTML (drei `<Html>` o capas DOM) que muestran los datos reales de data.json con contadores animados: 225 eventos 2009–2026; 12 proyectos; IF/IS/IA 2024 (2.71 / 283.92 / 0.769); solo 1.8 % de acciones con cierre verificado y 75.6 % sin información; la solución por módulos; y el CTA hacia `/dashboard`.
2. Cada número se lee del JSON con las funciones de dominio, **no hardcodeado**.
3. Rendimiento:
   - `dynamic(() => import(...), { ssr:false })`;
   - `dpr={[1, 1.5]}`, `frameloop` en "demand" cuando corresponda;
   - instancing para pernos y malla, sin sombras costosas en móvil;
   - pausa cuando la pestaña está oculta;
   - detección de GPU de gama baja (`drei/PerformanceMonitor`) con degradación progresiva.
4. **Fallback 2D** (sin WebGL o con `prefers-reduced-motion`): la misma narrativa con secciones CSS, gradientes en los colores corporativos y SVG animado sutil.
5. Identidad: tokens de color de la sección 8 (#151F44, #1D7DCC, #002060, #0070C0, #00B0F0), tipografía, logo o wordmark, lema "Hagamos el camino juntos". Tono profesional, nada estridente.
6. Accesibilidad: el contenido textual de cada escena debe ser legible por lectores de pantalla y navegable con teclado; incluir un botón "Saltar intro".

Entrega el código de los archivos nuevos o modificados y un **.zip actualizado** (`incimmet-ssoma-platform_paso3.zip`) con el repositorio completo.
