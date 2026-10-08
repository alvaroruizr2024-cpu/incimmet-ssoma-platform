# Versiones fijadas — PASO 3

Se conservan las versiones del paso 2; se añade una combinación explícita sin rangos `^` o `~` en dependencias directas. Node objetivo: 20.19+ dentro del rango del manifiesto; ejecución del dominio aquí: Node 22.16.0.

| Paquete                   | Versión fijada  | Criterio                                                                                               |
| ------------------------- | --------------- | ------------------------------------------------------------------------------------------------------ |
| next / eslint-config-next | 16.4.0 / 16.4.0 | Misma línea; versiones heredadas. Metadato oficial Next contrastado.                                   |
| react / react-dom         | 19.2.4 / 19.2.4 | Mismas versiones heredadas; pertenecen al rango React 19 requerido por Fiber/drei.                     |
| three                     | 0.175.0         | Cohorte r175 explícita; satisface >=0.156 de Fiber y >=0.159 de drei.                                  |
| @react-three/fiber        | 9.4.0           | Su etiqueta oficial declara React ^19.0.0 y Three >=0.156.                                             |
| @react-three/drei         | 10.0.7          | Su etiqueta declara Fiber ^9.0.0, React ^19 y Three >=0.159; usa camera-controls ^2.9.0, no la rama 3. |
| @types/three              | 0.175.0         | Tipos de la misma línea r175.                                                                          |
| gsap                      | 3.13.0          | ScrollTrigger incluido, sin paquete separado ni CDN.                                                   |
| server-only               | 0.0.1           | Marca el adaptador de lectura SSG como exclusivo del servidor.                                         |
| @playwright/test          | 1.56.1          | Suite de integración escrita; requiere instalar navegador.                                             |
| @axe-core/playwright      | 4.10.2          | Comprobación accesible automatizada escrita.                                                           |

Son **versiones directas exactas y rangos peer compatibles según manifiestos**, no una afirmación de instalación, build o auditoría de seguridad completados. Esta elección no pretende ser la versión más reciente de cada biblioteca. No se utilizó `--legacy-peer-deps` ni `--force` para ocultar conflictos.

## Fuentes primarias contrastadas

- Fiber 9.4.0: `https://raw.githubusercontent.com/pmndrs/react-three-fiber/v9.4.0/packages/fiber/package.json`
- Drei 10.0.7: `https://raw.githubusercontent.com/pmndrs/drei/v10.0.7/package.json`
- Three r175: `https://raw.githubusercontent.com/mrdoob/three.js/r175/package.json`
- GSAP 3.13.0: `https://raw.githubusercontent.com/greensock/GSAP/3.13.0/package.json`
- Next: `https://registry.npmjs.org/next/latest` (respuesta consultada: 16.4.0).
- Guías: `https://r3f.docs.pmnd.rs/advanced/scaling-performance`, `https://drei.docs.pmnd.rs/performances/performance-monitor`, `https://gsap.com/docs/v3/Plugins/ScrollTrigger/`.

## Instalación en su entorno con npm

`npm install` debe resolver el árbol transitivo y generar el **package-lock.json real**. Consérvelo después de revisar la instalación. Luego use `npm ci`. `npm run verify:deps` contrasta las versiones instaladas con las fijadas y consulta `npm ls --all` para detectar problemas de resolución.

El contenedor de autoría no pudo resolver registry.npmjs.org (`EAI_AGAIN`). Eso no contradice que el entorno del usuario tenga acceso. No se ha fabricado un lockfile ni un resultado de build. Los registros están incluidos.
