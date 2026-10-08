# Diseño funcional y UX — INCIMMET
## Plataforma web + PWA de gestión de incidentes SSOMA

**PASO 1 de 5 · Versión 1.0 · 07/10/2026**  
**Identidad temporal:** placeholder textual **INCIMMET** y lema «Hagamos el camino juntos».  
**Interfaz:** español de Perú; zona horaria America/Lima; fechas DD/MM/AAAA; separador decimal punto.

**Alcance:** definición funcional, arquitectura de información, experiencia de usuario y visualización. La implementación, las pruebas de la aplicación y el despliegue corresponden a los pasos posteriores.

**Fuentes y trazabilidad.** [P] `PROMPT_01.md`, instrucciones del paso. [B] `BRIEF_CHATGPT.md`, leído completo, secciones 1–11. [D] `data.json`, analizado completo con Python. Los conteos se calculan sobre los registros originales. Las decisiones adicionales se identifican como propuestas, no como hechos del archivo. Los archivos de entrada permanecen sin modificaciones. No se han validado externamente las afirmaciones corporativas o normativas del brief.

---

# 1. Análisis de datos

## 1.1. Inventario e integridad

| Entidad | Conteo calculado | `meta.conteos` | Resultado |
| --- | --- | --- | --- |
| Eventos | 225 | 225 | Coincide |
| Acciones | 168 | 168 | Coincide |
| Lecciones | 22 | 22 | Coincide |
| Proyectos | 12 | 12 | Coincide |
| Documentos fuente | 33 | 33 | Coincide |

Los identificadores son únicos en las cinco colecciones. Las 168 acciones apuntan a eventos existentes y su proyecto coincide con el del evento. Los conteos `eventos[].n_acciones`, `proyectos[].n_eventos` y `anios_con_eventos` coinciden con los cálculos. Los 47 vínculos evento–lección son recíprocos y no tienen referencias huérfanas. Los códigos documentales y de evidencia referenciados existen en `documentos_fuente`.

Esto confirma **integridad referencial del JSON**, no exhaustividad de los hechos, suficiencia de las evidencias ni acceso a los documentos originales. [D: colecciones principales y referencias]

## 1.2. Eventos por año y tipo de grupo

| Año | Accidente | Incidente | Daño a la propiedad | Desvío | Ambiental | En investigación | Total |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2009 | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| 2010 | 4 | 0 | 0 | 0 | 0 | 0 | 4 |
| 2011 | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| 2012 | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| 2014 | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| 2017 | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| 2019 | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| 2022 | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| 2023 | 3 | 0 | 0 | 0 | 0 | 0 | 3 |
| 2024 | 28 | 32 | 82 | 12 | 1 | 0 | 155 |
| 2025 | 3 | 0 | 0 | 0 | 0 | 0 | 3 |
| 2026 | 9 | 16 | 21 | 5 | 0 | 1 | 52 |
| **Total** | 55 | 48 | 103 | 17 | 1 | 1 | 225 |

Los años 2013, 2015, 2016, 2018, 2020 y 2021 no tienen filas. La interfaz dirá **«Sin registros en esta base»**, no «Sin accidentes». Dentro de los 55 accidentes hay 25 leves, 24 incapacitantes, 3 mortales y 3 con nivel o clasificación no determinados. `tipo_grupo`, `tipo`, nivel de severidad y estado de investigación son dimensiones diferentes. [D: `eventos`]

## 1.3. Eventos por proyecto y período; acciones vinculadas

| Proyecto | 2009–2023 | 2024 | 2025 | 2026 | Eventos | Acciones |
| --- | --- | --- | --- | --- | --- | --- |
| CL · Cerro Lindo | 2 | 111 | 1 | 24 | 138 | 35 |
| TA · Tambomayo | 1 | 16 | 1 | 7 | 25 | 35 |
| OR · Orcopampa | 1 | 16 | 1 | 5 | 23 | 28 |
| EP · El Porvenir | 2 | 0 | 0 | 10 | 12 | 43 |
| SM · Santa María (Poderosa) | 1 | 10 | 0 | 0 | 11 | 0 |
| SC · San Cristóbal | 4 | 0 | 0 | 1 | 5 | 5 |
| RO · Romina | 0 | 1 | 0 | 2 | 3 | 10 |
| RA · Raura | 0 | 1 | 0 | 1 | 2 | 2 |
| UC · Uchucchacua | 0 | 0 | 0 | 2 | 2 | 5 |
| CA · Carahuacra | 2 | 0 | 0 | 0 | 2 | 0 |
| AN · Andaychagua | 1 | 0 | 0 | 0 | 1 | 0 |
| AT · Atacocha | 1 | 0 | 0 | 0 | 1 | 5 |
| **Total** | 15 | 155 | 3 | 52 | 225 | 168 |

Cada acción se cuenta una vez por `id` y se atribuye al proyecto de origen. Una acción con alcance «Todos los proyectos» no se multiplica por 12: su cobertura de implementación se muestra por separado. Cero filas vinculadas no acredita ausencia de hechos u obligaciones. [D: `eventos`, `acciones`, `proyectos`]

## 1.4. Acciones por estado verificado

**Corte documental: 07/10/2026. Denominador: 168 acciones.**

| Estado verificado | Acciones | % de 168 |
| --- | --- | --- |
| Cerrada con evidencia | 3 | 1.79% |
| Declarada cerrada sin evidencia | 13 | 7.74% |
| Abierta | 14 | 8.33% |
| Vencida | 11 | 6.55% |
| Sin información | 127 | 75.60% |
| **Total** | 168 | 100.00% |

El indicador narrativo es **1.8% = 3/168**, redondeado a un decimal. La suma de las cinco filas redondeadas a dos decimales es 100.01%; el total exacto es 100%.

**Corrección necesaria al diagnóstico del brief:** hay 127 acciones «Sin información», pero son **123/168 (73.21%)** las que tienen simultáneamente responsable, fecha compromiso y estado declarado nulos. Dentro de las 127 «Sin información», 120 presentan esos tres nulos y 7 tienen texto en responsable; 3 de esos textos dicen «No consta». No se repetirá como hecho que las 127 carecen simultáneamente de los tres campos.

Solo cuatro acciones contienen códigos en `evidencias`: **AC-143, AC-145, AC-146 y AC-165**. Esta última está abierta. AC-145 y AC-146 figuran como «Cerrada con evidencia», pero sus observaciones reconocen **alcance parcial**. Los códigos EVD no contienen archivos binarios ni validador/fecha estructurados. [D: `acciones`; B: secciones 1 y 4]

**Decisión de diseño:** conservar 3/168 como **«Cierre según corte documental; 2 acciones con cobertura parcial»**. Separar ese estado importado de una evaluación operativa de suficiencia. No cambiar silenciosamente el JSON a 1/168 ni presentar el 1.8% como cumplimiento integral auditado.

## 1.5. Campos con más nulos y otras ausencias

### Eventos: nulos literales

| Campo de eventos | Nulos / 225 | % |
| --- | --- | --- |
| fecha_texto | 224 | 99.56% |
| dias_perdidos | 219 | 97.33% |
| estado | 218 | 96.89% |
| causas_basicas | 214 | 95.11% |
| causas_inmediatas | 206 | 91.56% |
| severidad_texto | 203 | 90.22% |
| observaciones | 192 | 85.33% |
| zona_cuerpo | 184 | 81.78% |
| hora | 174 | 77.33% |
| costo | 80 | 35.56% |
| costo_texto | 80 | 35.56% |
| penalidad | 72 | 32.00% |
| equipo | 63 | 28.00% |
| pg_cliente | 55 | 24.44% |
| riesgo_critico | 45 | 20.00% |
| nivel_incimmet | 43 | 19.11% |
| pg_incimmet | 40 | 17.78% |
| nivel_cliente | 38 | 16.89% |
| puesto_rol | 29 | 12.89% |
| area | 20 | 8.89% |
| actividad | 11 | 4.89% |
| fecha | 1 | 0.44% |
| mes | 1 | 0.44% |

`fecha_texto` y `severidad_texto` son auxiliares: su ausencia no necesariamente es una brecha. `zona_cuerpo` solo es pertinente cuando hay una persona afectada; no se exigirá para todo evento. Los restantes campos de eventos no tienen nulos literales.

