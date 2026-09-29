#!/usr/bin/env bash
# Gera ícones, splash e favicon a partir do vetor do logo (requer ImageMagick).
# Uso: scripts/brand-assets.sh   (depois: npx expo prebuild para aplicar no Android/iOS)
set -euo pipefail
cd "$(dirname "$0")/.."

LOGO=assets/brand/kronos-logo.svg
OUT=assets/images
# Mesmo fundo da Home (token `background` do tema claro).
BG='#FAFAF8'

# Logo em alta resolução, com fundo transparente.
convert -background none -density 288 "$LOGO" -trim +repage /tmp/kronos-logo.png
fit() { convert /tmp/kronos-logo.png -resize "$1x$1" -background none -gravity center -extent 1024x1024 "$2"; }

# iOS/loja: quadrado, opaco.
fit 600 /tmp/kronos-icon.png
convert /tmp/kronos-icon.png -background "$BG" -flatten -alpha off "$OUT/icon.png"
# Android adaptativo: margem para o recorte circular (zona segura).
fit 450 "$OUT/android-icon-foreground.png"
convert "$OUT/android-icon-foreground.png" -fill white -colorize 100 "$OUT/android-icon-monochrome.png"
# Splash: o logo ocupa 600/1024 da imagem (ver SPLASH_LOGO_HEIGHT em features/app-shell).
fit 600 "$OUT/splash-icon.png"
convert "$OUT/icon.png" -resize 48x48 "$OUT/favicon.png"
rm -f /tmp/kronos-logo.png /tmp/kronos-icon.png
echo "Assets gerados em $OUT"
