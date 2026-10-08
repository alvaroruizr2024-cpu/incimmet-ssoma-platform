# Seguridad y límites de la demo final

## Alcance

Demo con JSON público, roles simulados y persistencia local. No es un sistema de producción con control real de identidad. No se debe incorporar información clínica, nombres, DNI, secretos o evidencias personales sin el proceso de revisión y la infraestructura de acceso adecuados. El aviso jurídico deriva del brief y requiere revisión legal antes de uso real.

## Registro de riesgos

| Riesgo                                 | Tratamiento en esta entrega                                                                                                                                                                                                | Pendiente / decisión                                                                                                                                                                                                                                                     |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Herramientas de desarrollo vulnerables | Se conserva el lock real y se documenta L1. El usuario reportó 10 vulnerabilidades de desarrollo (7 altas, 3 moderadas) y 0 de producción en el paso 4 parcheado, incluyendo cadenas Tailwind 3/fast-glob/selector-parser. | No se obtuvo una auditoría final del registro. Separar CI/build de producción; limitar permisos; no procesar repositorios/entradas no confiables en un build privilegiado. Planificar migración compatible revisada; no afirmar que ser devDependency elimina el riesgo. |
| Identidad y acceso                     | Selector de rol rotulado como demo; JSON público y campos anonimizados de origen conservados.                                                                                                                              | Auth real, pertenencia por proyecto y RLS verificados antes de producción. No usar robots/noindex como autorización.                                                                                                                                                     |
| Texto/fotos personales                 | Bloqueo DNI, advertencias heurísticas de nombres/diagnósticos y comprobación antes de persistir; fotos recodificadas sin EXIF.                                                                                             | Falsos positivos/negativos; los píxeles pueden seguir mostrando datos personales. Revisión humana necesaria.                                                                                                                                                             |
| IndexedDB                              | Escrituras transaccionales, comprobación de errores, clave estable de reporte y conservación del payload en reintento.                                                                                                     | No cifrado local específico ni respaldo servidor; pérdida al borrar perfil/sitio/dispositivo. No prometer recuperación.                                                                                                                                                  |
| Workbox CDN                            | Versión 7.3.0 fijada y origen/ruta acotados para scripts del worker. Módulos cargados al instalar; el estado «preparado» exige caché completa.                                                                             | Disponibilidad y cadena de suministro externa para primera instalación/actualización. No SRI programático de importScripts. Autoalojar bundle revisado si la política de la organización no permite CDN.                                                                 |
| CSP inline                             | Necesaria para bootstrap estático de Next en esta demo; no unsafe-eval en producción; objetos/frames restringidos.                                                                                                         | No es una CSP estricta con nonce/hash por respuesta. Para producción revisar nonces/hashes y efecto sobre render estático y caché.                                                                                                                                       |
| Evidencias y cierres                   | Archivo, rol distinto, fecha y suficiencia de alcance para validaciones locales; estados originales separados.                                                                                                             | No firma electrónica, identidad autenticada o certificación de eficacia del control.                                                                                                                                                                                     |
| Exportaciones                          | CSV neutraliza fórmulas en texto libre; imágenes/CSV conservan procedencia/contexto.                                                                                                                                       | Los archivos exportados requieren la misma política de acceso y privacidad.                                                                                                                                                                                              |

## Encabezados

`next.config.ts` aplica CSP, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` y `Permissions-Policy`. Camera/microphone se deniegan fuera de `/campo`; se permiten al mismo origen únicamente en Campo. Cámara y dictado se inician con un gesto del usuario. Los enlaces hacia/fuera de Campo utilizan navegación completa, evitando heredar permisos del documento previo durante una transición SPA.

`/sw.js` se entrega con `no-cache, no-store, must-revalidate`, alcance `/` y una CSP que permite los scripts Workbox 7.3.0. Los reportes y sus fotos no se cachean como peticiones HTTP ni se envían al CDN; se guardan en IndexedDB. El CDN sí recibe la solicitud de los scripts del navegador. No se incluye un `vercel.json` redundante.

## Publicación

Publicar primero una Preview protegida cuando proceda; revisar dataset, permisos, rutas, headers, CSP, worker, recarga offline y actualización. No se ha desplegado una Preview en esta entrega. No promover a producción con puertas de build/lint/test o revisión de datos pendientes. El dominio de producción constituye otro origen: no hereda los datos/cachés locales de Preview.

## Auditoría reproducible

```bash
npm ci
npm ls --all
npm run verify:deps
npm audit --json > audit-final.json
npm audit --omit=dev --json > audit-produccion.json
```

Conserve fecha y versión del lock en el informe. Los logs del contenedor documentan el fallo de consulta al registro; no constituyen un resultado limpio. El workflow trata la auditoría de producción como puerta y conserva el inventario de herramientas de desarrollo sin ocultarlo.