### Acciones: nulos literales

| Campo de acciones | Nulos / 168 | % |
| --- | --- | --- |
| fecha_compromiso | 155 | 92.26% |
| responsable_rol | 151 | 89.88% |
| estado_declarado | 143 | 85.12% |
| fecha_estado_declarado | 143 | 85.12% |
| observaciones | 137 | 81.55% |

En **164/168 acciones (97.62%)**, `evidencias` es una lista vacía, no un nulo. No confundir lista vacía, referencia documental y archivo validado.

### Lecciones, proyectos e indicadores

| Campo / entidad | Ausencia | Tratamiento |
| --- | --- | --- |
| Lecciones, campos de primer nivel | 0 nulos | No acredita revisión o publicación formal. |
| `controles.sustitucion` | 16/22; 72.73% | «No consta». |
| `controles.epp` | 14/22; 63.64% | «No consta». |
| `controles.eliminacion` | 10/22; 45.45% | «No consta». |
| `controles.ingenieria` | 1/22; 4.55% | «No consta». |
| `controles.administrativos` | 0/22 | Presencia de texto, no eficacia demostrada. |
| Proyecto: `meta_trifr_2026` | 7/12; 58.33% | No inventar una meta común. |
| Anuales: `costo_propiedad_usd` | Clave ausente en 35/40 | Ausencia estructural, no cero. |
| Anuales: `eventos_investigados` | Clave ausente en 9/40 | No equivale a cero investigados. |
| Anuales: `if`, `is`, `ia` | Cada clave ausente en 6/40 | No rellenar el oficial con un recálculo. |
| Anuales: `dias_perdidos` | Clave ausente en 3/40 | «No consta». |
| Registros oficiales: `valor` | 3 textos «No consta» / 591 | No convertirlos a número. |

Hay **22 eventos con algún texto causal**: 19 con inmediatas, 11 con básicas y 8 con ambos campos. Sin embargo, un texto de causas inmediatas y siete de causas básicas comienzan con «No consta»; otros señalan inferencias. **Texto presente no significa causa confirmada ni investigación concluida.**

Cobertura adicional: 26/225 eventos tienen acciones vinculadas; 47/225 tienen lecciones; 179/225 tienen nivel INCIMMET y PG simultáneamente. Se muestran **189 días perdidos consignados en 6 eventos**, con 219 sin dato, nunca «189 días perdidos totales de la empresa». [D: completitud de entidades]

## 1.6. Rango de fechas y cobertura

| Dato | Resultado |
| --- | --- |
| Fecha mínima de evento | 29/12/2009 |
| Fecha máxima de evento | 30/09/2026 |
| Eventos con fecha exacta | 224/225 |
| Evento sin fecha exacta | EV-2023-001; año 2023, anterior al 17/08/2023 según `fecha_texto` |
| Generación / corte de estados | 07/10/2026 |
| Fechas compromiso disponibles | 13; desde 25/08/2023 hasta 30/10/2026 |
| Fecha de declaración disponible | 04/03/2026 en las 25 acciones que la tienen |
| Indicadores anuales por ámbito | 40 registros, 2022–2025 |
| Metas / acumulados móviles | 13 metas de 2026; 4 registros de doce meses a febrero de 2026 |
| Otros registros oficiales | 591 filas, períodos y ámbitos heterogéneos |
| Resúmenes semanales Power BI | 14 bloques de 2024/2026; no son las filas semanales originales |

Las fechas exactas concuerdan con `anio` y `mes`. EV-2023-001 entra en el filtro anual 2023, pero se separa como «Mes no consta» en la tendencia mensual. No asignarle enero ni la fecha límite del acta. [D: fechas y colecciones de `indicadores`]

## 1.7. Inconsistencias relevantes para el diseño

| Hallazgo | Consecuencia funcional |
| --- | --- |
| El banner dice «2025 sin detalle», pero existen tres registros recuperados. | Mantener la advertencia original y añadir «3 registros; cobertura no exhaustiva». No sumar las tres filas a los agregados oficiales. |
| «2009–2023: solo eventos graves» tiene una excepción: EV-2023-003 es leve. | Advertir que no es un censo homogéneo; no construir tendencias comparables sin salvedades. |
| La advertencia llega a octubre de 2026; el último evento es de septiembre y hay fuentes PAI/comité. | Mostrar rango real, corte documental y clase de fuente por separado. Octubre no tiene eventos en el archivo. |
| 218 eventos no tienen `estado`; los otros siete son variantes de investigación. | «Estado de origen: No consta». No asumir abiertos, investigados o cerrados. |
| Tres cierres importados, dos de cobertura parcial y sin validadores estructurados. | Separar estado importado, cobertura de evidencia y elegibilidad de cierre operativo. |
| 127 «Sin información» frente a 123 triples nulos. | Etiquetar cada indicador con su definición y denominador. |
| Fusiones previas documentadas en EV-2024-056, 081, 119 y EV-2026-014; duplicaciones en origen de AC-021/022. | Mantener 225/168. No volver a deduplicar por fecha/proyecto. No se detectan IDs ni descripciones de evento exactamente repetidos; esto no descarta duplicación semántica. |
| Seis eventos tienen `alto_potencial=true`; solo cuatro son del tipo «Incidente peligroso / HPRI». | KPI HPRI basado en la bandera. Los otros dos son accidente leve y daño a la propiedad. |
| Cuatro eventos con `pg_incimmet=V` tienen bandera de alto potencial falsa. | Señalar para revisión, sin cambiar el valor ni afirmar potencial bajo. |
| `acc_nv5_6` reúne mortalidad e incapacidad permanente. | Rotular «Mortales / incapacidad permanente, Nv V–VI». Contar mortales del detalle mediante `tipo`, no esta categoría agregada. |
| 33 textos distintos de riesgo, 101 de actividad y 61 de equipo; variantes ortográficas. | Mantener originales; búsqueda tolerante a acentos/mayúsculas. Agrupación semántica solo con diccionario aprobado y reversible. |
| Cinco eventos tienen cliente distinto en texto al maestro del proyecto. | Filtro inicial «Cliente según evento»; mostrar el maestro en ficha. No fusionar denominaciones históricas silenciosamente. |
| Clasificaciones de cliente incluyen «l»; algunas zonas corporales son listas. | No convertir automáticamente «l» a I ni listas históricas en nuevas categorías. |
| `catalogos` no incluye catálogo formal de riesgos, actividades o roles. | Opciones observadas para la demo, claramente distintas de un catálogo corporativo aprobado. |
| Costos/penalidades carecen de moneda estructurada; algunas causas/jerarquías son inferidas. | No sumar importes como USD ni tratar clasificación asistida como conclusión técnica aprobada. |

**Discrepancias entre versiones oficiales:** Perú 2025, `anual_por_ambito`: TRIFR **7.0358**, IS **317.42**, IA **0.859**. El bloque «Total Perú (cuadro Meta 2026)» de `registros_oficiales` registra **4.597**, **322.08** y **0.871**, respectivamente. Se muestran ambas fuentes y versiones; no se promedian, sustituyen ni eligen por el menor valor. Las referencias móviles de doce meses tampoco se confunden con metas anuales 2026.

**Limitaciones del material:** fuentes y evidencias son códigos, no documentos adjuntos. No hay coordenadas, contratos, usuarios autenticados, historial de transiciones ni fechas de publicación. Los ámbitos de indicadores incluyen operaciones fuera de los 12 proyectos. Chungar tiene meta, pero no aparece en `proyectos`. No inventar proyectos, mapas geográficos ni enlaces a archivos. [D: `indicadores`, `documentos_fuente`, observaciones y metadatos]

---

# 2. Arquitectura de información y navegación por rol

## 2.1. Mapa del sitio

```text
INCIMMET
├── Presentación cinemática                         /
├── Dashboard ejecutivo                            /dashboard
├── Análisis avanzado                              /analisis
│   ├── Tendencias y Pareto
│   ├── Severidad y alto potencial
│   ├── Indicadores / metas / versiones
│   ├── Cumplimiento de acciones
│   └── Calidad de datos
├── Eventos                                        /eventos
│   └── Ficha / investigación / acciones / fuentes   /eventos/[id]
├── Acciones · lista / kanban / evidencia            /acciones
├── Lecciones · búsqueda / ficha / difusión          /lecciones
├── Campo · PWA                                    /campo
│   ├── Nuevo reporte · 4 pasos
│   ├── Mis reportes y borradores
│   ├── Mis acciones
│   ├── Lecciones por riesgo
│   └── Cola local y sincronización de demo
├── Catálogos · lectura                            /configuracion/catalogos
└── Privacidad y tratamiento de datos              /privacidad
```

