import { describe, it, expect } from 'vitest'

const URL = process.env.VITE_APPSCRIPT_URL
const SKIP = !URL || URL === 'PLACEHOLDER_APPS_SCRIPT_URL'
const suite = SKIP ? describe.skip : describe

if (SKIP) {
  console.warn(
    '[e2e] VITE_APPSCRIPT_URL not set — skipping live Apps Script tests. ' +
      'Export it locally to run them.',
  )
}

/**
 * GET against the live Web App. Google throttles bursts of requests to a Web
 * App (they stall or are refused before the script even runs), so a failed
 * attempt waits before retrying instead of hammering it: 0s, then 5s, then 15s.
 */
const BACKOFF_MS = [0, 5_000, 15_000]

async function getJson<T>(query: string): Promise<T> {
  let lastError: unknown
  for (const wait of BACKOFF_MS) {
    if (wait) await new Promise((r) => setTimeout(r, wait))
    try {
      const res = await fetch(`${URL}?${query}`, { signal: AbortSignal.timeout(15_000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return (await res.json()) as T
    } catch (err) {
      lastError = err
    }
  }
  throw lastError
}

// Kept to two calls: what the unit tests can't cover (the deployed Web App
// opens the real Sheet and answers). Everything else is tested in Code.test.ts.
suite('Apps Script live endpoints (read-only)', { timeout: 90_000 }, () => {
  it('getSoldCotas reads the Orders tab', async () => {
    const body = await getJson<{ sold?: unknown }>('action=getSoldCotas')
    expect(Array.isArray(body.sold)).toBe(true)
  })

  it('getGuest with unknown id returns null', async () => {
    expect(await getJson('action=getGuest&id=__definitely_not_a_real_id__')).toBeNull()
  })
})
