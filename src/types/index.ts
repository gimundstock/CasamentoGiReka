export interface Guest {
  guestId: string
  groupName: string
  language: 'pt' | 'en'
  attendees: string[]
  hasPhoto: boolean
  /** Set by the backend: the guest already has a row in the RSVPs tab. */
  rsvpSubmitted?: boolean
  /** Set by the backend: who is and isn't coming, from their latest reply. */
  rsvpAttendees?: { name: string; attending: boolean }[]
}

export interface Cota {
  cotaId: string
  giftId: string
  label_pt: string
  label_en: string
  price: number
  purchased: boolean
}

export interface Gift {
  giftId: string
  name_pt: string
  name_en: string
  description_pt: string
  description_en: string
  imageUrl: string
  cotas: Cota[]
  available: number
  total: number
}

export interface RSVPAttendee {
  name: string
  attending: boolean
  menu: string
}

export interface RSVPSubmission {
  guestId: string
  attendees: RSVPAttendee[]
  songRequest: string
  /** Moving to the gift flow; the RSVP form no longer asks for it. */
  message?: string
}

export interface PurchaseSubmission {
  guestId: string
  giftId: string
  giftName: string
  selectedCotaIds: string[]
  selectedCotaLabels: string[]
  totalPrice: number
  guestEmail: string
  cardMessage: string
}
