# PROMPT 01 — Contexto, análisis de datos y diseño funcional/UX (sin código todavía)

Adjunto tres archivos: **BRIEF_CHATGPT.md** (brief maestro), **data.json** (datos anonimizados de la demo) y, de forma opcional, **logo_incimmet.svg**.

Actúa como un equipo senior formado por product designer, UX lead, arquitecto front-end y especialista en analítica SSOMA minera. Vamos a construir en 5 pasos la plataforma web + PWA de gestión de incidentes SSOMA de INCIMMET descrita en el brief. **En este paso NO escribas código de la aplicación.**

1. **Lee el brief completo y analiza data.json** con tu herramienta de análisis. Reporta:
   - conteos por año, tipo_grupo y proyecto;
   - % de acciones por estado_verificado;
   - campos con más nulos;
   - rango de fechas;
   - cualquier inconsistencia que afecte el diseño.

   Confirma que los conteos coinciden con meta.conteos (225 eventos, 168 acciones, 22 lecciones, 12 proyectos).
2. **Arquitectura de información:** mapa del sitio y navegación por rol (Gerencia, SSOMA corporativo, Supervisor de campo).
3. **Flujos de usuario** paso a paso:
   - (a) gerente que revisa la tendencia y el cumplimiento;
   - (b) analista SSOMA que investiga un evento, verifica acciones y publica una lección;
   - (c) supervisor que reporta un evento offline desde la mina y luego sube evidencia de una acción.
4. **Wireframes en texto o ASCII** de:
   - la presentación cinemática (storyboard de 6–8 "escenas" de scroll: qué se ve en 3D, qué dato aparece, qué transición);
   - el dashboard;
   - el análisis avanzado;
   - la ficha de evento;
   - el registro de acciones (lista + kanban);
   - las lecciones;
   - los 4 pasos del formulario PWA.
5. **Sistema de diseño:**
   - tokens (colores de la sección 8 del brief, tipografía, espaciado, radios, sombras, estados del semáforo);
   - componentes base;
   - reglas de visualización de datos (paleta para categorías, cómo mostrar "No consta", cómo rotular indicadores oficiales vs. no oficiales).
6. **Catálogo de gráficos:** para cada uno, la pregunta que responde, los campos de data.json que usa, el tipo de gráfico ECharts y la interacción de filtro cruzado.
7. **Lista de supuestos y preguntas abiertas** (máximo 10).

Entrega todo en un solo documento Markdown bien estructurado y, además, como archivo descargable **DISENO_FUNCIONAL_UX.md**. Termina con: "Listo para el PROMPT 02".
