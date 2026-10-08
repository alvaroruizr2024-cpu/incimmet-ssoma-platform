'use client';
import { ESCENAS, MAX_ANCLAS } from '@/lib/domain/cinematica';
import {
  datosDeEscena,
  mismaReferencia,
  vecinoEnEscena,
  type DatoInteractivo,
} from '@/lib/domain/interactivos3d';
import { useRelato3D } from '@/store/relato3d';
import {
  claveAncla,
  claveMomento,
  posicionAncla,
  registrarElemento,
} from '@/components/three/anclas';

/**
 * Botones DOM anclados a las instalaciones de la escena activa. El canvas los coloca por frame; aquí
 * solo viven su texto, su estado y su acción, así que funcionan con ratón, dedo y teclado.
 */
export function AnchorLayer({
  catalogo,
  escena,
}: {
  catalogo: readonly DatoInteractivo[];
  escena: number;
}) {
  const seleccion = useRelato3D((s) => s.seleccion);
  const lista = datosDeEscena(catalogo, escena);
  const titulo = ESCENAS[escena]?.titulo ?? 'Escena';
  if (!lista.length) return null;
  if (lista.length > MAX_ANCLAS * 2) {
    // Cientos de instancias: un solo botón recorre los registros desde el panel.
    const clave = claveMomento(escena);
    const abierto = seleccion?.escena === escena;
    return (
      <div className="intro-anclas" data-testid="intro-anclas">
        <button
          type="button"
          className="intro-ancla"
          data-visible="no"
          ref={(el) => {
            registrarElemento(clave, el);
          }}
          aria-label={`Recorrer los ${lista.length} registros de ${titulo}`}
          aria-pressed={abierto}
          onClick={() =>
            useRelato3D
              .getState()
              .seleccionar(abierto ? null : vecinoEnEscena(catalogo, null, escena, 1))
          }
        >
          <span className="intro-ancla-punto" aria-hidden="true" />
          <span className="intro-ancla-texto">
            {lista.length} registros
            <small>Pulse para recorrerlos</small>
          </span>
        </button>
      </div>
    );
  }
  return (
    <div className="intro-anclas" data-testid="intro-anclas">
      {lista.map((d) => {
        const clave = claveAncla(d);
        const activo = mismaReferencia(seleccion, d);
        return (
          <button
            key={clave}
            type="button"
            className="intro-ancla"
            data-visible="no"
            ref={(el) => {
              registrarElemento(clave, el);
            }}
            aria-label={`${d.titulo}: ${d.lineas[0] ?? ''}`}
            aria-pressed={activo}
            onClick={() =>
              useRelato3D
                .getState()
                .seleccionar(activo ? null : d, activo ? null : posicionAncla(clave))
            }
          >
            <span className="intro-ancla-punto" aria-hidden="true" />
            <span className="intro-ancla-texto">
              {d.titulo}
              <small>{d.lineas[0]}</small>
            </span>
          </button>
        );
      })}
    </div>
  );
}
