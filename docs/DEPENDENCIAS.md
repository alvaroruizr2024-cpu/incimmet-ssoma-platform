# Dependencias y compatibilidad

Todas las dependencias directas tienen versión exacta en `package.json`. No se usan rangos `^`/`~`. Se eligió App Router con Next 16.4.0, React/React DOM 19.2.4, TypeScript 5.9.3 y Tailwind 3.4.17, conservando la configuración de Tailwind 3 y componentes UI locales estilo shadcn sobre Radix. Zustand 5, TanStack Query 5 e idb 8 mantienen el contrato previsto en el brief.

El objetivo solicitado es Node 20; se fija un mínimo 20.19.0 en los engines y `.nvmrc`. La documentación de Next consultada indica un mínimo Node 20.9.0. Eso **no equivale a haber instalado y probado** todo este árbol de dependencias. El contenedor tenía Node 22.16.0 y TypeScript 5.8.3 disponibles para verificación aislada; no la versión 5.9.3 fijada para el proyecto.

La consulta de fuentes técnicas se limitó a configuración/compatibilidad, sin sustituir el contenido analítico del brief. Referencias oficiales:

- Next.js: https://nextjs.org/docs/app/getting-started/installation
- Next.js / History API: https://nextjs.org/docs/app/getting-started/linking-and-navigating
- shadcn / Next: https://ui.shadcn.com/docs/installation/next
- Vitest: https://vitest.dev/guide/
- Supabase / RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Mantenimiento de Node: https://nodejs.org/en/about/previous-releases

**Limitación comprobada:** el entorno no pudo conectarse al registro npm y su caché no tenía las dependencias. `npm install --offline` falló con `ENOTCACHED`; por tanto no se generó lockfile, no se validaron peers resueltos ni se ejecutó auditoría de vulnerabilidades. No se asegura que las versiones fijadas sean las últimas ni que carezcan de avisos de seguridad. Antes de producción, deben validarse instalación, lockfile, avisos vigentes y runtime soportado.

No se sustituyeron paquetes reales por implementaciones falsas para simular un build correcto. Las comprobaciones portables usan únicamente el núcleo de dominio compilado y se identifican por separado.
