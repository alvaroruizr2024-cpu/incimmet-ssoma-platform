# PROMPT 04 — Dashboard, análisis avanzado, eventos, acciones y lecciones

Sobre el repositorio del paso 3, implementa los módulos 2 a 6 del brief usando **ECharts** y la capa `DataSource`:

1. **/dashboard**:
   - KPIs (eventos, accidentes por nivel, HPRI, días perdidos, % de acciones con cierre verificado, vencidas);
   - gráficos enlazados con **filtros cruzados**: al hacer clic en una barra, celda o sector se aplica el filtro global (Zustand + URL), con chips de filtros activos y un botón "Limpiar";
   - botón **"Simular tiempo real"** que reproduce los eventos de 2026 en orden cronológico a través de `DataSource.subscribe()`, con toast "Nuevo evento" y KPIs que se actualizan.
2. **/analisis**:
   - tendencia mensual y anual por tipo_grupo;
   - **Pareto** (tipo, riesgo_critico, actividad, equipo) con línea de % acumulado y marca del 80 %;
   - **mapa de calor proyecto × mes** (selector de año);
   - matriz nivel_incimmet × pg_incimmet;
   - panel de alto potencial;
   - **indicadores IF/IS/IA/TRIFR** por año y ámbito, desde `indicadores.anual_por_ambito`, con metas 2026 y los 12 meses a feb-2026, rotulados "oficial (documento fuente)";
   - recálculo "no oficial" con `hh_semanal_pbix_resumen`;
   - **cumplimiento verificado** por proyecto y por evento (barras apiladas por estado);
   - pestaña **Calidad de datos**: cobertura año × proyecto, % de nulos por campo y brechas.
   - Cada gráfico debe tener el botón "Ver datos" (tabla accesible) y la opción de exportar PNG/CSV.
3. **/eventos** y **/eventos/[id]**:
   - tabla con búsqueda, orden y paginación (TanStack Table) y exportación CSV;
   - ficha con todos los campos; si un campo viene `null`, mostrar "No consta";
   - acciones y lecciones vinculadas, fuentes como chips con el código de documento y tooltip con la descripción de `documentos_fuente`, nivel de confianza y línea de tiempo del ciclo de vida.
4. **/acciones**:
   - vista de lista y **kanban** por estado_verificado, con semáforo de fecha compromiso;
   - filtros (proyecto, evento, jerarquía, rol responsable);
   - modal "Adjuntar evidencia" (mock en IndexedDB, con archivo + rol validador) que recalcula el estado con `estadoVerificado.ts`;
   - resumen de % de cumplimiento verificado vs. declarado por proyecto.
5. **/lecciones**:
   - búsqueda de texto completo (MiniSearch o Fuse.js) sobre que_paso, por_que, leccion, controles y riesgo;
   - filtros por riesgo crítico, actividad y proyecto;
   - tarjetas con la jerarquía de controles en forma de pirámide visual y enlaces a los eventos origen;
   - botón "Generar ficha de difusión" (PDF o imagen en el cliente).

Respeta el sistema de diseño, la accesibilidad AA y el rendimiento (carga diferida de los gráficos). Agrega pruebas Vitest de las agregaciones nuevas. Entrega el código clave y un **.zip actualizado** (`incimmet-ssoma-platform_paso4.zip`).
