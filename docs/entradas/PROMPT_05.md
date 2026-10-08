# PROMPT 05 — PWA de reporte en campo, QA final y repositorio empaquetado

Sobre el repositorio del paso 4, completa y cierra el proyecto:

1. **PWA /campo** (mobile-first, botones grandes y alto contraste):
   - `manifest.webmanifest` con íconos 192/512 y maskable generados a partir del wordmark o el logo, más service worker (Serwist o Workbox) que cachee la app shell y los JSON;
   - **offline-first**: formulario por pasos (proyecto → fecha/hora/lugar/labor → tipo/actividad/equipo/riesgo crítico → descripción con dictado por voz si existe Web Speech API, fotos con `capture="environment"` y compresión en el cliente → persona afectada: **solo rol y zona corporal general** → acciones inmediatas);
   - guardado en IndexedDB, cola de sincronización con indicador "pendiente de envío" y reintento al volver la conexión (en la demo, la sincronización envía a `DataSource.crearReporte`);
   - validaciones que **bloqueen** patrones de DNI (8 dígitos) y adviertan si el texto parece contener nombres propios o diagnósticos;
   - aviso de privacidad (Ley 29733);
   - vistas "Mis acciones" (filtradas por el proyecto del supervisor) y "Lecciones por riesgo";
   - prompt de instalación (A2HS).
2. **QA:**
   - revisar responsive (360 px, 768 px, 1440 px), navegación por teclado, contrastes, `aria-live` en los toasts y textos alternativos en los gráficos;
   - verificar el fallback sin WebGL y con `prefers-reduced-motion`;
   - optimizar el bundle (análisis, imports dinámicos, eliminar dependencias sin uso);
   - corregir cualquier error de tipos o de lint;
   - asegurar que `npm run build`, `npm test` y `npm run lint` pasen.
3. **Vercel:**
   - `vercel.json` solo si es necesario y encabezados de seguridad (CSP razonable compatible con WebGL y workers, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` para cámara y micrófono solo en /campo);
   - documentar el despliegue de una **Preview** para revisión antes de pasar a producción.
4. **README.md final** (en español):
   - descripción, capturas sugeridas, requisitos y comandos;
   - estructura y arquitectura (diagrama en Mermaid);
   - cómo actualizar los datos (`public/data/data.json`) y cómo conectar Supabase (`supabase/schema.sql`, variables de entorno, RLS, Storage para evidencias, Realtime para `subscribe`);
   - privacidad, limitaciones de la demo y hoja de ruta (integración con Power BI vía vistas SQL o API, notificaciones, firma de cierre).
5. **Entrega final:** un único archivo **`incimmet-ssoma-platform.zip`** con el **repositorio completo** (sin `node_modules` ni `.next`), más el listado del árbol de archivos y la lista de criterios de aceptación de la sección 11 del brief marcada con lo verificado y lo pendiente.
