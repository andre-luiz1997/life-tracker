#!/usr/bin/env python3
"""
Gera as silhuetas da câmera a partir das fotos masculinas das poses (assets/poses).

Separa a pessoa do fundo liso, extrai o contorno externo, simplifica e encaixa numa caixa
100×160 (a mesma do <Silhouette>). Onde a foto corta o corpo, o traçado fica aberto e encosta
na borda da tela. Saída: src/features/progress-photos/templates/overlays/silhouette-paths.ts.

Requer OpenCV (fora do projeto, num ambiente isolado):
  python3 -m venv /tmp/pose-venv && /tmp/pose-venv/bin/pip install opencv-python-headless numpy
  /tmp/pose-venv/bin/python scripts/pose-silhouettes.py [--preview pasta]
Depois rode `npm run check`. Com --preview, grava cada foto com o contorno em vermelho.
"""
import argparse, os, subprocess
import cv2, numpy as np

ROOT = os.path.join(os.path.dirname(__file__), '..')
POSES = os.path.join(ROOT, 'assets/poses')
OUT = os.path.join(ROOT, 'src/features/progress-photos/templates/overlays/silhouette-paths.ts')
SRC = {
  'body-front': 'weight_loss/body_front', 'body-back': 'weight_loss/body_back',
  'body-side': 'weight_loss/body_left', 'body-torso': 'weight_loss/torso',
  'body-arms': 'weight_loss/arms_relaxed', 'body-arms-flexed': 'weight_loss/arms_flexed',
  'body-legs': 'weight_loss/legs', 'body-glutes': 'weight_loss/glutes',
  'head-front': 'hair/hairline', 'head-temple': 'hair/temple_left', 'head-top': 'hair/mid_scalp',
  'head-back': 'hair/nape', 'face-front': 'face/face_front', 'face-45': 'face/face_45_left',
  'face-profile': 'face/profile_left',
}
BW, BH, MARGIN = 100, 160, 4

def mask_of(img):
    h, w = img.shape[:2]
    lab = cv2.cvtColor(cv2.GaussianBlur(img, (5, 5), 0), cv2.COLOR_BGR2LAB).astype(np.float32)
    border = np.concatenate([lab[:4].reshape(-1,3), lab[-4:].reshape(-1,3), lab[:, :4].reshape(-1,3), lab[:, -4:].reshape(-1,3)])
    bg = np.median(border, axis=0)
    d = np.linalg.norm((lab - bg) * [0.6, 1.4, 1.4], axis=2)
    sure_fg = d > 28
    prob_fg = d > 12
    gc = np.full((h, w), cv2.GC_BGD, np.uint8)
    gc[prob_fg] = cv2.GC_PR_FGD
    gc[sure_fg] = cv2.GC_FGD
    bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(img, gc, None, bgd, fgd, 6, cv2.GC_INIT_WITH_MASK)
    m = np.where((gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, k); m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, k)
    n, lbl, stats, _ = cv2.connectedComponentsWithStats(m)
    big = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
    m = np.where(lbl == big, 255, 0).astype(np.uint8)
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    filled = np.zeros_like(m); cv2.drawContours(filled, cs, -1, 255, -1)
    return filled

def path_of(mask):
    h, w = mask.shape
    cs, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    c = max(cs, key=cv2.contourArea)
    c = cv2.approxPolyDP(c, 1.6, True).reshape(-1, 2).astype(float)
    x0, y0, bw, bh = cv2.boundingRect(mask)
    # Sides where the photo crops the body: the outline runs to the screen edge there.
    T = 6
    top, bottom = y0 <= T, y0 + bh >= h - T
    left, right = x0 <= T, x0 + bw >= w - T
    aw = BW - (0 if left else MARGIN) - (0 if right else MARGIN)
    ah = BH - (0 if top else MARGIN) - (0 if bottom else MARGIN)
    s = min(aw / bw, ah / bh)
    def place(lo, hi, start, size, total):
        if lo and not hi: return -start * s
        if hi and not lo: return total - (start + size) * s
        return (total - size * s) / 2 - start * s
    # Width-bound shapes (head-and-shoulders, flexed arms) stay vertically centered, so the
    # face lands mid-screen instead of at the bottom.
    wide = aw / bw < ah / bh
    ox = place(left, right, x0, bw, BW)
    oy = place(top and not wide, bottom and not wide, y0, bh, BH)
    tol = 6
    on_edge = lambda p: p[0] <= tol or p[1] <= tol or p[0] >= w-1-tol or p[1] >= h-1-tol
    n = len(c)
    keep = [not (on_edge(c[i]) and on_edge(c[(i+1) % n])) for i in range(n)]  # segment i -> i+1
    if all(keep):
        parts, closed = [list(c)], True
    else:
        closed = False
        k0 = keep.index(False)  # start right after a dropped segment so runs never wrap
        parts, cur = [], []
        for j in range(1, n+1):
            i = (k0 + j) % n
            if keep[i]:
                if not cur: cur = [c[i]]
                cur.append(c[(i+1) % n])
            elif cur:
                parts.append(cur); cur = []
        if cur: parts.append(cur)
    # Drop specks (e.g. a notch left where the outline meets the crop edge).
    length = lambda part: sum(np.hypot(*(np.array(part[i+1]) - part[i])) for i in range(len(part)-1))
    total = sum(length(part) for part in parts)
    parts = [part for part in parts if length(part) * s > 12]  # >12 units on screen
    fmt = lambda p: f"{p[0]*s+ox:.1f} {p[1]*s+oy:.1f}"
    d = ' '.join('M' + ' L'.join(fmt(p) for p in part) + ('Z' if closed else '') for part in parts if len(part) > 1)
    return d, (x0, y0, bw, bh, s, ox, oy)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--preview', help='pasta para as imagens de conferência')
    args = ap.parse_args()
    lines = [
        '// Gerado por scripts/pose-silhouettes.py a partir de assets/poses — não editar à mão.',
        "import type { OverlayKey } from '../types';",
        '',
        '/** Camera framing outlines (SVG path data in a 100×160 box), traced from the pose photos. */',
        'export const silhouettePaths: Record<OverlayKey, string> = {',
    ]
    for key, rel in SRC.items():
        img = cv2.imread(os.path.join(POSES, rel + '.masculine.jpg'))
        if img is None:
            raise SystemExit(f'Foto ausente: assets/poses/{rel}.masculine.jpg')
        mask = mask_of(img)
        d, _ = path_of(mask)
        lines.append(f"  '{key}': '{d}',")
        if args.preview:
            os.makedirs(args.preview, exist_ok=True)
            cs, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
            cv2.drawContours(img, cs, -1, (0, 0, 255), 2)
            cv2.imwrite(os.path.join(args.preview, key + '.png'), img)
        print('ok ', key)
    lines.append('};')
    with open(OUT, 'w') as f:
        f.write('\n'.join(lines) + '\n')
    subprocess.run(['npx', 'prettier', '--write', OUT], cwd=ROOT, check=True, capture_output=True)
    print('Gerado:', os.path.relpath(OUT, ROOT))


if __name__ == '__main__':
    main()