Cabecera persistente: wordmark INCIMMET, selector de rol, proyecto/contexto, tema, fecha de corte y distintivo **«DEMO · datos locales»**. Escritorio: lateral y migas. Móvil: **Inicio, Reportar, Acciones, Lecciones, Cola**. La presentación no bloquea acceso directo al trabajo operativo.

## 2.2. Capacidades por rol

| Módulo / operación | Gerencia | SSOMA corporativo | Supervisor de campo |
| --- | --- | --- | --- |
| Inicio | Dashboard; presentación disponible | Análisis y seguimiento | Campo |
| Dashboard / indicadores | Lectura ejecutiva | Lectura completa | Resumen del proyecto |
| Análisis avanzado | Tendencias/indicadores en lectura | Todas las pestañas, incluida calidad | Oculto |
| Eventos | Lectura y fuentes | Investigar, clasificar, gestionar el ciclo | Crear reportes y consultar los de su contexto |
| Acciones | Consultar cumplimiento | Definir, asignar por rol, revisar y validar | Consultar por rol/proyecto y adjuntar evidencia |
| Cerrar evento | No | Sí, sujeto a reglas | No |
| Lecciones | Consultar y difundir | Elaborar, revisar, publicar y difundir | Consultar por riesgo y difundir |
| Catálogos | Oculto | Consulta; edición futura | Opciones del formulario |
| Privacidad | Disponible | Disponible | Disponible offline tras preparación |

**Propuesta:** gerencia general ve todos los proyectos; gerencia de proyecto utiliza contexto seleccionado. «Mis acciones» requiere proyecto y función responsable, porque no hay usuarios autenticados. Acciones sin responsable van a «Pendientes de asignación», no al supervisor por defecto. «No consta» no es una identidad.

El selector simula capacidades de interfaz, **no controles de seguridad**. Autenticación, permisos reales por usuario/proyecto y RLS pertenecen al backend futuro. Ocultar menús no protege un JSON público. [B: secciones 2, 5 y 7]

## 2.3. Capas funcionales y conservación del origen

**Presentación → consultas/filtros → dominio → DataSource → origen.**

`StaticJsonDataSource` combina lectura inmutable del JSON con cambios locales de IndexedDB cuando se solicite. Las pantallas consumen el contrato `DataSource`, no archivos directamente. `SupabaseDataSource` sustituirá el adaptador en el futuro. El contrato sugerido debe ampliarse con investigación, validación, publicación e historial, requeridos por el flujo del brief.

El modelo de lectura conserva valores originales, fuente y banderas de calidad. Cambios locales registran identificador, transición, rol actuante, fecha real y evidencias. No se rellenan retrospectivamente estos campos en los registros históricos.

Tres contextos visibles: **Base documental**, **Base + cambios locales** y **Reproducción 2026**. La base restablecida conserva 225 eventos, 168 acciones, 22 lecciones y 12 proyectos. Reiniciar cambios locales requiere confirmar el borrado de borradores, operaciones y adjuntos.

**Stack fijado por el brief para los pasos de implementación:** Next.js 14+ App Router, TypeScript estricto, Tailwind y shadcn/ui–Radix; ECharts; Zustand para filtros/URL y TanStack Query sobre DataSource; Three.js con react-three-fiber/drei, diferido; IndexedDB y service worker para PWA; adaptador futuro Supabase/Postgres. La versión concreta y compatibilidad se comprobarán antes de implementar, sin introducir dependencias nuevas en este paso. [B: sección 7]

## 2.4. Contrato de filtros cruzados

Año, mes, proyecto, cliente, tipo, grupo, riesgo, alto potencial y empresa filtran eventos. Acciones y lecciones se obtienen mediante sus vínculos, contando IDs únicos. En acciones, año/mes refiere al evento de origen; **Fecha compromiso** es otro filtro rotulado.

Dentro de una dimensión se combina con **O**; entre dimensiones con **Y**. Clic selecciona, segundo clic retira; hay multiselección visible para teclado y táctil. Los chips muestran criterios y permiten limpiar. La URL conserva filtros; volver desde una ficha restaura orden, búsqueda, página y selección.

Seleccionar estado de acciones filtra acciones y eventos relacionados. El KPI de cierre muestra además la **cohorte anterior al filtro de estado**, con numerador/denominador, para no convertir engañosamente 3/168 en «100% de cumplimiento» al elegir solo cerradas.

Los indicadores oficiales admiten únicamente períodos y ámbitos disponibles. Un filtro no soportado produce **«No desagregable por este filtro»** con el contexto que sí aplica. No se simula IF por riesgo/equipo, no se suman tasas y no se mezclan totales con proyectos. Ventanas móviles y metas tienen selectores y fuentes independientes.

---

# 3. Flujos de usuario y reglas del ciclo

## 3.1. Gerente: revisar tendencia y cumplimiento

1. Entra al dashboard o a la presentación; selecciona Gerencia y ámbito. Identifica la demo, el corte y las advertencias.
2. Revisa la base sin filtros: 225 eventos, 168 acciones y cierre importado 1.8%; abre la nota sobre evidencia parcial.
3. Selecciona 2024 en la tendencia: el detalle muestra 155 registros; gráficos y tabla comparten selección.
4. Selecciona un proyecto y examina tipo, severidad y acciones. Se advierte que volumen documental no equivale a tasa ajustada por exposición.
5. Abre indicadores oficiales, Perú / 2024: IF 2.7098, IS 283.92 e IA 0.7694; las tarjetas redondeadas permiten ver originales y fuente.
6. Consulta 2025 y doce meses a febrero de 2026 sin mezclarlos con resultados anuales 2026. «Comparar versiones» conserva valores discrepantes.
7. Selecciona Vencida o Sin información, abre acciones y revisa plazo, rol, evidencia y alcance; no modifica cierres.
8. Exporta detalle filtrado a CSV con contexto y corte. El archivo no se denomina reporte oficial de indicadores.

## 3.2. Analista SSOMA: investigar, verificar y publicar

1. Filtra alto potencial y abre **EV-2026-022**, Uchucchacua, 17/03/2026: HPRI, cinco acciones, LA-014.
2. Revisa descripción, clasificaciones cliente/INCIMMET, observaciones y fuentes. Las discrepancias entre alerta/PBIX permanecen visibles.
3. Inicia o continúa investigación en la capa local. Registra causas inmediatas y básicas, procedencia y revisión; no convierte inferencias en conclusiones.
4. Define/completa acciones con descripción, jerarquía, alcance, rol y compromiso. Cambiar un plazo conserva anterior y motivo.
5. Revisa evidencia: referencias históricas son metadatos; archivos locales ofrecen vista previa. Adjuntar no cierra automáticamente.
6. El validador acepta o rechaza con motivo, rol y fecha. Se calcula el estado a partir de evidencia pertinente y suficiente. Un cierre importado no se hace pasar por validación local.
7. Solicita cierre: el sistema enumera bloqueos. Investigación requerida y todas las acciones deben cumplir reglas, incluida cobertura de alcance. Lista vacía no implica aprobación automática.
8. Consulta LA-014 para evitar duplicados; prepara una revisión o nueva lección justificada: qué pasó, por qué, aprendizaje, controles, aplicabilidad y eventos origen.
9. Revisa privacidad y publica cuando se cumplan las puertas. Se registra versión/rol/fecha. «Difundir» produce posteriormente una pieza PDF o imagen de charla, con fuentes y condición de demo; no acredita entrega, lectura ni capacitación.

Este es el flujo propuesto; no se han completado investigaciones ni validado evidencias durante el diseño.

## 3.3. Supervisor: reporte offline y evidencia

