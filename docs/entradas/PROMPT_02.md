# PROMPT 02 — Arquitectura, capa de datos, dominio y esqueleto del repositorio

Continuamos con el diseño aprobado en el paso anterior (si algo cambió, lo indico al final). Ahora **genera código**.

Crea el esqueleto del repositorio **incimmet-ssoma-platform** según la sección 7 del brief:

1. Next.js (App Router) + TypeScript strict + Tailwind + shadcn/ui, con ESLint, Prettier y Vitest configurados. Incluye `package.json` con versiones fijadas y compatibles entre sí (Node 20) y `.env.example` con `NEXT_PUBLIC_DATA_SOURCE=static`.
2. `public/data/data.json`: copia del archivo adjunto **sin modificarlo**.
3. `lib/types.ts`: tipos exactos del JSON (sección 6 del brief) y tipos de dominio (sección 5).
4. `lib/data/DataSource.ts`, `StaticJsonDataSource.ts` (fetch del JSON, normalización y persistencia local en IndexedDB con `idb` para reportes y evidencias creados en la demo) y `SupabaseDataSource.ts` (stub tipado con TODOs). Agrega un selector por variable de entorno.
5. `lib/domain/`:
   - `indicadores.ts`: IF, IS, IA y TRIFR, con manejo de HHT 0 o nulo;
   - `estadoVerificado.ts`: regla de la sección 4 con fecha de corte configurable;
   - `filtros.ts`: filtros cruzados puros y memoizables;
   - `agregaciones.ts`: Pareto (incluye % acumulado), mapa de calor proyecto×mes, tendencias, cumplimiento por proyecto y por evento.

   Pruebas Vitest para cada función, con casos tomados de data.json. Ejemplo: 2024 PERU IF = 2.7098 tal como viene en el archivo; 3 acciones "Cerrada con evidencia".
6. `store/filtros.ts` (Zustand) sincronizado con la URL.
7. Layout base: header con logo o wordmark, selector de rol (demo), navegación por rol, banner de calidad de datos (`meta.advertencias`), modo claro/oscuro y una página `/privacidad` (Ley 29733).
8. `supabase/schema.sql`: tablas del modelo objetivo, índices, tabla de identidad separada y políticas RLS de ejemplo por rol.

Entrega:
- (a) el árbol de archivos;
- (b) el código de los archivos clave en el chat;
- (c) un **.zip descargable** con todo lo generado hasta ahora (`incimmet-ssoma-platform_paso2.zip`).

Verifica mentalmente que `npm run build` y `npm test` pasarían y corrige lo necesario antes de entregar.
