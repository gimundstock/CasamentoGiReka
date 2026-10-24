# Apps Script backend

`Code.gs` is the whole backend. It is pushed to the Apps Script project with
[clasp](https://github.com/google/clasp) and served as a Web App.

## Private values stay out of git

| What | Where it lives |
|---|---|
| `SHEET_ID`, `COUPLE_EMAILS` | Apps Script editor → **Project Settings → Script properties** |
| `scriptId` | `.clasp.json` (gitignored; template in `.clasp.json.example`) |
| clasp login | `~/.clasprc.json` in your home folder (never in the repo) |
| Web App URL | `.env.local` → `VITE_APPSCRIPT_URL`, and the GitHub Actions secret |
| Deployment ID | `.env.local` → `APPSCRIPT_DEPLOYMENT_ID` |

`COUPLE_EMAILS` is comma-separated and must mirror `CONFIG.coupleEmails` in
`src/content.config.ts`. A missing property makes every request return
`{ "error": "Missing Script Property: …" }`.

## One-time setup

1. `npx clasp login` (opens the browser; credentials go to `~/.clasprc.json`).
2. Enable the Apps Script API for your account: https://script.google.com/home/usersettings
3. `cp .clasp.json.example .clasp.json` and paste the `scriptId`
   (editor → Project Settings → IDs → Script ID).
4. In the editor, add the two Script properties above.
5. Add `APPSCRIPT_DEPLOYMENT_ID` to `.env.local` (`npx clasp deployments`).

## Day to day

| Command | What it does |
|---|---|
| `npm run backend:pull` | Downloads the live project to a temp folder and diffs it against `apps-script/`. Never writes to the repo. |
| `npm run backend:push` | Uploads `Code.gs` + `appsscript.json` (only those — see `.claspignore`). Changes the editor's code, not the live Web App. |
| `npm run backend:deploy` | Push, then publish a new version on the existing deployment. The `/exec` URL stays the same. |

Run `npm test` before deploying: the unit tests run `Code.gs` in a sandbox.