1. Con conexión previa prepara la PWA: interfaz, catálogos, contexto, acciones y lecciones disponibles offline. La primera visita sin recursos descargados no queda cubierta.
2. Sin señal en la mina, abre Reportar. La franja «Sin conexión» permanece; el reporte no sustituye canales operativos de emergencia.
3. Completa los cuatro pasos de la sección 4.7. El borrador se guarda después de cada paso. Fotos son opcionales; cámara/dictado denegados tienen alternativa manual.
4. Confirma: identificador local estable y mensaje **«Guardado en este dispositivo · Pendiente de envío»**. No «Recibido por SSOMA».
5. Al recuperar conexión, cola automática o Reintentar. Una operación idempotente no duplica el evento; errores conservan texto y archivos.
6. Sin backend, el resultado se llama **«Registrado en la demo local»**. No hay envío real ni sincronización entre dispositivos; el adaptador futuro aportará un acuse de servidor.
7. En Mis acciones, selecciona una del rol/proyecto y adjunta archivo/foto. Comprueba vista previa y ausencia de datos personales.
8. La evidencia puede guardarse offline y queda pendiente de validación. No puede cerrar ni autovalidar. SSOMA revisa en la misma demo/navegador o, en el futuro, mediante backend.

## 3.4. Estados y puertas

**Reportado → En investigación → Investigado → Acciones definidas → En seguimiento → Cerrado → Lección publicada.**

| Transición | Condición de avance propuesta |
| --- | --- |
| Reportado → En investigación | Reporte mínimo válido y revisión asignada; conservar clasificación provisional. |
| En investigación → Investigado | Causas inmediatas y básicas documentadas y revisadas. «No consta» o inferencias no satisfacen la puerta. |
| Investigado → Acciones definidas | Acciones descritas y vinculadas, con rol, plazo, jerarquía y alcance. |
| Acciones definidas → En seguimiento | Plan confirmado y seguimiento registrado. |
| En seguimiento → Cerrado | Todas las acciones con evidencia validada y alcance suficiente; revisión final. Sin acciones, se requiere resolución SSOMA explícita, no aprobación por lista vacía. |
| Cerrado → Lección publicada | Lección revisada, vinculada y publicada; exigida para HPRI, incapacitantes y mortales. |

`Evento.estado` del brief termina en Cerrado. **Lección publicada será un hito derivado** de la publicación de una lección, no un enum incompatible agregado sin migración. Las 22 lecciones importadas se presentan como **catalogadas**: el JSON no acredita fecha/proceso de publicación.

**Precedencia de acción:** evidencia validada y suficiente → Cerrada con evidencia; declarada cerrada sin ella → Declarada cerrada sin evidencia; compromiso pasado → Vencida; compromiso vigente o declaración en proceso → Abierta; datos insuficientes → Sin información. Vence hoy sigue abierta hasta terminar el día en America/Lima, con aviso «Vence hoy».

La declaración original se conserva. No basta buscar «proceso»: existen textos «Realizada (estado global: En proceso 80%)». Una declarada cerrada con plazo vencido conserva su categoría por precedencia y añade aviso de compromiso vencido. El estado no se escribe a mano ni se cambia arrastrando tarjetas.

Los cambios nuevos se calculan con su fecha de referencia; la base conserva el corte 07/10/2026. Recalcular un estado histórico exige historial suficiente: no basta cambiar la fecha del sistema. [B: secciones 3–5; D: estados, observaciones y evidencias]

---

# 4. Wireframes textuales

Los números siguientes pertenecen a la base sin cambios locales, salvo filtro explícito. Los corchetes representan controles o espacios de contenido, no registros ficticios.

## 4.1. Presentación cinemática: ocho escenas de scroll

| Escena / scroll | Qué se ve en 3D | Dato o mensaje en HTML accesible | Transición |
| --- | --- | --- | --- |
| 1 · 0–12.5% | Entrada a galería procedural, malla/pernos, cables y luz de casco; sin personas identificables ni localización real. | **INCIMMET** · «Hagamos el camino juntos» · Gestión de incidentes SSOMA. | Fundido desde marino y avance corto. Omitir siempre visible. |
| 2 · 12.5–25% | Recorrido por galería con hitos luminosos temporales. | **225 eventos analizados · 2009–2026**. «Cobertura documental desigual». | Contador al entrar; recorrido sin aceleración brusca. |
| 3 · 25–37.5% | Ensanchamiento con doce paneles esquemáticos de proyectos, no mapa geográfico. | **12 proyectos**; CL 138, TA 25 y OR 23 como ejemplos. | Paneles secuenciales, foco en lectura. |
| 4 · 37.5–50% | Cámara detenida ante panel técnico integrado en la galería. | **Perú 2024 · IF 2.71 · IS 283.92 · IA 0.769**. Fuente y valores originales accesibles. | Atenuar fondo; cifras con ámbito y año inseparables. |
| 5 · 50–62.5% | Haz de inspección sobre sostenimiento/equipos estilizados; no recreación de accidentes. | **6 eventos marcados como alto potencial**. «Bandera HPRI del detalle». | Encuadre leve y marcador ámbar, sin destellos. |
| 6 · 62.5–75% | Panel de seguimiento con marcas de acciones; cifras fuera del canvas. | **Solo 1.8% con cierre verificado según corte · 3/168**. «2 de las 3 con evidencia de alcance parcial». | Detener avance para leer; enlace a Calidad de datos. |
| 7 · 75–87.5% | Un cable luminoso conecta estaciones abstractas de gestión. | **La plataforma**: reporte → investigación → acciones → evidencia → cierre → lección. «Flujo propuesto, no mejora medida». | Conexión progresiva y movimiento moderado. |
| 8 · 87.5–100% | Espacio de reunión subterráneo estilizado; cámara estable. | **22 lecciones catalogadas**. «Explorar dashboard» y acceso secundario «Reportar en campo». | Salida del canvas a la interfaz, sin recargar datos ni reiniciar filtros. |

```text
┌──────────────────────────────────────────────────────────────────┐
│ [INCIMMET sobre placa clara]             [Omitir] [Movimiento: sí]│
│                                                                  │
│               [GALERÍA 3D PROCEDURAL / FALLBACK 2D]                │
│                                                                  │
│     [Título de escena]                                           │
│     [Cifra + período + ámbito]                                   │
│     [Fuente / advertencia de cobertura]                          │
│                                                                  │
│ [Anterior]              Escena n de 8              [Siguiente]   │
│                       [Explorar dashboard]                        │
└──────────────────────────────────────────────────────────────────┘
```

**Fallback equivalente:** ocho bloques 2D con ilustración propia/gradientes y los mismos mensajes, fuentes y CTA. Sin WebGL, con movimiento reducido o modo de bajo consumo: no recorrido de cámara, parallax, partículas ni contadores incrementales. El contenido está en HTML, no exclusivamente en el canvas. Scroll, teclado y acceso directo nunca quedan bloqueados. Tono sobrio y técnico, no estética de videojuego. [B: secciones 3, 8 y 9]

