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
