# Apps Script backend

`Code.gs` is the whole backend. It is pushed to the Apps Script project with
[clasp](https://github.com/google/clasp) and served as a Web App.

## Private values stay out of git

| What | Where it lives |
|---|---|
| `SHEET_ID`, `COUPLE_EMAILS` | Apps Script editor → **Project Settings → Script properties** |
| `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`, `PAYPAL_ENV` | Same place. Only for PayPal gifts; `PAYPAL_ENV=live` for real payments, unset = sandbox |
| `GUEST_PHOTOS_FOLDER_ID` | Same place. Optional: the Drive folder of guest photos (below) |
| `PHOTO_SYNC_TOKEN` | Same place, **and** the GitHub Actions secret of the same name (below) |
| `scriptId` | `.clasp.json` (gitignored; template in `.clasp.json.example`) |
| clasp login | `~/.clasprc.json` in your home folder (never in the repo) |
| Web App URL | `.env.local` → `VITE_APPSCRIPT_URL`, and the GitHub Actions secret |
| Deployment ID | taken from `VITE_APPSCRIPT_URL` (override with `APPSCRIPT_DEPLOYMENT_ID` in `.env.local`) |

`COUPLE_EMAILS` is comma-separated and must mirror `CONFIG.coupleEmails` in
`src/content.config.ts`.

## Emails

- **A gift** (`purchaseGift`): a confirmation to the guest (at the address they gave) and a
  separate receipt to the couple, who get theirs even if the guest left no address.
- **A card** (`submitCard`, written after the gift): the card in full, to the couple and as a copy to
  the guest. The address is taken from the guest's own order in the Orders tab, never from the request.
- A mail that fails (daily quota, a bad address) is logged and never undoes the recorded purchase or card. A missing property makes every request return
`{ "error": "Missing Script Property: …" }`.

### PayPal

The browser only lets the guest *approve* a PayPal order; `Code.gs` captures it
(`capturePaypalOrder`) after checking the cotas are still free, so a cota sold
in the meantime never charges anyone, and an order ID that PayPal didn't
complete never reaches the Orders tab. The Secret is used only here.

Calling PayPal needs the "connect to an external service" permission: after
the first push with PayPal, run any function once in the editor (e.g.
`handleGetSoldCotas`) and accept the new permission, then `backend:deploy`.
Until then, PayPal purchases fail and PIX keeps working.

Add four headers to the Orders tab, after `cardMessage`: `paymentMethod`,
`currency`, `amountPaid`, `paymentRef`.

### Guest photos (Google Drive)

Guest photos stay out of this public repo. In Drive, one main folder holds a
subfolder per guest, named exactly by their `guestId` (`r27`), with any number
of photos (any image type, any file names; shown in file-name order).

1. Share the main folder as **Anyone with the link → Viewer**, so the site can
   show the photos (the links are long random IDs, not listed anywhere).
2. Put the folder's ID (the part after `/folders/` in its URL) in the
   `GUEST_PHOTOS_FOLDER_ID` Script Property.
3. After the first push with this, run any function once in the editor and
   accept the Drive permission, then `backend:deploy`.

The deploy copies every photo into the site (`guest-photos/<driveFileId>.jpg`,
never in git), so guests' pages don't load from Drive, which rate-limits
images (429). It runs on every merge to `main` and daily at 06:00 Brasília;
a photo added in between shows from Drive until then. To copy right away:
GitHub → Actions → *Deploy to GitHub Pages* → *Run workflow*.

The copy lists the photos through `?action=photoManifest&token=…`. Set the
same long random string as the `PHOTO_SYNC_TOKEN` Script Property and GitHub
secret; without it the deploy skips the copy (with a warning) and the site
shows every photo from Drive.

## One-time setup

1. `npx clasp login` (opens the browser; credentials go to `~/.clasprc.json`).
2. Enable the Apps Script API for your account: https://script.google.com/home/usersettings
3. `cp .clasp.json.example .clasp.json` and paste the `scriptId`
   (editor → Project Settings → IDs → Script ID).
4. In the editor, add the two Script properties above.

## Day to day

| Command | What it does |
|---|---|
| `npm run backend:pull` | Downloads the live project to a temp folder and diffs it against `apps-script/`. Never writes `Code.gs` (the live file may be called `Código`). |
| `npm run backend:push` | Uploads `Code.gs` + `appsscript.json` (only those — see `.claspignore`). Changes the editor's code, not the live Web App. |
| `npm run backend:deploy` | Push, then publish a new version on the existing deployment. The `/exec` URL stays the same. |

Run `npm test` before deploying (the unit tests run `Code.gs` in a sandbox), and `npm run test:e2e` after, to check the live Web App.

Google throttles bursts of requests to a Web App: they stall or come back refused before the script runs (the editor's **Executions** stay under a second). Keep live checks few and spaced; the e2e helper backs off 5s, then 15s, between attempts.