## 4.2. Dashboard ejecutivo

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ INCIMMET   Dashboard     [Rol: Gerencia] [Ámbito] [Tema] [DEMO LOCAL]      │
├─────────────┬────────────────────────────────────────────────────────────┤
│ Dashboard   │ Base documental · Corte 07/10/2026 · 168 acciones          │
│ Análisis    │ [Advertencias: cobertura / evidencia parcial] [Ver más]   │
│ Eventos     │ [Año] [Mes] [Proyecto] [Cliente] [Tipo] [Grupo]            │
│ Acciones    │ [Riesgo] [HPRI] [Empresa] [Chips activos] [Limpiar]        │
│ Lecciones   ├────────────────────────────────────────────────────────────┤
│ Privacidad  │ 225 eventos │ 55 accidentes │ 6 con bandera HPRI          │
│             │ 189 DP*     │ 1.8% cierre** │ 11 acciones vencidas        │
│             │ * Solo 6/225 con dato. ** 3/168; 2 con alcance parcial.   │
│             ├───────────────────────────┬────────────────────────────────┤
│             │ Tendencia por grupo/tipo │ Eventos por proyecto          │
│             │ [Gráfico + tabla]        │ [Barras + tabla]              │
│             ├───────────────────────────┼────────────────────────────────┤
│             │ Accidentes por nivel     │ Acciones por estado verificado│
│             │ Incluye «No consta»      │ [Barras + tabla]              │
│             ├───────────────────────────┴────────────────────────────────┤
│             │ Oficiales [Año: 2024] [Ámbito: Perú] [Fuente]              │
│             │ IF 2.71 · IS 283.92 · IA 0.769 · [Ver originales]         │
│             │ [Tabla de eventos filtrados] [Exportar CSV]              │
│             │ [Simular tiempo real: reproducción histórica 2026]       │
└─────────────┴────────────────────────────────────────────────────────────┘
```

Móvil: panel de filtros desplegable, tarjetas en dos columnas si caben, gráficos en una. Seleccionar un KPI abre su detalle. El nivel de un daño material no se cuenta como accidente leve a una persona; los niveles del KPI accidentes se limitan al grupo Accidente.

**Simulación:** reutilizar IDs de los 52 eventos de 2026 en orden cronológico. «Reproducción de datos históricos», con pausa y reinicio. No añadir 52 eventos nuevos a los 225. La revelación progresiva usa contexto separado; salir devuelve la base completa. No presentar «En vivo» sin aclarar que es simulado.

## 4.3. Análisis avanzado

```text
┌──────────────────────────────────────────────────────────────────┐
│ Análisis avanzado        [Filtros globales] [Guardar URL de vista]│
│ [Tendencias] [Pareto] [Severidad/HPRI] [Indicadores] [Cumplimiento]│
│ [Calidad de datos]                                                │
├──────────────────────────────────────────────────────────────────┤
│ Contexto: [período / proyectos / cobertura / n de eventos]        │
│ [Tendencia mensual/anual]       [Pareto: dimensión elegible]      │
│ [Tabla accesible]              [Frecuencia + % acumulado]        │
├──────────────────────────────────────────────────────────────────┤
│ [Proyecto × mes]                  [Nivel INCIMMET × PG]          │
│ Sin registros ≠ cero hechos       [Fuera: No consta]             │
├──────────────────────────────────────────────────────────────────┤
│ Indicadores: [Período] [Ámbito] [Versión] [Meta comparable]       │
│ Calidad: [Nulos] [Vacíos] [No consta textual] [Claves ausentes]   │
│ [Filas de la selección] [Fuente] [Exportar detalle]               │
└──────────────────────────────────────────────────────────────────┘
```

Cargar prioritariamente la pestaña activa. La matriz es **severidad observada × potencial**, no probabilidad × consecuencia; los colores muestran frecuencia, no aceptabilidad del riesgo. Causas muestran cobertura y condición documental, sin convertir inferencias en categorías confirmadas.

## 4.4. Ficha de evento

```text
┌──────────────────────────────────────────────────────────────────┐
│ [← Resultados] EV-2026-022 · Uchucchacua · 17/03/2026             │
│ Incidente peligroso / HPRI · Confianza: Alta, 2+ fuentes          │
│ Origen: En investigación           [Fuentes con discrepancias]  │
├──────────────────────────────────────────────────────────────────┤
│ [Resumen] [Investigación] [Acciones 5] [Lecciones 1] [Fuentes]    │
│ Descripción [original]                                          │
│ Labor / actividad / equipo / empresa / rol y zona corporal       │
│ INCIMMET: nivel 0 · PG V        Cliente: nivel 0 · PG III        │
│ Inmediatas: [texto]             Básicas: No consta               │
├──────────────────────────────────────────────────────────────────┤
│ Ciclo de gestión                                                │
│ Fecha del evento: 17/03/2026                                     │
│ Reporte [fecha no consta] → Investigación [fecha no consta]     │
│ → Acciones → Seguimiento → Cierre → Lección                      │
│ [Sin fechas de transición inferidas]                            │
├──────────────────────────────────────────────────────────────────┤
│ AC-139 ... AC-143 [Estado importado / evidencia / alcance]       │
│ LA-014 [Consultar]                                              │
│ DOC-PBI-01 · DOC-ALR-08 [Metadatos; archivos no adjuntos]        │
│ [Guardar investigación local] [Solicitar cierre: ver bloqueos]  │
└──────────────────────────────────────────────────────────────────┘
```

Edición solo para SSOMA. Fecha del evento, carga y transición son conceptos separados. Referencias documentales abren descripción/ubicación, no enlaces inexistentes. Las categorías, fuentes y observaciones originales permanecen consultables tras una propuesta de reclasificación local.

## 4.5. Registro de acciones: lista y kanban

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ Acciones · 168  [Lista | Kanban] [Proyecto] [Evento] [Jerarquía] [Rol]   │
│ [Estado verificado] [Compromiso] [Alcance] [Advertencias] [Limpiar]      │
├────────┬──────┬────────────────────────────┬────────────┬────────────────┤
│ ID     │ Proy │ Estado según corte         │ Compromiso │ Evidencia      │
│ AC-143 │ UC   │ Cerrada con evidencia      │ No consta  │ EVD-05         │
│ AC-145 │ EP   │ Cerrada; alcance parcial   │ No consta  │ 3 referencias  │
│ AC-165 │ EP   │ Abierta                    │ 20/10/2026 │ 4 refs., parcial│
│ AC-166 │ EP   │ Vencida                    │ 22/09/2026 │ Sin referencias│
├────────┴──────┴────────────────────────────┴────────────┴────────────────┤
│ [Abrir: descripción / alcance / fuente / responsable / historial]     │
│ [Adjuntar archivo local] [Ver validaciones] [Validar: solo SSOMA]      │
└─────────────────────────────────────────────────────────────────────────┘
```

```text
KANBAN · estado calculado · no cambiar estado por arrastre
┌──────────────┬─────────────────┬────────────┬───────────┬───────────────┐
│ Cerrada con  │ Declarada sin   │ Abierta    │ Vencida   │ Sin           │
│ evidencia: 3 │ evidencia: 13   │ 14         │ 11        │ información127│
├──────────────┼─────────────────┼────────────┼───────────┼───────────────┤
│ AC-143       │ [Tarjetas]      │ AC-165     │ AC-166    │ [Tarjetas]    │
│ AC-145 [!]   │                 │ [Plazo/rol]│ [Días]    │ [Completar]   │
│ AC-146 [!]   │                 │            │           │               │
└──────────────┴─────────────────┴────────────┴───────────┴───────────────┘
[!] La advertencia no modifica silenciosamente el estado importado.
```

En móvil, pestañas de estado con contador, no cinco columnas diminutas. Evidencia separa referencia importada, archivo local, validación y alcance cubierto. Rechazar exige motivo; aceptar exige archivo pertinente, rol validador, fecha y suficiencia para la acción. Todo cambio conserva historial.

## 4.6. Biblioteca de lecciones

```text
┌──────────────────────────────────────────────────────────────────┐
│ Lecciones · 22 catalogadas       [Buscar: voladura, malla...]      │
│ [Riesgo crítico] [Actividad] [Proyecto origen] [Aplicabilidad]    │
├────────────────────────────┬─────────────────────────────────────┤
│ [Tarjetas de resultados]   │ LA-014 · Contacto con energía       │
│ [Riesgo / actividad]       │ Qué pasó: [texto de fuente]         │
│ [Evento(s) de origen]      │ Por qué: [texto y salvedades]       │
│ [Aprendizaje]              │ Lección: [texto]                    │
│                           │ Controles por jerarquía:            │
│                           │ Eliminación [texto]                 │
│                           │ Sustitución: No consta              │
│                           │ Ingeniería [texto]                  │
│                           │ Administrativos [texto]             │
│                           │ EPP [clasificación importada]       │
│                           │ Aplicabilidad: Todos los proyectos  │
│                           │ EV-2026-022 [Abrir]                  │
│                           │ [Fuentes] [Revisar] [Difundir mock] │
└────────────────────────────┴─────────────────────────────────────┘
```

Búsqueda en qué pasó, por qué, lección, controles, riesgos, actividades y códigos. Resaltar coincidencias sin alterar originales. Proyecto de origen y aplicabilidad son filtros distintos; aplicable a todos no significa evento registrado en todos. Clasificaciones asistidas se revisan antes de publicar una nueva versión. No inferir eficacia ni publicación a partir de una tarjeta.

## 4.7. Formulario PWA: cuatro pasos

### Paso 1 — Ubicación y momento

