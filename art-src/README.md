# Artwork sources

Originals that the site doesn't load directly. Anything in `public/` ships with
the site, so heavy sources live here instead.

| Source | Shipped as | How |
|---|---|---|
| `cerrado/lines.svg` (4 MB vector) | `public/cerrado/lines.webp` | Rendered at 3200px wide on a transparent background, WebP q90. Safari re-rasterised the SVG on every move along the sun's path and stuttered. |
