export interface Guest {
  guestId: string
  /** The name on the invitation; guests log in with it. */
  groupName: string
  /**
   * How the site addresses them ("Mãe e Pai"). The backend falls back to
   * groupName; older cached guests may lack it, so read it via guestName().
   */
  displayName?: string
  language: 'pt' | 'en'
  attendees: string[]
  /** The guest's own photos (from their Drive folder), shown first in the carousel. */
  photos?: string[]
  /** Part of the wedding party: the site also shows the padrinhos' manual. */
  padrinho?: boolean
  /** The invitation's padrinhos, by name: the manual is made out to them. */
  padrinhos?: string[]
  /**
   * The invitation's grammatical gender (the `genero` column), for the
   * Portuguese "convidado/a/os/as". Blank: convidado(a) / convidados.
   */
  gender?: 'f' | 'm' | ''
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
  paymentMethod?: 'pix' | 'paypal'
  /** The PayPal order the guest approved; the Apps Script captures it. */
  paypalOrderId?: string
  /** Hold the gift's two mails until the card step is over (the card goes in them). */
  deferEmail?: boolean
}

export interface CardSubmission {
  guestId: string
  giftName: string
  theme: string
  from: string
  message: string
  /** Send the gift's mails now, with the card (they were held: see deferEmail). */
  completePurchase?: boolean
  /** The cota names, shown in those mails. */
  selectedCotaLabels?: string[]
}

/** The guest is done without a card: send the gift's held mails as they are. */
export interface FinishSubmission {
  guestId: string
  giftName: string
  selectedCotaLabels: string[]
}
