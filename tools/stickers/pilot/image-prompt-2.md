# Encargo para un agente con generación de imágenes: segunda tanda del piloto de stickers (PA-30)

Generate 6 bird illustrations with your built-in image generation tool (one call per species) and
save them in this workspace. This is the only task: do not edit, create or delete any other file.

## Style reference

Use the two attached images as the style reference for every illustration:
`tools/stickers/pilot/refs/shorebird.png` and `tools/stickers/pilot/refs/oystercatcher.png`.
They are flat vector bird figures from the app's design. Match their style exactly, but draw the
species asked for, not the birds in the references.

## Prompt for each image

Use this prompt for each species, replacing the parts in braces with the values from the table:

> Create a sticker illustration of a {English name} ({scientific name}), a bird species found in Ica, Peru.
> Draw the adult (the male in breeding plumage if the sexes differ) with the field marks of this exact species: plumage colors and pattern, bill shape and color, leg color and eye.
> Match exactly the illustration style of the two reference images: flat vector shapes in solid colors, no outlines, no gradients, no texture, no shading, only a few simple lighter strokes for feather detail, a round dark eye with a small white highlight, legs as simple thick lines with short line feet.
> Composition: the full bird in side profile, facing left, standing or perched with nothing under it, centered and filling about 80% of the square.
> Background: one solid flat color, pure {background name} ({background hex}), edge to edge. No ground, no shadow, no branch, no text, no border.

Square images (1:1). The background must be one flat color: it is removed afterwards.

| File name | English name | Scientific name | Background name | Background hex |
|---|---|---|---|---|
| `larosterna-inca.png` | Inca Tern | Larosterna inca | green | #00FF00 |
| `vultur-gryphus.png` | Andean Condor | Vultur gryphus | green | #00FF00 |
| `phalacrocorax-bougainvillii.png` | Guanay Cormorant | Phalacrocorax bougainvillii | green | #00FF00 |
| `falco-sparverius.png` | American Kestrel | Falco sparverius | green | #00FF00 |
| `columbina-cruziana.png` | Croaking Ground Dove | Columbina cruziana | green | #00FF00 |
| `zonotrichia-capensis.png` | Rufous-collared Sparrow | Zonotrichia capensis | green | #00FF00 |

## Where to save

Save each image as PNG in the folder named in the request (for example
`apps/mobile/assets/sticker-pilot/raw/`), with the file name from the table. If your tool saves
images somewhere else first, copy them into that folder.

When all 6 are saved, create `DONE-2.txt` in the same folder listing the six files and the image
model you used.
