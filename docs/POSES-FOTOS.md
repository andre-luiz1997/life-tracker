# Fotos realistas das poses

As miniaturas que mostram "como posar" em cada ângulo podem ser fotos realistas em vez dos
desenhos. O app usa a foto quando ela existe para o ângulo e o estilo escolhido (masculino,
feminino, neutro). Sem foto, continua mostrando o desenho.

## Como funciona

Cada estilo tem duas folhas, cada uma com um grid 3×3 de fotos da mesma pessoa:

- **`body`**: as 8 poses de academia da linha do tempo de emagrecimento (a 9ª célula fica vazia).
- **`head`**: as 5 poses de cabelo e as 4 de rosto.

São 4 imagens para masculino e feminino, geradas nesta ordem:

1. `body.masculine.png`
2. `head.masculine.png`
3. `body.feminine.png`
4. `head.feminine.png`

O estilo neutro (`body.neutral.png` e `head.neutral.png`) é opcional. Ele é o padrão do app,
então sem essas folhas quem não escolheu um estilo continua vendo os desenhos.

## Passo a passo

1. Cole cada prompt abaixo no Gemini, um por vez, numa conversa nova. Peça imagem quadrada.
2. Renomeie cada resultado com o nome indicado no título do prompt. A extensão pode ser a que o
   Gemini usar (`.jpeg`, `.png`...), porque o script reconhece o formato pelo conteúdo.
3. Rode o script, que recorta cada folha nas 9 células e atualiza o app:

   ```bash
   scripts/pose-photos.sh ~/Downloads    # ou os arquivos, um a um
   npm run check
   ```

4. Abra `_previa.<folha>.<estilo>.jpg`, que o script grava na mesma pasta. Ela mostra cada
   recorte com o nome da pose. Se uma célula saiu errada, gere a folha de novo.

Para trocar só uma pose, salve a foto avulsa como `<template>.<ângulo>.<estilo>.png`, por
exemplo `weight_loss.body_front.feminine.png`, e rode o script de novo.

Os ângulos "direita" usam a foto "esquerda" espelhada. Por isso as direções nos prompts são
descritas pelo lado da imagem, e não pelo lado do corpo da pessoa.

## Prompts

### `body.masculine.png`

```text
A single square 1:1 image that is a photo contact sheet: exactly 3 columns by 3 rows of equal
square cells, separated by thin white lines. Each cell is a separate photorealistic studio
photograph of the SAME man. No text, no labels, no numbers, no captions anywhere.

The man: adult, about 30, athletic build with visible muscle definition, short dark hair,
clean-shaven. He is SHIRTLESS so chest, abs, arms and back muscles are clearly visible. He
wears plain dark navy athletic shorts and is barefoot.

Every cell: plain light warm-gray seamless background (#F5F4F0), soft even diffused studio
lighting, sharp focus, natural skin texture, neutral relaxed expression, no tattoos, no jewelry.
The subject is centered in the cell with a small margin; do not cut off parts the cell
description includes.

Row 1, column 1 (top-left): full body head to feet, facing the camera, feet shoulder-width
apart, hands on the waist with elbows pushed out wide.
Row 1, column 2 (top-center): full body head to feet, seen from directly behind, hands on the
waist with elbows out wide, back muscles visible, one heel slightly raised.
Row 1, column 3 (top-right): full body head to feet, strict side profile with the nose and
chest pointing to the RIGHT edge of the image, chest up, near arm bent in front of the torso,
near knee slightly forward on the toes.
Row 2, column 1 (middle-left): cropped from chest to upper thighs, facing the camera, both hands
behind the head, abs clearly visible.
Row 2, column 2 (center): cropped from head to hips, facing the camera, arms hanging relaxed
slightly away from the body.
Row 2, column 3 (middle-right): cropped from head to waist, facing the camera, front
double-biceps pose with both arms raised and flexed.
Row 3, column 1 (bottom-left): cropped from hips to feet, facing the camera, hands on hips, one
leg slightly forward and turned out, thigh muscles visible.
Row 3, column 2 (bottom-center): cropped from lower back to knees, seen from directly behind,
hands on hips, one leg stepped back resting on the toes.
Row 3, column 3 (bottom-right): empty, plain background only.
```

### `head.masculine.png`

