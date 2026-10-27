# Encargo para el agente de Antigravity: ilustraciones del piloto de stickers (PA-30)

Generate 6 bird illustrations with your image generation tool and save them in this workspace.
This is the only task: do not edit, create or delete any other file, and do not run terminal commands.

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
| `pyrocephalus-rubinus.png` | Vermilion Flycatcher | Pyrocephalus rubinus | magenta | #FF00FF |
| `phoenicopterus-chilensis.png` | Chilean Flamingo | Phoenicopterus chilensis | green | #00FF00 |
| `pelecanus-thagus.png` | Peruvian Pelican | Pelecanus thagus | magenta | #FF00FF |
| `rhodopis-vesper.png` | Oasis Hummingbird | Rhodopis vesper | blue | #0000FF |
| `quechuavis-decussata.png` | Tschudi's Nightjar | Quechuavis decussata | magenta | #FF00FF |
| `geositta-peruviana.png` | Coastal Miner | Geositta peruviana | magenta | #FF00FF |

## Where to save

Save each image as PNG at `apps/mobile/assets/sticker-pilot/raw/<file name>`, for example
`apps/mobile/assets/sticker-pilot/raw/pyrocephalus-rubinus.png`.

When all 6 are saved, create `apps/mobile/assets/sticker-pilot/raw/DONE.txt` listing the six files
and the name of the image model you used.
