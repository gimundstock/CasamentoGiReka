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
 * GET against the live Web App. Node's fetch occasionally stalls on the
 * Apps Script redirect while the same request answers in ~2s, so each attempt
 * is capped at 10s and retried up to 3 times.
 */
async function getJson<T>(query: string): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${URL}?${query}`, { signal: AbortSignal.timeout(10_000) })
      expect(res.ok).toBe(true)
      return (await res.json()) as T
    } catch (err) {
      lastError = err
    }
  }
  throw lastError
}

// Each call goes to the live Web App, which can take several seconds to spin
// up from cold, well past Vitest's 5s default.
suite('Apps Script live endpoints (read-only)', { timeout: 45_000 }, () => {
  it('getSoldCotas returns an array', async () => {
    const body = await getJson<{ sold?: unknown }>('action=getSoldCotas')
    expect(body).toHaveProperty('sold')
    expect(Array.isArray(body.sold)).toBe(true)
  })

  it('getGuest with unknown id returns null', async () => {
    expect(await getJson('action=getGuest&id=__definitely_not_a_real_id__')).toBeNull()
  })

  it('unknown action returns an error payload', async () => {
    const body = await getJson<{ error?: string }>('action=__bogus__')
    expect(body.error).toBeTruthy()
  })
})
