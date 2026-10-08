/** Estado mínimo del arrastre sobre el canvas, compartido entre el rig y los manejadores de clic. */
export const gestos = { arrastrando: false, distancia: 0, fin: 0 };
/** Un clic justo después de arrastrar no debe deseleccionar ni fijar nada. */
export function clicTrasArrastre(): boolean {
  return gestos.distancia > 6 && performance.now() - gestos.fin < 250;
}
