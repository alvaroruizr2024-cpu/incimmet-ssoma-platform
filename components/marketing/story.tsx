import {
  ArrowDown,
  ArrowUpRight,
  ArrowRight,
  ClipboardList,
  Search,
  ListChecks,
  FileCheck2,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { ESCENAS } from '@/lib/domain/cinematica';
import { formatoFecha } from '@/lib/domain/fechas';
import { formatoNarrativo, type ResumenPresentacion } from '@/lib/domain/presentacion';
import { mensajes } from '@/messages/es-PE';
import { AnimatedNumber } from './animated-number';
import { ContextLink } from './context-link';

function Scene({
  index,
  children,
  className = '',
}: {
  index: number;
  children: ReactNode;
  className?: string;
}) {
  const scene = ESCENAS[index];
  if (!scene) return null;
  return (
    <section
      id={scene.id}
      data-intro-scene
      tabIndex={-1}
      aria-labelledby={`${scene.id}-title`}
      className={`intro-scene ${className}`}
    >
      <div className="intro-scene-content">
        <p className="intro-eyebrow">
          <span>
            {String(index + 1).padStart(2, '0')} / {ESCENAS.length}
          </span>
          {scene.titulo}
        </p>
        {children}
      </div>
    </section>
  );
}
const modules = [
  { icon: ClipboardList, title: 'Reporte', detail: 'Registrar el hecho y su contexto.' },
  { icon: Search, title: 'Investigación', detail: 'Documentar causas, sin inferir cierres.' },
  { icon: ListChecks, title: 'Acciones', detail: 'Vincular alcance, rol y compromiso.' },
  { icon: FileCheck2, title: 'Evidencia', detail: 'Distinguir archivos de declaraciones.' },
  { icon: ShieldCheck, title: 'Cierre', detail: 'Exigir validación y cobertura suficiente.' },
  { icon: BookOpen, title: 'Lección', detail: 'Conservar y compartir el aprendizaje.' },
] as const;

/** Una sola narrativa HTML para WebGL, fallback, impresión y lectores de pantalla. */
export function Story({ data }: { data: ResumenPresentacion }) {
  return (
    <>
      <Scene index={0} className="intro-hero">
        <p className="intro-label">GESTIÓN DE INCIDENTES · SSOMA</p>
        <h1 id="inicio-title">
          La seguridad
          <br />
          se construye
          <br />
          <em>con evidencia.</em>
        </h1>
        <p className="intro-lead">
          Un camino trazable entre lo que ocurre en la mina, las acciones que se ejecutan y las
          lecciones que permanecen.
        </p>
        <p className="intro-motto">{mensajes.lema}</p>
        <div className="intro-hero-links">
          <a href="#eventos" className="intro-explore">
            Explorar la gestión <ArrowDown size={18} aria-hidden="true" />
          </a>
          <ContextLink href="/dashboard" className="intro-text-link">
            Ir al dashboard <ArrowUpRight size={16} aria-hidden="true" />
          </ContextLink>
        </div>
        <p className="intro-fine">
          Base documental · Corte {formatoFecha(data.corte)} · America/Lima
        </p>
      </Scene>

      <Scene index={1}>
        <h2 id="eventos-title">
          Una base para
          <br />
          entender lo ocurrido.
        </h2>
        <div className="intro-stat-xl">
          <AnimatedNumber value={data.eventos} />
        </div>
        <p className="intro-stat-label">
          eventos analizados · {data.anioDesde ?? 'No consta'}–{data.anioHasta ?? 'No consta'}
        </p>
        <p className="intro-lead">
          Registros de incidentes, accidentes y desvíos, reunidos con su clasificación y
          procedencia.
        </p>
        <div className="intro-note">
          <span className="intro-note-marker" />
          Cobertura documental desigual. El número de registros no equivale a una tasa de
          accidentabilidad.
        </div>
        <p className="intro-fine">
          Fuente: base documental SSOMA INCIMMET · {formatoFecha(data.desde)}–
          {formatoFecha(data.hasta)}
        </p>
      </Scene>

      <Scene index={2} className="intro-wide">
        <h2 id="proyectos-title">
          Proyectos distintos.
          <br />
          Una lectura común.
        </h2>
        <div className="intro-inline-stat">
          <AnimatedNumber value={data.proyectos} />
          <span>
            proyectos
            <br />
            en la base documental
          </span>
        </div>
        <div className="intro-project-grid">
          {data.proyectosDetalle.slice(0, 3).map((project) => (
            <article key={project.codigo}>
              <p className="intro-project-code">{project.codigo}</p>
              <h3>{project.nombre}</h3>
              <p>
                <AnimatedNumber value={project.eventos} />
                <span> registros</span>
              </p>
            </article>
          ))}
        </div>
        <details className="intro-details">
          <summary>Ver todos los proyectos documentados</summary>
          <ul className="intro-project-list">
            {data.proyectosDetalle.map((project) => (
              <li key={project.codigo}>
                <span>
                  {project.codigo} · {project.nombre}
                </span>
                <span>{project.eventos} registros</span>
              </li>
            ))}
          </ul>
        </details>
        <p className="intro-fine">
          Conteos del detalle, no comparación de desempeño ajustada por horas de exposición. Fuente:
          registro documental de proyectos e incidentes INCIMMET.
        </p>
      </Scene>

      <Scene index={3} className="intro-wide">
        <p className="intro-label">
          {data.indicadores.ambitoNombre} · {data.indicadores.anio}
        </p>
        <h2 id="indicadores-title">
          Indicadores con
          <br />
          fuente, período y ámbito.
        </h2>
        <div className="intro-indicator-grid">
          <article>
            <h3>IF</h3>
            <p>
              <AnimatedNumber value={data.indicadores.if} decimals={2} />
            </p>
            <span>Índice de frecuencia</span>
          </article>
          <article>
            <h3>IS</h3>
            <p>
              <AnimatedNumber value={data.indicadores.is} decimals={2} />
            </p>
            <span>Índice de severidad</span>
          </article>
          <article>
            <h3>IA</h3>
            <p>
              <AnimatedNumber value={data.indicadores.ia} decimals={3} />
            </p>
            <span>Índice de accidentabilidad</span>
          </article>
        </div>
        <p className="intro-official">
          Oficiales según documento fuente. No recalculados sobre el detalle incompleto.
        </p>
        <details className="intro-details">
          <summary>Consultar valores originales y procedencia</summary>
          <dl className="intro-original-values">
            <dt>IF original</dt>
            <dd>{data.indicadores.if ?? 'No consta'}</dd>
            <dt>IS original</dt>
            <dd>{data.indicadores.is ?? 'No consta'}</dd>
            <dt>IA original</dt>
            <dd>{data.indicadores.ia ?? 'No consta'}</dd>
            <dt>Fuente</dt>
            <dd>
              {data.indicadores.fuente ??
                (data.indicadores.versiones > 1
                  ? 'Varias versiones; requiere selección explícita.'
                  : 'No consta')}
            </dd>
          </dl>
        </details>
        <p className="intro-fine">{mensajes.oficiales}</p>
      </Scene>

      <Scene index={4}>
        <h2 id="potencial-title">
          La señal importa.
          <br />
          Incluso sin una lesión.
        </h2>
        <div className="intro-stat-xl">
          <AnimatedNumber value={data.altoPotencial} />
        </div>
        <p className="intro-stat-label">eventos marcados como alto potencial</p>
        <p className="intro-lead">
          Una mirada específica sobre los eventos que exigen revisar controles críticos e investigar
          con trazabilidad.
        </p>
        <div className="intro-note">
          La cifra usa la bandera de alto potencial del detalle. No se infiere a partir del tipo de
          evento ni del nivel de potencial.
        </div>
        <p className="intro-fine">
          Fuente: eventos marcados como alto potencial en la base SSOMA INCIMMET. Escena
          ilustrativa; no recrea accidentes.
        </p>
      </Scene>

      <Scene index={5} className="intro-wide">
        <h2 id="evidencia-title">
          Declarar no es
          <br />
          <em>verificar.</em>
        </h2>
        <div className="intro-gap-grid">
          <article>
            <p className="intro-gap-number">
              <AnimatedNumber value={data.porcentajeCierre} decimals={1} suffix="%" />
            </p>
            <h3>
              con cierre verificado
              <br />
              según corte documental
            </h3>
            <p>
              {data.cerradas} de {data.acciones} acciones.
            </p>
          </article>
          <article>
            <p className="intro-gap-number">
              <AnimatedNumber value={data.porcentajeSinInformacion} decimals={1} suffix="%" />
            </p>
            <h3>
              en estado
              <br />
              «Sin información»
            </h3>
            <p>
              {data.sinInformacion} de {data.acciones} acciones.
            </p>
          </article>
        </div>
        <div className="intro-critical-note">
          <FileCheck2 size={20} aria-hidden="true" />
          <p>
            <strong>
              {data.cierresParciales} de los {data.cerradas} cierres importados tienen evidencia de
              alcance parcial.
            </strong>{' '}
            La plataforma conserva esta advertencia; no presenta el{' '}
            {formatoNarrativo(data.porcentajeCierre, 1)}% como cumplimiento integral auditado.
          </p>
        </div>
        <p className="intro-fine">
          Fuente: revisión documental de acciones y sus observaciones · Corte{' '}
          {formatoFecha(data.corte)}. Referencia documental no equivale a archivo validado.
        </p>
        <ContextLink href="/analisis" className="intro-text-link">
          Revisar calidad de datos <ArrowUpRight size={16} aria-hidden="true" />
        </ContextLink>
      </Scene>

      <Scene index={6} className="intro-wide">
        <h2 id="plataforma-title">
          Un ciclo conectado.
          <br />
          Ningún cierre sin evidencia.
        </h2>
        <p className="intro-lead">
          La plataforma convierte registros dispersos en una secuencia de decisiones verificables.
        </p>
        <ol className="intro-module-grid">
          {modules.map(({ icon: Icon, title, detail }, i) => (
            <li key={title}>
              <span className="intro-module-index">{String(i + 1).padStart(2, '0')}</span>
              <Icon size={23} aria-hidden="true" />
              <h3>{title}</h3>
              <p>{detail}</p>
            </li>
          ))}
        </ol>
        <p className="intro-note">
          Flujo propuesto, no mejora medida. Explore los análisis, verifique evidencias y consulte
          lecciones. El formulario PWA completo corresponde al siguiente paso.
        </p>
      </Scene>

      <Scene index={7} className="intro-finale">
        <h2 id="continuar-title">
          Hagamos el camino
          <br />
          <em>juntos.</em>
        </h2>
        <div className="intro-inline-stat">
          <AnimatedNumber value={data.lecciones} />
          <span>
            lecciones catalogadas
            <br />
            para consultar y aprender
          </span>
        </div>
        <div className="intro-cta-row">
          <ContextLink href="/dashboard" className="intro-cta">
            Explorar dashboard <ArrowRight size={21} aria-hidden="true" />
          </ContextLink>
          <ContextLink href="/campo" className="intro-cta-secondary">
            Reportar en campo <ArrowUpRight size={17} aria-hidden="true" />
          </ContextLink>
        </div>
        <p className="intro-fine">
          Campo abre la base del módulo. Instalación PWA y formulario completo: fase posterior.
          Catalogada no acredita publicación ni difusión formal.
        </p>
        <details className="intro-details intro-quality">
          <summary>Calidad, alcance y advertencias del conjunto</summary>
          <ul>
            {data.advertencias.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
            <li>
              Complemento a la advertencia 2025: {data.eventos2025} registros recuperados; cobertura
              no exhaustiva.
            </li>
            <li>{data.cierresParciales} cierres importados presentan cobertura parcial.</li>
            <li>
              Fuentes y evidencias son referencias documentales, no archivos originales adjuntos.
            </li>
          </ul>
        </details>
      </Scene>
    </>
  );
}