```text
A single square 1:1 image that is a photo contact sheet: exactly 3 columns by 3 rows of equal
square cells, separated by thin white lines. Each cell is a separate photorealistic studio
photograph of the SAME man. No text, no labels, no numbers, no captions anywhere.

The man: adult, about 30, short dark hair slightly longer on top, clean-shaven, bare shoulders
(shirtless).

Every cell: plain light warm-gray seamless background (#F5F4F0), soft even diffused studio
lighting, sharp focus, natural skin and hair texture, neutral relaxed expression, no jewelry.
The head is centered in the cell with a small margin.

Row 1, column 1 (top-left): head and shoulders facing the camera, hair combed back so the
frontal hairline is fully visible.
Row 1, column 2 (top-center): head and shoulders in three-quarter view, nose pointing toward the
RIGHT edge of the image, temple and side hairline clearly visible.
Row 1, column 3 (top-right): top of the head seen from directly above, hair parted in the middle
so the scalp line is visible, shoulders at the edges of the cell.
Row 2, column 1 (middle-left): top of the head seen from directly above, centered on the crown
and its hair whorl.
Row 2, column 2 (center): back of the head and neck seen from directly behind, nape hairline
clearly visible, shoulders at the bottom of the cell.
Row 2, column 3 (middle-right): head and shoulders facing the camera, face fully visible.
Row 3, column 1 (bottom-left): head and shoulders in three-quarter view, nose pointing toward
the RIGHT edge of the image.
Row 3, column 2 (bottom-center): head and shoulders in strict side profile, nose pointing to
the RIGHT edge of the image, ear visible.
Row 3, column 3 (bottom-right): close-up of one cheek and jawline filling the cell, skin texture
clearly visible.
```

### `body.feminine.png`

```text
A single square 1:1 image that is a photo contact sheet: exactly 3 columns by 3 rows of equal
square cells, separated by thin white lines. Each cell is a separate photorealistic studio
photograph of the SAME woman. No text, no labels, no numbers, no captions anywhere.

The woman: adult, about 30, athletic build with visible muscle tone, dark hair tied in a high
bun. She wears a plain dark fitted sports bra (crop top) that leaves the abs, arms and back
visible, plain dark high-waisted leggings, and is barefoot.

Every cell: plain light warm-gray seamless background (#F5F4F0), soft even diffused studio
lighting, sharp focus, natural skin texture, neutral relaxed expression, no tattoos, no jewelry.
The subject is centered in the cell with a small margin; do not cut off parts the cell
description includes.

Row 1, column 1 (top-left): full body head to feet, facing the camera, feet shoulder-width
apart, hands on the waist with elbows pushed out wide.
Row 1, column 2 (top-center): full body head to feet, seen from directly behind, hands on the
waist with elbows out wide, back muscles visible, one heel slightly raised.
Row 1, column 3 (top-right): full body head to feet, strict side profile with the nose and
chest pointing to the RIGHT edge of the image, chest up, near arm bent in front of the torso,
near knee slightly forward on the toes.
Row 2, column 1 (middle-left): cropped from chest to upper thighs, facing the camera, both hands
behind the head, abs clearly visible.
Row 2, column 2 (center): cropped from head to hips, facing the camera, arms hanging relaxed
slightly away from the body.
Row 2, column 3 (middle-right): cropped from head to waist, facing the camera, front
double-biceps pose with both arms raised and flexed.
Row 3, column 1 (bottom-left): cropped from hips to feet, facing the camera, hands on hips, one
leg slightly forward and turned out, thigh muscles visible.
Row 3, column 2 (bottom-center): cropped from lower back to knees, seen from directly behind,
hands on hips, one leg stepped back resting on the toes.
Row 3, column 3 (bottom-right): empty, plain background only.
```

### `head.feminine.png`

```text
A single square 1:1 image that is a photo contact sheet: exactly 3 columns by 3 rows of equal
square cells, separated by thin white lines. Each cell is a separate photorealistic studio
photograph of the SAME woman. No text, no labels, no numbers, no captions anywhere.

The woman: adult, about 30, long dark hair, wearing a plain dark sports bra with thin straps,
shoulders visible.

Every cell: plain light warm-gray seamless background (#F5F4F0), soft even diffused studio
lighting, sharp focus, natural skin and hair texture, neutral relaxed expression, no jewelry.
The head is centered in the cell with a small margin.

Row 1, column 1 (top-left): head and shoulders facing the camera, hair pulled straight back
into a low ponytail so the frontal hairline is fully visible.
Row 1, column 2 (top-center): head and shoulders in three-quarter view, nose pointing toward the
RIGHT edge of the image, hair pulled back into a low ponytail, temple and side hairline clearly
visible.
Row 1, column 3 (top-right): top of the head seen from directly above, hair loose with no bun
and no ponytail, parted in the middle
so the scalp line is visible, shoulders at the edges of the cell.
Row 2, column 1 (middle-left): top of the head seen from directly above, hair loose with no bun
and no ponytail, centered on the crown and its hair whorl.
Row 2, column 2 (center): back of the head and neck seen from directly behind, hair lifted
and held on top of the head so the nape is exposed, nape hairline
clearly visible, shoulders at the bottom of the cell.
Row 2, column 3 (middle-right): head and shoulders facing the camera, hair tied back in a low
ponytail, face fully visible.
Row 3, column 1 (bottom-left): head and shoulders in three-quarter view, nose pointing toward
the RIGHT edge of the image, hair tied back in a low ponytail.
Row 3, column 2 (bottom-center): head and shoulders in strict side profile, nose pointing to
the RIGHT edge of the image, hair tied back in a low ponytail, ear visible.
Row 3, column 3 (bottom-right): close-up of one cheek and jawline filling the cell, skin texture
clearly visible.
```

