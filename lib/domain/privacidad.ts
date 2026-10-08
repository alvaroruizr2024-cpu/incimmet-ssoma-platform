export interface RevisionTexto {
  bloqueos: string[];
  advertencias: string[];
}
/** Heurística preventiva local, no anonimización garantizada ni diagnóstico. */
export function revisarPrivacidad(textos: readonly string[]): RevisionTexto {
  const bloqueos: string[] = [],
    advertencias: string[] = [];
  const combined = textos.join('\n');
  if (/(?<!\d)\d{8}(?!\d)/u.test(combined) || /\bDNI\s*[:#-]?\s*(?:\d[ .-]*){8}\b/iu.test(combined))
    bloqueos.push('Se detectó un patrón de DNI de 8 dígitos. Retírelo antes de guardar.');
  if (
    /\b(?:diagn[oó]stico|fractura|traumatismo|contusi[oó]n|esguince|amputaci[oó]n|depresi[oó]n|ansiedad|diabetes|hipertensi[oó]n|historia cl[ií]nica|CIE[ -]?10)\b/iu.test(
      combined,
    )
  )
    advertencias.push(
      'Posible diagnóstico o información de salud. Describa el hecho sin información médica.',
    );
  const nombre =
    /\b(?:Sr\.?|Sra\.?|señor|señora|nombre\s*:?|trabajador\s+llamado)\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)+/u;
  const conocidos =
    /\b(?:Juan|José|Jose|María|Maria|Pedro|Luis|Carlos|Ana|Alvaro|Álvaro|Jorge|Julio|Rosa|Miguel)\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?\b/u;
  if (nombre.test(combined) || conocidos.test(combined))
    advertencias.push('Posible nombre propio. Identifique a las personas solamente por su rol.');
  return { bloqueos, advertencias };
}
export function exigirPrivacidad(textos: readonly string[]): void {
  const revision = revisarPrivacidad(textos);
  const problemas = [...revision.bloqueos, ...revision.advertencias];
  if (problemas.length) throw new Error(problemas.join(' '));
}