```text
┌────────────────────────────────────┐
│ INCIMMET           [Sin conexión] │
│ Reportar · Paso 1 de 4             │
│ Proyecto*      [Seleccionar]       │
│ Fecha*         [Ahora, editable]   │
│ Hora*          [Ahora, editable]   │
│ Zona: America/Lima                 │
│ Lugar / labor* [Escribir]          │
│ No escribir nombres ni DNI.        │
│ [Guardar borrador] [Continuar]     │
└────────────────────────────────────┘
```

Proyecto desde el maestro. Fecha/hora no cambian al recuperar un borrador. Advertir fechas futuras o reloj incorrecto y permitir corregir sin sobrescritura automática del hecho. No pedir GPS: no está requerido ni hay coordenadas en la base.

### Paso 2 — Qué ocurrió

```text
┌────────────────────────────────────┐
│ [Sin conexión]      Paso 2 de 4    │
│ Tipo*          [Catálogo/evaluar]  │
│ Actividad      [Seleccionar/texto] │
│ Equipo         [Seleccionar/texto] │
│ Riesgo crítico [Seleccionar]      │
│ Potencial      [Sí / No / Por     │
│                 confirmar]        │
│ Descripción*   [Texto] [Dictar]   │
│ Fotos opcionales [Cámara][Archivo]│
│ [Vista previa / retirar adjunto] │
│ [Atrás]               [Continuar]│
└────────────────────────────────────┘
```

Clasificación provisional: Por evaluar usa el tipo disponible En investigación sin reemplazar el estado de gestión Reportado. Riesgo/actividad/equipo desconocidos permanecen ausentes, no inventados. **Por confirmar** de potencial es extensión local separada, nunca `false`. Fotos opcionales; dictado solo cuando esté disponible, con ingreso manual siempre habilitado. No prometer dictado offline sin comprobar capacidad del navegador.

### Paso 3 — Persona afectada, sin identidad

```text
┌────────────────────────────────────┐
│ [Sin conexión]      Paso 3 de 4    │
│ ¿Hubo persona afectada?* [Sí][No] │
│ Si responde Sí:                    │
│ Rol*          [Función]           │
│ Zona general* [Mano / pie / ...] │
│               [Otra / No consta] │
│ [Agregar solo rol y zona]         │
│ Sin nombres, DNI, diagnósticos,    │
│ datos psicológicos ni historias   │
│ clínicas. [Privacidad]            │
│ [Atrás]               [Continuar]│
└────────────────────────────────────┘
```

No consta es respuesta explícita que conserva desconocido, no nueva zona corporal. Pasar de Sí a No requiere confirmar eliminación de los campos dependientes. No solicitar experiencia individual, identidad o resultados médicos. Revisar texto/fotos: omitir campos de nombre no garantiza anonimización. El aviso de Ley 29733 se deriva del requisito del brief; su validación jurídica para producción está pendiente. [B: secciones 3 y 9]

### Paso 4 — Acciones inmediatas y revisión

```text
┌────────────────────────────────────┐
│ [Sin conexión]      Paso 4 de 4    │
│ Acciones inmediatas* [Describir]  │
│ [No consta: explicar brecha]       │
│ Resumen: ubicación / momento /     │
│ suceso / rol-zona / adjuntos        │
│ [Editar cada sección]              │
│ [ ] Revisé que no incluya datos    │
│     personales prohibidos.         │
│ [Privacidad y tratamiento]        │
│ [Atrás] [Guardar reporte]         │
├────────────────────────────────────┤
│ Tras guardar:                      │
│ «Guardado en este dispositivo.     │
│  Pendiente de envío»               │
│ [Ver cola] [Nuevo reporte]         │
└────────────────────────────────────┘
```

Guardar el relato no acredita ejecución o verificación de acciones inmediatas. Convertirlas en seguimiento exige revisión y definición de rol, plazo y alcance.

**Estados comunes:** carga con espacio reservado; error con reintento; cero resultados con Limpiar filtros; No consta; borrador recuperado; evidencia pendiente/rechazada/validada; almacenamiento insuficiente; conflicto. Cola: borrador, pendiente, procesando, registrado en demo local, error. Si falla almacenamiento, no mostrar éxito. El borrado local advierte la pérdida de borradores y adjuntos no enviados.

---

# 5. Sistema de diseño

## 5.1. Identidad y tokens

Los colores corporativos se conservan; las superficies adicionales son propuestas de interfaz. [B: sección 8]

| Token | Valor | Uso |
| --- | --- | --- |
| Marino corporativo | `#151F44` | INCIMMET, cabecera y presentación oscura. |
| Acento INCIMMET | `#1D7DCC` | Lema, selección y resaltados. |
| Azul profundo | `#002060` | Fondos secundarios y énfasis. |
| Azul medio | `#0070C0` | CTA y enlaces sobre blanco. |
| Cian | `#00B0F0` | Series y resaltados, no texto pequeño sobre blanco. |
| Superficie clara | `#FFFFFF` | Tarjetas y formularios. |
| Neutro corporativo | `#E7E6E6` | Divisores y superficies secundarias. |
| Texto principal / fondo oscuro | `#0F172A` | Texto en claro; fondo del modo oscuro. |
| Fondo claro adicional | `#F8FAFC` | Fondo de aplicación. |
| Texto secundario | `#475569` | Metadatos sobre claro. |
| Tarjeta oscura adicional | `#1E293B` | Superficies oscuras. |
| Texto en oscuro | `#FFFFFF` / `#E7E6E6` | Jerarquía de lectura. |
| Foco | `#0070C0` claro / `#00B0F0` oscuro | Contorno 2 px y separación visible. |

**Placeholder:** INCIMMET tipográfico en marino y lema en azul de acento. Sobre oscuro, placa clara. No inventar isotipo ni descargar un logo. Área de respeto propuesta: al menos media altura del wordmark.

| Familia de tokens | Propuesta |
| --- | --- |
| Fuente | Inter; reserva system-ui, Arial, sans-serif. Números tabulares en KPIs/tablas. |
| Tamaños | Cuerpo 16/24 px; tablas/metadatos 14/20; H3 20/28; H2 28/36; H1 36/44; cifras narrativas 48–80 según ancho. |
| Pesos | 400 lectura, 500 controles, 600 subtítulos, 700 titulares/KPIs. |
| Espaciado | Base 4 px: 4, 8, 12, 16, 24, 32, 48, 64. |
| Radios | Controles 6 px; tarjetas 12; paneles 16. |
| Bordes | 1 px estructural; 2 px selección/foco. No depender de sombras. |
| Sombras claras | Suave 0 1px 3px, negro 8%; flotante 0 8px 24px, negro 12%. |
| Modo oscuro | Contraste de superficies y bordes prioritario; sombras discretas. |
| Objetivo táctil | 56 × 56 px para primarias de campo; mínimo propuesto 48 × 48 px en móvil. |
| Retícula | 4 columnas móvil, 8 tableta, 12 escritorio; máximo útil propuesto 1600 px. |
| Transición | Controles 120–200 ms; narrativa 300–500 ms; sin movimiento no esencial cuando se solicite. |

Formulario en una columna. Desde 360 px no hay desplazamiento horizontal de página; tablas anchas ofrecen tarjetas y desplazamiento propio identificado. Zoom no oculta controles persistentes ni errores. Mensajes en español centralizados para traducción futura PT/EN.

## 5.2. Semáforo y plazos

| Estado / condición | Color base | Etiqueta e iconografía |
| --- | --- | --- |
| Cerrada con evidencia | `#00B050` verde | Texto + check; cobertura parcial añade alerta independiente. |
| Declarada cerrada sin evidencia | `#FFC000` ámbar | Texto + documento pendiente. |
| Abierta | `#1D7DCC` azul | Texto + reloj; no verde de cumplimiento. |
| Vencida | `#E53935` rojo | Texto + alerta; días si calculables. |
| Sin información | `#9E9E9E` gris | Texto + interrogación. |
| Vence hoy / próximos 7 días | Ámbar | «Vence hoy» / «Vence en n días». Umbral propuesto. |
| Plazo superior a 7 días | Azul | «En plazo»; no equivale a cierre. |
| Sin compromiso | Gris | «Fecha compromiso: No consta». |

