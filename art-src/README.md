# Artwork sources

Originals that the site doesn't load directly. Anything in `public/` ships with
the site, so heavy sources live here instead.

| Source | Shipped as | How |
|---|---|---|
| `cerrado/lines.svg` (4 MB vector) | `public/cerrado/lines.webp` | Rendered at 3200px wide on a transparent background, WebP q90. Safari re-rasterised the SVG on every move along the sun's path and stuttered. |
| `public/cerrado/lines.webp` | `public/cerrado/lines-1600.webp` | The same, halved (1600 × 894), for screens that draw it on ~1700 pixels or fewer: `dwebp lines.webp -o lines.png && cwebp -q 90 -alpha_q 100 -resize 1600 894 lines.png -o lines-1600.webp`. Redo it whenever `lines.webp` changes. |