### `body.neutral.png` (opcional)

```text
A single square 1:1 image that is a photo contact sheet: exactly 3 columns by 3 rows of equal
square cells, separated by thin white lines. Each cell is a separate photorealistic studio
photograph of the SAME person. No text, no labels, no numbers, no captions anywhere.

The person: androgynous adult, about 30, gender-ambiguous face with soft neutral features,
medium build, ear-length tousled dark hair, no makeup, no facial hair, no jewelry. Basic unisex
clothing that reads as neither feminine nor masculine: a plain heather-gray short-sleeve
crew-neck t-shirt with a regular straight fit and plain charcoal straight-cut knee-length
shorts, barefoot. The t-shirt is worn in EVERY cell: never shirtless, never a crop top, sports
bra or tank top, no leggings.

Every cell: plain light warm-gray seamless background (#F5F4F0), soft even diffused studio
lighting, sharp focus, natural skin texture, neutral relaxed expression, no tattoos, no jewelry.
The subject is centered in the cell with a small margin; do not cut off parts the cell
description includes.

Row 1, column 1 (top-left): full body head to feet, facing the camera, feet shoulder-width
apart, hands on the waist with elbows pushed out wide.
Row 1, column 2 (top-center): full body head to feet, seen from directly behind, hands on the
waist with elbows out wide, one heel slightly raised.
Row 1, column 3 (top-right): full body head to feet, strict side profile with the nose and
chest pointing to the RIGHT edge of the image, chest up, near arm bent in front of the torso,
near knee slightly forward on the toes.
Row 2, column 1 (middle-left): cropped from chest to upper thighs, facing the camera, both hands
behind the head, torso outline visible through the t-shirt.
Row 2, column 2 (center): cropped from head to hips, facing the camera, arms hanging relaxed
slightly away from the body.
Row 2, column 3 (middle-right): cropped from head to waist, facing the camera, front
double-biceps pose with both arms raised and flexed.
Row 3, column 1 (bottom-left): cropped from hips to feet, facing the camera, hands on hips, one
leg slightly forward and turned out.
Row 3, column 2 (bottom-center): cropped from lower back to knees, seen from directly behind,
hands on hips, one leg stepped back resting on the toes.
Row 3, column 3 (bottom-right): empty, plain background only.
```

### `head.neutral.png` (opcional)

```text
A single square 1:1 image that is a photo contact sheet: exactly 3 columns by 3 rows of equal
square cells, separated by thin white lines. Each cell is a separate photorealistic studio
photograph of the SAME person. No text, no labels, no numbers, no captions anywhere.

The person: androgynous adult, about 30, gender-ambiguous face with soft neutral features,
medium build, ear-length tousled dark hair, no makeup, no facial hair, no jewelry. Wears a
plain heather-gray crew-neck t-shirt in every cell (never shirtless, no straps, no visible
underwear).

Every cell: plain light warm-gray seamless background (#F5F4F0), soft even diffused studio
lighting, sharp focus, natural skin and hair texture, neutral relaxed expression, no jewelry.
The head is centered in the cell with a small margin.

Row 1, column 1 (top-left): head and shoulders facing the camera, hair pushed back off the
forehead so the frontal hairline is fully visible.
Row 1, column 2 (top-center): head and shoulders in three-quarter view, nose pointing toward the
RIGHT edge of the image, temple and side hairline clearly visible.
Row 1, column 3 (top-right): top of the head seen from directly above, hair parted in the middle
so the scalp line is visible, shoulders at the edges of the cell.
Row 2, column 1 (middle-left): top of the head seen from directly above, centered on the crown
and its hair whorl.
Row 2, column 2 (center): back of the head and neck seen from directly behind, nape hairline
clearly visible, shoulders at the bottom of the cell.
Row 2, column 3 (middle-right): head and shoulders facing the camera, face fully visible.
Row 3, column 1 (bottom-left): head and shoulders in three-quarter view, nose pointing toward
the RIGHT edge of the image.
Row 3, column 2 (bottom-center): head and shoulders in strict side profile, nose pointing to
the RIGHT edge of the image, ear visible.
Row 3, column 3 (bottom-right): close-up of one cheek and jawline filling the cell, skin texture
clearly visible.
```