**Contraste calculado sobre tokens:** blanco sobre `#0070C0` ≈5.15:1; sobre `#1D7DCC` ≈4.32:1. El acento principal no se usa como fondo de texto normal blanco que requiera 4.5:1. Blanco sobre rojo corporativo ≈4.23:1: alertas con borde/icono y texto oscuro en superficie clara. Verde, ámbar y gris usan texto oscuro. Ambos temas requieren comprobación en implementación; no es una certificación WCAG de pantallas aún inexistentes.

## 5.3. Componentes base

| Grupo | Componentes y contrato |
| --- | --- |
| Estructura | Cabecera, lateral, barra móvil, migas, selector de rol/contexto, distintivo demo y corte. |
| Analítica | KPI con denominador/fuente; contenedor de gráfico y tabla equivalente; leyenda; tooltip; versiones y banner de calidad. |
| Filtros / tablas | Selector buscable, multiselección, chips, fecha, búsqueda, tabla ordenable/paginada, exportación. |
| Trazabilidad | Estado importado/verificado, cobertura de evidencia, referencia documental, línea temporal, historial, bloqueos explicados. |
| Operación | Formulario por pasos, borrador, carga/vista previa de archivos, validación con motivo, kanban y cola offline. |
| Comunicación | Alertas persistentes, confirmación, éxito no ambiguo, vacíos/errores y privacidad. |

Estados pertinentes: reposo, foco, deshabilitado, carga, error y éxito. Cada gráfico incluye **Ver tabla de datos**, con las mismas selecciones accesibles por teclado. Los mensajes de guardado/cola son anunciables sin repetir animaciones. Fuentes y advertencias críticas no dependen de tooltips.

## 5.4. Visualización y semántica

**Paleta categórica fija propuesta:** Accidente `#002060`; Incidente `#1D7DCC`; Daño a la propiedad `#00B0F0`; Desvío `#7C3AED`; Ambiental `#0F766E`; En investigación `#64748B`. Los tres últimos amplían la paleta analítica. Mantener rótulo, orden, color y símbolos/patrones en todas las vistas. Jerarquías siempre en orden Eliminación → Sustitución → Ingeniería → Administrativo → EPP, no por volumen o alfabeto.

**Ausencia no es cero.** Nulo/clave ausente → No consta; Calidad precisa qué ausencia es. Cero explícito → 0. «N.A.» original no se convierte automáticamente a nulo. Lista vacía → Sin vínculos/archivos registrados. Celda sin filas → textura neutra y aviso de cobertura, no verde de seguridad. Porcentaje sin denominador → No calculable.

**Procedencia visible:** «Oficial según documento fuente», «Meta — no es resultado», «Calculado del detalle — no oficial», «Demo local — no enviado a servidor». Toda comparación conserva período, ámbito, versión y fuente. Advertencia fija: **«Indicadores oficiales según documento fuente; los conteos del detalle pueden no coincidir con los agregados»**. [B: secciones 3 y 5]

**Escalas:** barras desde cero; tasas con ejes/unidades independientes; no gráficos 3D para comparar magnitudes. Tarjetas: porcentaje 1 decimal, IF/IS/TRIFR 2 e IA 3, con originales disponibles. Cálculos y comparación usan originales, no redondeados. Volumen de eventos no se colorea mejor/peor sin exposición y cobertura comparables.

**Pareto:** frecuencia descendente, acumulado 0–100%, referencia descriptiva 80% que no es meta SSOMA. No consta fuera del ranking explicativo pero con contador y denominador visible. Top N incluye Otros desplegable y tabla completa. No presentar textos diferentes como taxonomía causal aprobada ni dividir frases automáticamente en varias causas.

**Recálculos Power BI:** usar solo resumen, período y ámbito compatibles. IS requiere HHT positiva y días perdidos conocidos; TRIFR requiere también `acc_nv2_6`. El resumen no separa el numerador Nv IV–VI para calcular IF/IA de forma general. No combinarlo con conteos incompletos del detalle ni reconstruir semanas no adjuntadas. Los resultados siempre son no oficiales.

## 5.5. Calidad para pasos posteriores

Objetivos del brief: WCAG 2.1 AA; 360 px–4K; Lighthouse móvil ≥85 dashboard / ≥90 PWA; bundle inicial sin 3D <300 KB gzip; 3D diferido, DPR móvil ≤1.5 y pausa fuera de vista. Recursos procedurales o ligeros con licencia verificable, sin fotos corporativas descargadas.

Criterios a comprobar: filtros/URL restaurables; simulación y reintentos sin duplicados; cierre bloqueado sin archivo/validador o con alcance insuficiente; borradores offline recuperables; error de almacenamiento sin éxito falso; alternativas a cámara/dictado; navegación por teclado; tabla accesible de cada gráfico; prevención de CSV con fórmulas ejecutables al exportar texto libre; privacidad de adjuntos. Son **criterios pendientes**, no pruebas ejecutadas en este paso. [B: secciones 7, 9 y 11]

---

# 6. Catálogo de gráficos

**Convenciones:** E = `eventos[]`; A = `acciones[]`; L = `lecciones[]`; P = `proyectos[]`; I = `indicadores`. Campos con sus nombres exactos del JSON. Conteos por ID único. Acciones se unen mediante `evento_id`; lecciones mediante `eventos[]`. «Filtra» remite a sección 2.4. Todos incluyen tabla equivalente, corte, fuente, cobertura y denominador.

