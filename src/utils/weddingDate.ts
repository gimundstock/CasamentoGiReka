import { CONFIG } from '../content.config'

/**
 * When the ceremony starts, in Brasília's time (UTC−3, no daylight saving):
 * an ISO instant, the same everywhere — what the countdown counts to. (The
 * date as printed is plain text in CONFIG.wedding, never worked out here.)
 */
export function ceremonyStart() {
  const [h = 0, m = 0] = CONFIG.wedding.time.split(/\D+/).map(Number)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${CONFIG.wedding.date}T${pad(h)}:${pad(m)}:00-03:00`
}
