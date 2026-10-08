# Materiales, licencias y dependencias externas

La marca INCIMMET y el conjunto documental pertenecen a sus titulares. El wordmark es un placeholder tipográfico autorizado por las instrucciones de la demo, no un logotipo descargado. Los íconos, pósters y geometrías procedurales incluidos no representan un levantamiento de una mina real. No se distribuyen archivos de tipografía, fotografías externas, node_modules ni modelos de terceros.

Las bibliotecas declaradas en package.json conservan sus licencias originales; deben revisarse en el árbol instalado. Los componentes de interfaz usan composición del patrón shadcn/ui sobre Radix. No se añade una licencia general que otorgue derechos sobre los documentos originales o la marca. GSAP 3.13.0 conserva la licencia estándar de GSAP; no se declara MIT ni se relicencia.

**Excepción de CDN introducida en el paso final:** `public/sw.js` descarga Workbox 7.3.0 y sus módulos del CDN oficial al instalar/actualizar el worker. No están vendorizados dentro del ZIP y su licencia original se conserva en el recurso upstream. Esta decisión mantiene sin cambios el lockfile npm aportado. Requiere acceso al CDN durante la preparación y revisión de cadena de suministro antes de producción. Los reportes no se envían a ese CDN.

La tipografía de la aplicación usa la pila local configurada; Canvas emplea una fuente del sistema. La creación de íconos no incorpora un archivo de fuente al repositorio. Los artefactos de herramientas usados únicamente para formatear/verificar en el contenedor tampoco forman parte del ZIP final.
