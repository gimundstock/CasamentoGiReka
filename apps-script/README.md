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

One mail each, with the card in it:

- `purchaseGift` records the order. The site sends `deferEmail`, so no mail goes yet (without it, an
  older page, the two mails go right away).
- The card step then ends one of three ways, and each sends the same two mails **once**: the
  confirmation to the guest (at the address on their order) and a receipt to the couple (who, what,
  total, how it was paid; Reply-To is the guest). `submitCard` with `completePurchase` sends them with
  the card in full; `finishPurchase` sends them without one (the guest skipped, closed the window or
  left the page).
- **The card is a picture.** The site draws it (the template the guest chose with their text and name
  on it: `src/utils/cardImage.ts`) and sends it as a base64 JPEG with the card. It is shown in both
  mails (inline, `cid:cartao`) and attached to them, and archived in Drive: in the folder of the
  `CARDS_FOLDER_ID` Script Property if set, else in a "Cartões do casamento" folder the script makes
  in the owner's Drive. Its URL goes in the Cards tab (`imageUrl`). Anything but a JPEG within 6 MB is
  ignored and the mails carry the text alone; if Drive refuses (permission), the mails go out anyway.
  Saving to Drive may need the owner to authorize the project once more (Apps Script editor → run any
  function → review permissions).
- The address and the amounts are read from the guest's own order, by column position (the Orders
  header row may lack names), never from the request. The cota names come from the page, for the mail
  text only.
- The Cards tab is created, with its header, if the sheet doesn't have one yet; a missing tab never
  stops the card's mail. A mail that fails (daily quota, a bad address) is logged and never undoes the
  recorded purchase or card.
