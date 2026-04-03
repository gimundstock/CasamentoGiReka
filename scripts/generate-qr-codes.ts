/**
 * Generates per-guest invitation QR codes as PNG files.
 *
 * Usage:
 *   npm run generate-qr -- --base-url https://yourwedding.com --guests guests.csv
 *
 * guests.csv format:
 *   guestId,groupName
 *   abc123,Família Silva
 *   def456,João & Maria
 *
 * Output: qr-codes/{guestId}.png (one per guest)
 *
 * Install qrcode: npm install --save-dev qrcode @types/qrcode
 */

import { createWriteStream, mkdirSync, readFileSync } from 'fs'
import * as path from 'path'

// Dynamic import for qrcode (run: npm install --save-dev qrcode @types/qrcode first)
async function run() {
  const args = process.argv.slice(2)
  const baseUrl = getArg(args, '--base-url') ?? 'https://yourwedding.com'
  const guestsFile = getArg(args, '--guests') ?? 'guests.csv'
  const outDir = getArg(args, '--out') ?? 'qr-codes'

  let QRCode: typeof import('qrcode')
  try {
    QRCode = await import('qrcode')
  } catch {
    console.error('qrcode package not found. Run: npm install --save-dev qrcode @types/qrcode')
    process.exit(1)
  }

  mkdirSync(outDir, { recursive: true })

  const csv = readFileSync(guestsFile, 'utf-8')
  const lines = csv.trim().split('\n').slice(1) // skip header

  let count = 0
  for (const line of lines) {
    const [guestId, groupName] = line.split(',').map((s) => s.trim())
    if (!guestId) continue

    const url = `${baseUrl}/?g=${guestId}`
    const outFile = path.join(outDir, `${guestId}.png`)

    await QRCode.toFile(outFile, url, {
      width: 400,
      margin: 2,
      color: { dark: '#4E784F', light: '#F5D1B2' },
    })

    console.log(`✓ ${groupName ?? guestId} → ${outFile}`)
    count++
  }

  console.log(`\nGenerated ${count} QR codes in ./${outDir}/`)
}

function getArg(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag)
  return idx !== -1 ? args[idx + 1] : undefined
}

run().catch(console.error)
