# Site de Casamento / Wedding Website

Bilingual (PT 🇧🇷 / EN 🇬🇧) guest-personalized wedding website built with React + TypeScript + Vite.

## Features

- **Guest personalization** — each invitation has a unique URL (`?g=GUESTID`) that auto-loads the guest's language, welcome message, seat count, and optional couple photo
- **Gift shop with cotas** — gifts can be split into shares (cotas); guests pick one or more and pay via PIX QR code generated client-side
- **RSVP** — per-person attendance + dinner menu choice + song request + message to the couple
- **Brasília city guide** — hotels, transport, and restaurants organized in a tabbed layout
- **Bilingual** — Portuguese (default) and English, switchable at any time
- **No server** — persistence via Google Sheets + Google Apps Script; email via Gmail

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + custom wildflower SVGs |
| i18n | i18next + react-i18next |
| Data | Google Sheets + Google Apps Script |
| PIX QR | Custom EMV payload builder + react-qrcode-logo |
| Hosting | GitHub Pages + custom domain |
| CI/CD | GitHub Actions |

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). In demo mode (no Apps Script configured) any name is accepted.

## Configuration

All wedding-specific content lives in **`src/content.config.ts`**:

- Couple names, PIX key, and couple email
- Wedding date, time, venue, dress code
- Gift list with cotas (shares) and prices
- Brasília city guide (hotels, transport, restaurants)
- Dinner menu options
- RSVP deadline

## Backend setup (Google Sheets + Apps Script)

1. Create a Google Spreadsheet with 5 tabs: `Guests`, `Gifts`, `Cotas`, `RSVPs`, `Orders`
2. Open **script.google.com**, create a new project, paste `apps-script/Code.gs`
3. Set `SHEET_ID` and `COUPLE_EMAIL` at the top of the script
4. Deploy → **Web App** (Execute as: Me / Access: Anyone) and copy the URL
5. Paste the URL into `src/content.config.ts → appScriptUrl`

See column headers in `CLAUDE.md` or `apps-script/Code.gs` for the exact sheet structure.

## Guest photos

Place photos at `public/photos/{guestId}.jpg`. If `hasPhoto = true` in the Guests sheet, the welcome hero shows that photo instead of the default couple photo (`public/photos/couple.jpg`).

## Invitation QR codes

Each printed invitation gets a QR code that links to the guest's personalized URL:

```bash
# Install qrcode package first (one-time)
npm install --save-dev qrcode @types/qrcode

# Generate PNGs from a CSV
npm run generate-qr -- --base-url https://yourwedding.com --guests guests.csv
```

`guests.csv` format:
```
guestId,groupName
abc123,Família Silva
def456,João & Maria
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Local dev server |
| `npm run typecheck` | TypeScript type check |
| `npm run lint` | ESLint |
| `npm run format` | Prettier (auto-fix) |
| `npm run format:check` | Prettier (check only, used in CI) |
| `npm run release` | Full quality gate: typecheck + lint + format:check + build |
| `npm run build` | Production build |

## CI / CD

- **Every push & PR** — GitHub Actions runs `typecheck`, `lint`, and `format:check` (`.github/workflows/ci.yml`)
- **Push to `main`** — runs the full `release` script then deploys to GitHub Pages (`.github/workflows/deploy.yml`)

## Deploying to GitHub Pages

1. Push the repo to GitHub
2. Go to **Settings → Pages → Source: GitHub Actions**
3. The deploy workflow triggers automatically on the next push to `main`
4. To use a custom domain, add a `CNAME` file to `public/` with your domain name

## Color palette

| Color | Hex | Usage |
|---|---|---|
| Warm Peach | `#F5D1B2` | Backgrounds, cards |
| Muted Mauve | `#AA9DA9` | Secondary text, borders |
| Sage Green | `#ADB897` | Section accents, nature elements |
| Forest Green | `#4E784F` | Primary headings, buttons |
| Amber | `#DC8000` | Prices, highlights |
| Gold | `#DFB100` | Stars, countdown, accents |
