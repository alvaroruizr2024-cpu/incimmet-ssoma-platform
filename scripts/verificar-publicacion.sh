#!/usr/bin/env bash
# Comprueba el sitio publicado: estados HTTP, contenido mínimo y cabeceras de seguridad.
# Uso: bash scripts/verificar-publicacion.sh https://incimmet-ssoma-platform.vercel.app
set -u
BASE="${1:-${BASE_PUBLICADA:-}}"
if [ -z "$BASE" ]; then
  echo "Uso: $0 <URL base del sitio publicado>"
  exit 2
fi
BASE="${BASE%/}"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
fallos=0
resumen="${GITHUB_STEP_SUMMARY:-}"
nota() {
  echo "$1"
  if [ -n "$resumen" ]; then echo "$1" >>"$resumen"; fi
}
pedir() { # ruta → código HTTP; cuerpo en $tmp/cuerpo y cabeceras en $tmp/cab
  : >"$tmp/err"
  curl -sS -o "$tmp/cuerpo" -D "$tmp/cab" -w '%{http_code}' --max-time 40 \
    -A 'incimmet-verificacion/1.0' "$BASE$1" 2>"$tmp/err" || echo 000
}
cabecera() { grep -i "^$1:" "$tmp/cab" | head -n 1 | cut -d' ' -f2- | tr -d '\r'; }
ok() { nota "   ✓ $1"; }
fallo() {
  nota "   ✗ $1"
  fallos=$((fallos + 1))
}
comprobar() { # ruta estado-esperado [texto que debe contener el cuerpo]
  local ruta="$1" esperado="$2" texto="${3:-}" codigo detalle=""
  codigo="$(pedir "$ruta")"
  nota "== $ruta → HTTP $codigo"
  if [ -s "$tmp/err" ]; then detalle=" ($(head -c 200 "$tmp/err"))"; fi
  if [ "$codigo" = "$esperado" ]; then ok "estado $esperado"; else fallo "estado $codigo; se esperaba $esperado$detalle"; fi
  if [ -n "$texto" ]; then
    if grep -q -- "$texto" "$tmp/cuerpo"; then ok "el cuerpo contiene «$texto»"; else fallo "el cuerpo no contiene «$texto»"; fi
  fi
  local h v
  for h in content-type cache-control content-security-policy permissions-policy x-frame-options \
    x-content-type-options referrer-policy service-worker-allowed strict-transport-security location x-vercel-cache; do
    v="$(cabecera "$h")"
    if [ -n "$v" ]; then nota "   $h: $v"; fi
  done
}
cabecera_incluye() { # nombre fragmento
  local v
  v="$(cabecera "$1")"
  case "$v" in
  *"$2"*) ok "$1 incluye «$2»" ;;
  *) fallo "$1 = «${v:-∅}» no incluye «$2»" ;;
  esac
}

nota "Verificación del sitio publicado: $BASE ($(date -u +%Y-%m-%dT%H:%M:%SZ))"
comprobar / 200 'Del reporte a la evidencia'
cabecera_incluye content-type text/html
cabecera_incluye x-frame-options DENY
cabecera_incluye x-content-type-options nosniff
cabecera_incluye referrer-policy strict-origin-when-cross-origin
cabecera_incluye permissions-policy 'camera=()'
cabecera_incluye content-security-policy "frame-ancestors 'none'"
cabecera_incluye strict-transport-security max-age
comprobar /dashboard 200 'Dashboard ejecutivo'
cabecera_incluye permissions-policy 'microphone=()'
cabecera_incluye content-security-policy "script-src 'self'"
comprobar /eventos/EV-2009-001 200 'EV-2009-001'
comprobar /campo 200 'Reportes de campo'
cabecera_incluye permissions-policy 'camera=(self)'
cabecera_incluye permissions-policy 'microphone=(self)'
comprobar /analisis 200 INCIMMET
comprobar /acciones 200 INCIMMET
comprobar /lecciones 200 INCIMMET
comprobar /sw.js 200 'workbox-sw.js'
cabecera_incluye content-type javascript
cabecera_incluye cache-control no-store
cabecera_incluye service-worker-allowed /
cabecera_incluye content-security-policy 'workbox-cdn/releases/7.3.0/'
comprobar /manifest.webmanifest 200 '"name"'
cabecera_incluye content-type application/manifest+json
comprobar /precache-manifest.js 200 ''
cabecera_incluye cache-control no-cache
comprobar /ruta-que-no-existe-verificacion 404 ''
if [ "$fallos" -eq 0 ]; then
  nota "RESULTADO: todas las comprobaciones aprobadas."
  exit 0
fi
nota "RESULTADO: $fallos comprobaciones fallidas."
exit 1
