import { CONFIG } from '../content.config'

/**
 * The wedding day, to print. `new Date('2027-06-05')` is midnight UTC, which
 * in Brasília (UTC−3) is still the 4th: read at local noon, no time zone
 * moves it a day.
 */
export const weddingDay = () => new Date(`${CONFIG.wedding.date}T12:00:00`)

/**
 * When the ceremony starts, in Brasília's time (UTC−3, no daylight saving):
 * an ISO instant, the same everywhere — what the countdown counts to.
 */
export function ceremonyStart() {
  const [h = 0, m = 0] = CONFIG.wedding.time.split(/\D+/).map(Number)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${CONFIG.wedding.date}T${pad(h)}:${pad(m)}:00-03:00`
}
