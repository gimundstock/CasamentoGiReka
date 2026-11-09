#!/usr/bin/env node
/**
 * Copies every guest photo from Google Drive into the site, so guests' pages
 * never load images from Drive (it rate-limits them, 429).
 *
 *   node scripts/sync-guest-photos.mjs <outDir>
 *
 * Needs VITE_APPSCRIPT_URL and PHOTO_SYNC_TOKEN. The backend's photoManifest
 * lists the Drive file IDs; each photo is saved as <outDir>/<fileId>.jpg (a
 * long random ID, so nobody can guess another guest's photos), at most 1600px
 * wide. The photos never go into git.
 *
 * Never fails the deploy: on any trouble it warns and the site falls back to
 * Drive for the photos it doesn't have.
 */
import { mkdir, readdir, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'

const outDir = process.argv[2]
const { VITE_APPSCRIPT_URL: appUrl, PHOTO_SYNC_TOKEN: token } = process.env

// GitHub Actions shows these as yellow annotations on the run.
const warn = (msg) =>
  console.log(process.env.GITHUB_ACTIONS ? `::warning::Guest photos: ${msg}` : `⚠ ${msg}`)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  if (!outDir) throw new Error('usage: sync-guest-photos.mjs <outDir>')
  if (!appUrl || !token) {
    warn('VITE_APPSCRIPT_URL or PHOTO_SYNC_TOKEN not set, skipping the copy')
    return
  }

  const url = `${appUrl}?action=photoManifest&token=${encodeURIComponent(token)}`
  const manifest = await (await fetch(url, { redirect: 'follow' })).json()
  if (!Array.isArray(manifest.ids)) {
    warn(`the backend answered ${JSON.stringify(manifest).slice(0, 200)}`)
    return
  }

  await mkdir(outDir, { recursive: true })
  // Drop copies of photos no longer in Drive, so a removed photo goes too.
  const keep = new Set(manifest.ids.map((id) => `${id}.jpg`))
  for (const f of await readdir(outDir)) {
    if (!keep.has(f)) await rm(join(outDir, f))
  }
  const have = new Set(await readdir(outDir))

  let copied = 0
  const failed = []
  // One at a time, with a pause: asking Drive for many at once is what gets 429.
  for (const id of manifest.ids) {
    if (have.has(`${id}.jpg`)) continue
    const bytes = await download(id)
    if (bytes) {
      await writeFile(join(outDir, `${id}.jpg`), bytes)
      copied++
    } else {
      failed.push(id)
    }
    await sleep(300)
  }

  console.log(
    `Guest photos: ${manifest.ids.length} in Drive, ${copied} copied, ` +
      `${manifest.ids.length - copied - failed.length} already here`,
  )
  if (failed.length) warn(`${failed.length} could not be copied; the site shows them from Drive`)
}

/** The photo as JPEG at most 1600px wide, retrying when Drive says 429. */
async function download(id) {
  for (const wait of [0, 5000, 15000, 45000]) {
    if (wait) await sleep(wait)
    try {
      const res = await fetch(`https://lh3.googleusercontent.com/d/${id}=w1600-rj`)
      const type = res.headers.get('content-type') || ''
      if (res.ok && type.startsWith('image/')) return Buffer.from(await res.arrayBuffer())
      if (res.status !== 429 && res.status < 500) return null
    } catch {
      // network hiccup: try again
    }
  }
  return null
}

main().catch((e) => warn(String(e)))
