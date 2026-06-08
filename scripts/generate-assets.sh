#!/usr/bin/env bash
# Génère les assets manquants pour le build Play Store
# Nécessite : imagemagick (ou utilise des PNG 1x1 par défaut)
set -euo pipefail

DIR="$(cd "$(dirname "$0")/../packages/mobile/assets" && pwd)"
mkdir -p "$DIR"

# Couleur primaire : #059669 (vert émeraude)
BACKGROUND="#059669"
FOREGROUND="#FFFFFF"

echo "━━━ Génération des assets ━━━"
echo "  Dossier : $DIR"

# Vérifier si ImageMagick est dispo
if command -v convert &>/dev/null; then
  # Icon (1024x1024)
  convert -size 1024x1024 xc:"$BACKGROUND" \
    -fill "$FOREGROUND" -font Helvetica -pointsize 200 \
    -gravity center -annotate 0 "ATB" \
    "$DIR/icon.png"
  echo "  ✅ icon.png (1024x1024)"

  # Adaptive icon foreground (1024x1024)
  convert -size 1024x1024 xc:none \
    -fill "$FOREGROUND" -font Helvetica -pointsize 180 \
    -gravity center -annotate 0 "ATB" \
    "$DIR/adaptive-icon.png"
  echo "  ✅ adaptive-icon.png (1024x1024)"

  # Splash (1284x2778)
  convert -size 1284x2778 xc:"$BACKGROUND" \
    -fill "$FOREGROUND" -font Helvetica -pointsize 120 \
    -gravity center -annotate 0 "ATB AgriTrace" \
    "$DIR/splash.png"
  echo "  ✅ splash.png (1284x2778)"

  # Favicon (48x48)
  convert -size 48x48 xc:"$BACKGROUND" \
    -fill "$FOREGROUND" -pointsize 20 \
    -gravity center -annotate 0 "A" \
    "$DIR/favicon.png"
  echo "  ✅ favicon.png (48x48)"
else
  echo "  ⚠️  ImageMagick non installé. Création de PNG minimalistes..."

  # Python fallback — petits PNG valides 1x1
  python3 -c "
import struct, zlib

def make_png(path, w, h, r, g, b):
    raw = b''
    for y in range(h):
        raw += b'\\x00'  # filter byte
        for x in range(w):
            raw += bytes([r, g, b, 255])
    compressed = zlib.compress(raw)
    def chunk(ctype, data):
        c = ctype + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    ihdr = struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)
    with open(path, 'wb') as f:
        f.write(b'\\x89PNG\\r\\n\\x1a\\n')
        f.write(chunk(b'IHDR', ihdr))
        f.write(chunk(b'IDAT', compressed))
        f.write(chunk(b'IEND', b''))

make_png('$DIR/icon.png', 1024, 1024, 5, 150, 105)
make_png('$DIR/adaptive-icon.png', 1024, 1024, 255, 255, 255)
make_png('$DIR/splash.png', 1284, 2778, 5, 150, 105)
make_png('$DIR/favicon.png', 48, 48, 5, 150, 105)
print('  ✅ Assets générés (PNG)')
"
fi

echo "━━━ Terminé ━━━"
echo ""
echo "Remplace ces placeholders par de vraies icônes avant la publication."
