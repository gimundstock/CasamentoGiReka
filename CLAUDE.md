# Wedding Website — Project Context for Claude

## What this project is
A bilingual (PT default / EN secondary), guest-personalized wedding website for an outdoor celebration in Brasília, Brasil. Every section is fully customizable through `src/content.config.ts` — never hardcode wedding details elsewhere.

## Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + custom wildflower SVG decorations
- **i18n**: i18next + react-i18next (PT/EN)
- **Data/API**: Google Sheets (5 tabs) + Google Apps Script Web App
- **Email**: Apps Script → Gmail (500/day free)
- **PIX QR**: custom EMV payload builder (`src/utils/pix.ts`) + react-qrcode-logo
- **Linting/Formatting**: ESLint 9 (flat config) + Prettier
- **Hosting**: GitHub Pages + custom domain (GitHub Actions CI/CD)

## Architecture decisions
- **No server**: All persistence via Google Sheets + Apps Script. The frontend calls the Apps Script URL directly.
- **Guest personalization**: URL param `?g=GUESTID` auto-loads guest profile. Fallback: name entry screen with fuzzy search.
- **PIX payments**: Client-side QR generation from the PIX EMV spec. One PIX key for all gifts, per-cota amounts.
- **Gift model**: Gifts are containers; pricing/availability lives in Cotas (portions). A guest can buy multiple cotas at once.
- **No credit card / no cloud costs**: Firebase rejected in favor of Google Sheets + Apps Script (100% free, no account needed beyond Google).

## Google Sheets tabs
1. **Guests** — guestId, groupName, language, attendees (comma-sep), hasPhoto, notes
2. **Gifts** — giftId, name_pt, name_en, description_pt, description_en, imageUrl
3. **Cotas** — cotaId, giftId, label_pt, label_en, price, purchased, purchasedBy, purchasedAt
4. **RSVPs** — timestamp, guestId, groupName, attendeesJson, menuChoicesJson, songRequest, message
5. **Orders** — timestamp, guestId, groupName, guestEmail, giftId, giftName, selectedCotas, totalPrice, cardMessage

## Apps Script endpoints
- `GET ?action=getGuest&id=X` or `?action=getGuest&name=X`
- `GET ?action=getGifts` — returns gifts with nested cotas + availability counts
- `POST {action:'purchaseGift', guestId, selectedCotaIds, guestEmail, cardMessage}`
- `POST {action:'submitRSVP', guestId, attendeesJson, menuChoicesJson, songRequest, message}`

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start local dev server on :5173 |
| `npm run typecheck` | TypeScript type check (no emit) |
| `npm run lint` | ESLint — TypeScript + React hooks rules |
| `npm run format` | Prettier — auto-format `src/**/*.{ts,tsx,css}` |
| `npm run format:check` | Prettier — check formatting (used in CI) |
| `npm run release` | Full quality gate: typecheck + lint + format:check + build |
| `npm run build` | Production build to `dist/` |
| `npm run generate-qr` | Generate per-guest invitation QR PNGs (requires `qrcode` package) |

## CI / CD

- **`.github/workflows/ci.yml`** — Runs `typecheck`, `lint`, `format:check` on every push and every PR.
- **`.github/workflows/deploy.yml`** — Runs `npm run release` (full quality gate) then deploys to GitHub Pages on push to `main`.

## Git workflow

**Never push directly to `main`.** All changes go through a PR.

1. Create a feature branch: `git checkout -b feat/short-description`
2. Make commits on that branch
3. Run `npm run release` locally to verify everything passes
4. Push the branch: `git push -u origin feat/short-description`
5. Open a PR: `gh pr create ...`
6. CI runs automatically — merge once it passes
7. The deploy workflow triggers on merge to `main`

Group related changes in the same PR. Unrelated changes (e.g. content updates vs. new features) go in separate branches and PRs.

## Code style

- No semicolons, single quotes, 2-space indent, 100-char print width (enforced by Prettier).
- ESLint enforces TypeScript strict rules + React hooks rules.
- TypeScript `noUnusedLocals` / `noUnusedParameters` enforced via `tsconfig.app.json`.

## Key files
| File | Purpose |
|---|---|
| `src/content.config.ts` | ALL wedding content — edit this to customize |
| `src/api/sheets.ts` | All fetch calls to Apps Script |
| `src/hooks/useGuest.ts` | Guest lookup, URL param, localStorage cache |
| `src/hooks/useGifts.ts` | Gift list + availability polling |
| `src/utils/pix.ts` | PIX QR payload builder |
| `src/i18n/pt.json` | Portuguese translations |
| `src/i18n/en.json` | English translations |
| `apps-script/Code.gs` | Google Apps Script source (deploy separately) |
| `scripts/generate-qr-codes.ts` | Generates per-guest invitation QR PNGs |

## Color palette
| Hex | Name | Usage |
|---|---|---|
| `#F5D1B2` | Warm Peach | Page backgrounds, cards |
| `#AA9DA9` | Muted Mauve | Secondary text, subtle borders |
| `#ADB897` | Sage Green | Section backgrounds, nature accents |
| `#4E784F` | Forest Green | Primary headings, CTA buttons |
| `#DC8000` | Amber | Gift prices, PIX button, highlights |
| `#DFB100` | Gold | Countdown numbers, accent stars |

## Theme
Outdoor celebration, wildflowers, delicate and natural. Use SVG wildflower illustrations (in `src/components/ui/WildflowerDecor.tsx`) as section dividers and hero overlays.

## Content to fill in (all in content.config.ts)
- Couple's names, wedding date, time, venue, address, dress code
- PIX key (CPF / phone / email / random key)
- Couple's email (for receiving RSVP + gift copies)
- Apps Script Web App URL (after deploying Code.gs)
- Gift list with cotas
- City guide: hotels, transport, restaurants
- Dinner menu options
- RSVP deadline

## Guest photos
Place per-guest photos in `public/photos/{guestId}.jpg`. If `hasPhoto=true` in the Guests sheet, the welcome hero shows that photo. Otherwise shows the default couple photo.
