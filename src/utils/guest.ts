import type { Guest } from '../types'

/** The name the site greets a guest by: displayName, else the invitation's. */
export function guestName(guest: Guest): string {
  return guest.displayName || guest.groupName
}

/**
 * The i18next options for words that agree with the invitation: count, its
 * attendees (singular for one, plural for a group), and context, the
 * `genero` column ('female', 'male', or none when blank, for the neutral
 * "convidado(a)" / "convidados").
 */
export function invitationOptions(guest: Guest): { count: number; context?: 'female' | 'male' } {
  const count = Math.max(1, guest.attendees.length)
  if (guest.gender === 'f') return { count, context: 'female' }
  if (guest.gender === 'm') return { count, context: 'male' }
  return { count }
}

/**
 * What the padrinhos are, in English, for the manual: bridesmaid(s) or
 * groomsman / groomsmen from the invitation's gender (the `genero` column)
 * and how many padrinhos it has; both when it's mixed. `guide` is the
 * manual's name ("Bridesmaid’s guide"). (Portuguese says "padrinhos" for all.)
 */
export function padrinhoRoleEn(guest: Guest): { role: string; guide: string } {
  const n = Math.max(1, guest.padrinhos?.length ?? 0)
  if (guest.gender === 'f') {
    return n === 1
      ? { role: 'bridesmaid', guide: 'Bridesmaid’s guide' }
      : { role: 'bridesmaids', guide: 'Bridesmaids’ guide' }
  }
  if (guest.gender === 'm') {
    return n === 1
      ? { role: 'groomsman', guide: 'Groomsman’s guide' }
      : { role: 'groomsmen', guide: 'Groomsmen’s guide' }
  }
  if (n > 2) return { role: 'bridesmaids and groomsmen', guide: 'Bridesmaids & groomsmen guide' }
  // Two (a couple), or one whose gender the sheet doesn't say.
  return n === 2
    ? { role: 'bridesmaid and groomsman', guide: 'Bridesmaid & groomsman guide' }
    : { role: 'bridesmaid or groomsman', guide: 'Bridesmaid & groomsman guide' }
}

/**
 * The carousel's photos after the celebration: the guest's own first, then
 * as many of the defaults as they lack. Each guest photo pushes out the last
 * default still there: no photos, all the defaults; one, theirs then all
 * but the last default; as many as the defaults or more, only theirs.
 */
export function withDefaultPhotos<T>(guestPhotos: T[], defaults: readonly T[]): T[] {
  return [...guestPhotos, ...defaults.slice(0, Math.max(0, defaults.length - guestPhotos.length))]
}

/**
 * Where to show each of the guest's photos from. The deploy copies every
 * guest photo from Drive into the site as guest-photos/<driveFileId>.jpg
 * (scripts/sync-guest-photos.mjs), so that copy comes first; the Drive URL
 * is the fallback for a photo added since the last deploy.
 */
export function guestPhotoSources(
  guest: Guest,
  base: string
): { src: string; fallbackSrc?: string }[] {
  return (guest.photos ?? []).map((url) => {
    const id = url.match(/googleusercontent\.com\/d\/([^=/?#]+)/)?.[1]
    return id ? { src: `${base}guest-photos/${id}.jpg`, fallbackSrc: url } : { src: url }
  })
}
