#!/usr/bin/env bash
# Importa as fotos realistas de exemplo das poses (requer ImageMagick).
# Uso: scripts/pose-photos.sh <pasta-ou-arquivo>...
#   ex.: scripts/pose-photos.sh ~/Downloads
#        scripts/pose-photos.sh ~/Downloads/body.masculine.jpeg ~/Downloads/head.masculine.jpeg
#
# O formato é detectado pelo conteúdo (PNG, JPEG, WebP...), não pela extensão. Numa pasta,
# arquivos com outros nomes (ex.: Gemini_Generated_Image_*.jpeg) são ignorados em silêncio.
# O guia com os prompts está em docs/POSES-FOTOS.md. Os nomes aceitos são:
#   - Folha 3×3:  <folha>.<estilo>, ex.: body.masculine.png. Folhas: body, head. O script recorta
#                 as 9 células na ordem de LAYOUTS abaixo e grava uma prévia rotulada
#                 _previa.<folha>.<estilo>.jpg na pasta de entrada, para conferir o recorte.
#   - Foto única: <template>.<ângulo>.<estilo>, ex.: weight_loss.body_front.feminine.png.
# Estilos: masculine, feminine, neutral. Variantes "direita" reaproveitam a "esquerda" espelhada.
#
# Saída: assets/poses/<template>/<ângulo>.<estilo>.jpg (quadrada, até 640 px) e o registro
# src/features/progress-photos/templates/photos/registry.ts, refeito a cada execução.
set -euo pipefail
# Caminhos absolutos antes do cd, para aceitar caminhos relativos à pasta atual.
ARGS=()
for arg in "$@"; do ARGS+=("$(realpath -m -- "$arg")"); done
cd "$(dirname "$0")/.."

OUT=${POSE_OUT:-assets/poses}
REGISTRY=${POSE_REGISTRY:-src/features/progress-photos/templates/photos/registry.ts}
GRID=3
# Margem cortada de cada lado da célula (% do lado), para descartar bordas e espaços entre fotos.
INSET=4

# Células da esquerda para a direita, de cima para baixo. "-" = célula vazia.
declare -A LAYOUTS=(
  [body]="weight_loss/body_front weight_loss/body_back weight_loss/body_left
          weight_loss/torso weight_loss/arms_relaxed weight_loss/arms_flexed
          weight_loss/legs weight_loss/glutes -"
  [head]="hair/hairline hair/temple_left hair/mid_scalp
          hair/crown hair/nape face/face_front
          face/face_45_left face/profile_left face/closeup"
)

# Recorte quadrado central, até 640 px, JPEG progressivo.
save() { # <entrada> <template/ângulo> <estilo> [geometria-do-recorte]
  local dest="$OUT/${2%/*}/${2#*/}.$3.jpg" crop=()
  [[ -n "${4:-}" ]] && crop=(-crop "$4" +repage)
  mkdir -p "$(dirname "$dest")"
  local size
  size=$(convert "$1" -auto-orient "${crop[@]}" -format '%[fx:min(w,h)]' info:)
  convert "$1" -auto-orient "${crop[@]}" -strip -gravity center -extent "${size}x${size}" \
    -resize '640x640>' -interlace JPEG -quality 85 "$dest"
  echo "ok  $dest"
  CELLS+=("$dest")
}

slice() { # <entrada> <folha> <estilo>
  local w h cw ch inset i=0 cells=() labels=()
  read -r w h < <(identify -auto-orient -format '%w %h\n' "$1[0]")
  cw=$((w / GRID)) ch=$((h / GRID))
  inset=$(((cw < ch ? cw : ch) * INSET / 100))
  for cell in ${LAYOUTS[$2]}; do
    if [[ "$cell" != "-" ]]; then
      local x=$(((i % GRID) * cw + inset)) y=$((i / GRID * ch + inset))
      CELLS=()
      save "$1" "$cell" "$3" "$((cw - 2 * inset))x$((ch - 2 * inset))+$x+$y"
      cells+=("${CELLS[0]}") labels+=("$cell")
    fi
    i=$((i + 1))
  done
  local args=()
  for j in "${!cells[@]}"; do args+=(-label "${labels[$j]}" "${cells[$j]}"); done
  montage "${args[@]}" -tile "${GRID}x" -geometry 220x220+6+6 -pointsize 14 \
    "$(dirname "$1")/_previa.$2.$3.jpg"
  echo "prévia: $(dirname "$1")/_previa.$2.$3.jpg"
}

import_file() { # <arquivo> [quiet: não avisar sobre nomes fora do padrão]
  local f=$1 quiet=${2:-} name parts style
  name=$(basename "$f")
  name=${name%.*}
  [[ "$name" == _previa.* ]] && return
  IFS=. read -r -a parts <<<"$name"
  style=${parts[-1]}
  if [[ ${#parts[@]} -lt 2 || ! "$style" =~ ^(feminine|masculine|neutral)$ ]]; then
    if [[ -z "$quiet" ]]; then echo "Ignorado (nome fora do padrão): $f" >&2; fi
  elif ! identify "$f[0]" >/dev/null 2>&1; then
    echo "Ignorado (não é uma imagem): $f" >&2
  elif [[ ${#parts[@]} -eq 2 && -n "${LAYOUTS[${parts[0]}]:-}" ]]; then
    slice "$f" "${parts[0]}" "$style"
  elif [[ ${#parts[@]} -eq 3 ]]; then
    CELLS=()
    save "$f" "${parts[0]}/${parts[1]}" "$style"
  else
    echo "Ignorado (nome fora do padrão): $f" >&2
  fi
}

for arg in "${ARGS[@]+"${ARGS[@]}"}"; do
  if [[ -d "$arg" ]]; then
    while IFS= read -r -d '' f; do import_file "$f" quiet; done < <(find "$arg" -maxdepth 1 -type f -print0 | sort -z)
  elif [[ -f "$arg" ]]; then
    import_file "$arg"
  else
    echo "Não encontrado: $arg" >&2
    exit 1
  fi
done

{
  echo '// Gerado por scripts/pose-photos.sh — não editar à mão.'
  echo 'import type { ImageSourcePropType } from '"'"'react-native'"'"';'
  echo
  echo '/** Fotos realistas das poses, por "<template>/<ângulo>/<estilo>". */'
  echo 'export const posePhotoFiles: Record<string, ImageSourcePropType> = {'
  find "$OUT" -name '*.jpg' | sort | while read -r file; do
    rel=${file#"$OUT"/}
    template=${rel%%/*}
    base=$(basename "$rel" .jpg)
    echo "  '$template/${base%.*}/${base##*.}': require('@/assets/poses/$rel'),"
  done
  echo '};'
} >"$REGISTRY"
npx prettier --write "$REGISTRY" >/dev/null
echo "Registro atualizado: $REGISTRY ($(find "$OUT" -name '*.jpg' | wc -l) fotos)"