| ID / gráfico | Pregunta | Campos y cálculo | Serie ECharts | Interacción cruzada |
| --- | --- | --- | --- | --- |
| G01 · Tendencia anual | ¿Cómo se distribuyen los registros por año/grupo? | E.`id`, `anio`, `tipo_grupo`; conteo. | `bar` apilada. | Año y segmento filtran ambos campos. |
| G02 · Tendencia mensual | ¿Cuándo se concentran los registros? | E.`id`, `anio`, `mes`, `tipo`; año-mes y bloque Mes no consta. | `line` por tipo, sin unir huecos de cobertura. | Punto selecciona período/tipo; intervalo cambia rango temporal. |
| G03 · Grupos | ¿Qué clases predominan? | E.`id`, `tipo_grupo`. | `bar` horizontal. | Seleccionar grupo; no reclasificar. |
| G04 · Proyectos | ¿Dónde hay más registros documentados? | E.`id`, `proyecto`; P.`codigo`, `nombre`. No usar `n_eventos` fijo tras filtrar. | `bar` horizontal. | Proyecto filtra eventos y vínculos. |
| G05 · Accidentes por nivel | ¿Qué severidad consta en accidentes a personas? | E.`tipo_grupo=Accidente`, `nivel_incimmet`, `id`; incluir No consta. | `bar` ordinal, 0/I–VI/desconocido. | Selecciona grupo y nivel; no infiere mortales. |
| G06 · Pareto de tipos | ¿Qué tipos concentran registros? | E.`id`, `tipo`; frecuencia/acumulado. | `bar` + `line`, segundo eje %. | Barra/punto filtra tipo. |
| G07 · Pareto de riesgos | ¿Qué riesgos constan más? | E.`id`, `riesgo_critico`; originales y cobertura. | `bar` + `line`. | Riesgo exacto; agrupación solo con diccionario aprobado. |
| G08 · Pareto de actividades | ¿Qué actividades reúnen registros? | E.`id`, `actividad`. | `bar` + `line`. | Selección filtra eventos/acciones/lecciones vinculadas. |
| G09 · Pareto de equipos | ¿Qué equipos aparecen más? | E.`id`, `equipo`; presencia no equivale a causa. | `bar` + `line`. | Texto de equipo filtra; original consultable. |
| G10 · Causas inmediatas | ¿Qué textos causales están disponibles? | E.`id`, `causas_inmediatas`; textos completos; No consta e inferencias diferenciados. | `bar` + `line`, cuando procede. | Selecciona IDs del texto; abre fuente/condición. |
| G11 · Causas básicas | ¿Qué causas básicas se documentan o infieren? | E.`id`, `causas_basicas`; mismas cautelas que G10. | `bar` + `line`. | Selecciona registros, sin asignar causas a otros. |
| G12 · Proyecto × mes | ¿Qué combinaciones tienen registros? | E.`id`, `proyecto`, `anio`, `mes`; conteos y cobertura. | `heatmap`. | Celda filtra proyecto/período; sin fecha fuera con contador. |
| G13 · Severidad × potencial | ¿Qué observación se cruza con qué potencial? | E.`nivel_incimmet`, `pg_incimmet`, `id`; 179 pares base, 46 con algún faltante. | `heatmap`. | Celda filtra ambos niveles; faltantes accesibles aparte. |
| G14 · HPRI temporal | ¿Cuándo se registran altos potenciales? | E.`alto_potencial=true`, `anio`, `mes`, `id`. | `bar`. | Aplica bandera y período, no solo tipo. |
| G15 · HPRI proyecto/riesgo | ¿Dónde y con qué riesgos aparece alto potencial? | E.`alto_potencial`, `proyecto`, `riesgo_critico`, `id`. | `bar` apilada/agrupada. | Selecciona bandera, proyecto y/o riesgo. |
| G16 · IF oficial | ¿Cómo evoluciona IF en un ámbito comparable? | I.`anual_por_ambito`: `anio`, `ambito`, `if`, `fuente`. | `line` con puntos disponibles. | Año/ámbito oficial; mapeo explícito al detalle si existe. |
| G17 · IS oficial | ¿Cómo evoluciona IS según fuente? | I.`anual_por_ambito`: `anio`, `ambito`, `is`, `fuente`. | `line`, eje independiente. | Como G16, sin inferir días desde el detalle. |
| G18 · IA oficial | ¿Cómo evoluciona IA? | I.`anual_por_ambito`: `anio`, `ambito`, `ia`, `fuente`. | `line`, eje independiente. | Período/ámbito; conserva valor original. |
| G19 · TRIFR oficial | ¿Cómo evoluciona TRIFR? | I.`anual_por_ambito`: `anio`, `ambito`, `trifr`, `fuente`. | `line`, eje independiente. | Año/ámbito; no promedio de proyectos. |
| G20 · Metas 2026 | ¿Qué objetivos existen por ámbito? | I.`metas_2026`: `periodo`, `ambito`, `indicador`, `valor`, `nota`, `fuente`; P.`meta_trifr_2026` como contraste, no duplicación. | `bar` / referencia del mismo indicador. | Selección ámbito/indicador; meta no se convierte en observado. |
| G21 · Doce meses a febrero | ¿Qué resultado móvil y referencia aparecen? | I.`doce_meses_feb_2026`: `periodo`, `ambito`, `indicador`, `valor`, `nota`, `fuente`. | Cuatro `bar` independientes; referencia validada desde `nota`. | Ventana e indicador oficiales; no filtra solo febrero. |
| G22 · Versiones oficiales | ¿Dónde discrepan documentos? | I.`registros_oficiales`: `periodo`, `ambito`, `indicador`, `valor`, `nota`, `fuente`; enlace explícito al anual. | `bar` agrupada por versión, una medida por gráfico. | Selecciona versión/fuente; conserva alternativas. |
| G23 · Recálculo PBIX | ¿Qué IS/TRIFR puede calcularse? | I.`hh_semanal_pbix_resumen`: `anio`, `proyecto`, `desde`, `hasta`, `hht`, `dias_perdidos`, `acc_nv2_6`, `nota`, `fuente`. | `bar` por indicador/período válido. | Proyecto/período filtra bloque; siempre No oficial. Sin IF/IA generales. |
| G24 · Acciones por proyecto | ¿Cómo se distribuye el estado verificado? | A.`id`, `proyecto`, `estado_verificado`, `observaciones`; unión a E por `evento_id`. | `bar` apilada; cantidad o 100%. | Segmento proyecto/estado; cobertura y denominador visibles. |
| G25 · Acciones por evento | ¿Qué eventos tienen pendientes de cierre? | A.`id`, `evento_id`, `estado_verificado`; E.`id`, `tipo`, `alto_potencial`. | `bar` apilada. | Evento/estado y abrir ficha; eventos sin acciones en lista de brechas. |
| G26 · Jerarquía | ¿Qué controles se asignaron? | A.`id`, `jerarquia_control`, `estado_verificado`; clasificación asistida. | `bar` ordenada por jerarquía. | Jerarquía/estado filtra acciones y eventos vinculados. |
| G27 · Plazos | ¿Qué compromisos están vencidos, próximos o ausentes? | A.`id`, `fecha_compromiso`, `estado_verificado`; `meta.fecha_corte_estados`. | `bar` por intervalos. | Selecciona intervalo/No consta; no inventa antigüedad desde el evento. |
| G28 · Cobertura anual | ¿Dónde hay detalle documental y vacíos? | E.`anio`, `proyecto`, `id`, `fuentes`; `meta.advertencias`. | `heatmap`, leyenda de cobertura. | Año/proyecto; Sin registros no declara cero hechos. |
| G29 · Completitud | ¿Qué campos tienen más ausencias? | Campos E/A/L/P y claves I; nulo, clave ausente, vacío y No consta textual separados. | `bar` horizontal por campo, pestaña de entidad. | Selecciona registros afectados mediante bandera de calidad derivada. |
| G30 · Lecciones disponibles | ¿Qué aprendizajes sirven para el contexto? | L.`id`, `riesgo_critico`, `actividad_critica`, `proyectos`, `aplicabilidad`, `eventos`. | `bar` horizontal. | Filtra biblioteca y navega a origen sin multiplicar lecciones. |

G01–G05 y resumen G24 componen la vista ejecutiva; el resto se distribuye en análisis y biblioteca, no se carga simultáneamente. Pareto de causas preserva tabla de textos: si casi todos son únicos o inferidos se prioriza la tabla y se advierte que no existe taxonomía validada.

`registros_oficiales` contiene metas y otras vistas de datos presentes en colecciones específicas. G22 compara procedencias; **no es otra tabla de hechos para sumar**. Los estados de ausencia, error y cero resultados definidos en las secciones 4–5 aplican a todo el catálogo.

---

# 7. Supuestos y preguntas abiertas — máximo 10

1. **Cierres y alcance:** conservar 3/168 con alertas de AC-145/146. Falta definir autoridad de validación y conjunto de proyectos obligatorios para acreditar cobertura transversal completa.
2. **Fuente oficial preferente:** `anual_por_ambito` será vista inicial, conservando alternativas. Falta ratificar versión corporativa y comparabilidad de metas anuales frente a referencias de doce meses.
3. **Permisos reales:** selector de rol/contexto no prueba identidad. Falta matriz por proyecto/función y separación ejecutor–verificador; los permisos de demo no son seguridad de producción.
4. **Catálogos y normalización:** conservar originales y opciones observadas. Faltan catálogos aprobados de riesgos, actividades, equipos, roles y equivalencias cliente/ámbito sin borrar denominaciones históricas.
5. **Evidencias:** almacenamiento binario local y validación explícita propuestos. Faltan formatos, límites de tamaño/cantidad, retención y metadatos de alcance. Un EVD no implica archivo accesible.
6. **Investigación y publicación:** no cierre automático sin acciones. Faltan excepciones justificadas, reapertura/versionado y política de difusión preventiva antes del cierre sin llamarla investigación concluida.
7. **Potencial/personas afectadas:** Por confirmar y múltiples registros anónimos se conservan como extensiones locales. Falta incorporarlos al modelo futuro sin desconocido→false ni categorías corporales compuestas inventadas.
8. **Plazos y alertas:** vencimiento al terminar el día local y aviso de 7 días propuestos. Falta confirmar umbral, plazos por tipo y compromisos recurrentes/transversales.
9. **Offline y conflictos:** preparación previa con conexión; sincronización exclusivamente local en demo. Faltan navegadores/dispositivos objetivo, política de conflictos, acuses reales y recuperación ante borrado de almacenamiento.
10. **Privacidad, marca y publicación:** placeholder INCIMMET. Falta revisión de texto libre, evidencia y aviso de privacidad; logo autorizado; aprobación del conjunto anonimizado antes de publicar en Vercel.

**Estado de entrega:** análisis y diseño funcional/UX del PASO 1 completados. Las decisiones abiertas quedan registradas; no se han resuelto inventando datos o modificando el JSON. La aplicación y sus pruebas se desarrollan en los pasos posteriores.

Listo para el PROMPT 02
