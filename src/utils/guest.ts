import type { Guest } from '../types'

/** The name the site greets a guest by: displayName, else the invitation's. */
export function guestName(guest: Guest): string {
  return guest.displayName || guest.groupName
}
