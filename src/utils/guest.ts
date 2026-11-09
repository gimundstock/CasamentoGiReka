import type { Guest } from '../types'

/** The name the site greets a guest by: displayName, else the invitation's. */
export function guestName(guest: Guest): string {
  return guest.displayName || guest.groupName
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
