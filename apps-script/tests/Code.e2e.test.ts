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

suite('Apps Script live endpoints (read-only)', () => {
  it('getSoldCotas returns an array', async () => {
    const res = await fetch(`${URL}?action=getSoldCotas`)
    expect(res.ok).toBe(true)
    const body = (await res.json()) as { sold?: unknown }
    expect(body).toHaveProperty('sold')
    expect(Array.isArray(body.sold)).toBe(true)
  })

  it('getGuest with unknown id returns null', async () => {
    const res = await fetch(`${URL}?action=getGuest&id=__definitely_not_a_real_id__`)
    expect(res.ok).toBe(true)
    expect(await res.json()).toBeNull()
  })

  it('unknown action returns an error payload', async () => {
    const res = await fetch(`${URL}?action=__bogus__`)
    expect(res.ok).toBe(true)
    const body = (await res.json()) as { error?: string }
    expect(body.error).toBeTruthy()
  })
})
