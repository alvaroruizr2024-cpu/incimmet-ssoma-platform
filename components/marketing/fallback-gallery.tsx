import Image from 'next/image';
import type { ResumenPresentacion } from '@/lib/domain/presentacion';
import { COLORES_EVENTO } from '@/lib/domain/momentos3d';
import { formatoNarrativo } from '@/lib/domain/presentacion';
/** Póster procedural renderizado + diagramas derivados de la base; decorativo, sin duplicar lectura. */
export function FallbackGallery({ data, scene }: { data: ResumenPresentacion; scene: number }) {
  const cols = Math.max(1, Math.ceil(Math.sqrt(data.tarjetasAcciones.length * 1.3)));
  return (
    <div className="intro-fallback" aria-hidden="true">
      <Image
        src={scene === 7 ? '/intro/salida.webp' : '/intro/galeria.webp'}
        alt=""
        fill
        priority
        unoptimized
        sizes="100vw"
        className="intro-poster"
      />
      <svg
        className="intro-gallery-svg"
        viewBox="0 0 1440 1000"
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        <defs>
          <radialGradient id="poster-glow">
            <stop
              stopColor={scene === 4 ? '#FFC000' : scene === 7 ? '#FFD5A0' : '#00B0F0'}
              stopOpacity=".28"
            />
            <stop offset="1" stopColor="#002060" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="1440" height="1000" fill="#002060" opacity=".16" />
        <ellipse cx="1040" cy="475" rx="450" ry="400" fill="url(#poster-glow)" />
        {scene === 0 && (
          <g fill="none" stroke="#00B0F0" strokeWidth="3">
            <path d="M840 690V340Q1050 160 1260 340V690" />
            {data.proyectosDetalle.map((p, i) => (
              <circle key={p.codigo} cx={870 + i * 31} cy="684" r="6" fill="#84DFFF" />
            ))}
          </g>
        )}
        {scene === 1 && (
          <g>
            {data.puntosEventos.map((e, i) => (
              <circle
                key={e.id}
                cx={840 + (i % 15) * 28}
                cy={295 + Math.floor(i / 15) * 28}
                r="5.5"
                fill={COLORES_EVENTO[e.grupo] ?? '#E7E6E6'}
              />
            ))}
          </g>
        )}
        {scene === 2 && (
          <g>
            {data.proyectosDetalle.map((p, i) => {
              const max = Math.max(1, ...data.proyectosDetalle.map((x) => x.eventos));
              const h = 50 + Math.sqrt(p.eventos / max) * 85;
              return (
                <g
                  key={p.codigo}
                  transform={`translate(${830 + (i % 4) * 105},${410 + Math.floor(i / 4) * 148})`}
                >
                  <path
                    d={`M0 0V${-h}H76V0`}
                    stroke="#62CDFF"
                    strokeWidth="4"
                    fill="#002060"
                    fillOpacity=".8"
                  />
                  <text x="38" y="-12" textAnchor="middle" fill="white" fontSize="17">
                    {p.codigo}
                  </text>
                  <text x="38" y="25" textAnchor="middle" fill="#C1ECFF" fontSize="17">
                    {p.eventos}
                  </text>
                </g>
              );
            })}
          </g>
        )}
        {scene === 3 && (
          <g>
            {[
              ['IF', data.indicadores.if, 2],
              ['IS', data.indicadores.is, 2],
              ['IA', data.indicadores.ia, 3],
            ].map(([label, value, decimals], i) => (
              <g key={String(label)} transform={`translate(860,${265 + i * 155})`}>
                <rect
                  width="380"
                  height="128"
                  rx="12"
                  fill="#0F172A"
                  stroke="#00B0F0"
                  strokeWidth="2"
                />
                <text x="25" y="45" fontSize="20" fill="white">
                  {label}
                </text>
                <text x="350" y="92" textAnchor="end" fontSize="49" fill="#62CDFF">
                  {formatoNarrativo(value as number | null, decimals as number)}
                </text>
              </g>
            ))}
          </g>
        )}
        {scene === 4 && (
          <g className="intro-svg-light">
            {data.balizas.map((b, i) => (
              <g
                key={b.id}
                transform={`translate(${880 + (i % 3) * 145},${370 + Math.floor(i / 3) * 215})`}
              >
                <path d="M0 0V110" stroke="#97A6B2" strokeWidth="10" />
                <circle r="21" fill="#FFC000" />
                <circle r="39" fill="#FFC000" opacity=".17" />
              </g>
            ))}
          </g>
        )}
        {scene === 5 && (
          <g>
            {data.tarjetasAcciones.map((a, i) => (
              <rect
                key={a.id}
                x={810 + (i % cols) * 30}
                y={325 + Math.floor(i / cols) * 35}
                width="23"
                height="29"
                rx="2"
                fill={a.cerrada ? '#00B050' : '#718096'}
                stroke={a.cerrada ? '#8FFFC2' : '#A4AFBA'}
                strokeWidth={a.cerrada ? 2 : 0.5}
              />
            ))}
          </g>
        )}
        {scene === 6 && (
          <g>
            {data.ciclo.map((s, i) => (
              <g
                key={s.titulo}
                transform={`translate(${815 + (i % 2) * 240},${280 + Math.floor(i / 2) * 170})`}
              >
                <rect width="210" height="130" rx="10" fill="#002060" stroke="#00B0F0" />
                <text x="16" y="35" fill="#E7E6E6" fontSize="19">
                  {s.titulo}
                </text>
                <text x="185" y="90" textAnchor="end" fill="#62CDFF" fontSize="39">
                  {s.cantidad}
                </text>
              </g>
            ))}
          </g>
        )}
        {scene === 7 && (
          <g fill="#FFE4B4">
            {data.lecciones > 0 &&
              Array.from({ length: data.lecciones }, (_, i) => (
                <circle key={i} cx={880 + (i % 11) * 35} cy={725 + Math.floor(i / 11) * 28} r="5" />
              ))}
          </g>
        )}
      </svg>
    </div>
  );
}
