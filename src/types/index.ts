export interface Guest {
  guestId: string
  groupName: string
  language: 'pt' | 'en'
  attendees: string[]
  hasPhoto: boolean
  notes?: string
}

export interface Cota {
  cotaId: string
  giftId: string
  label_pt: string
  label_en: string
  price: number
  purchased: boolean
  purchasedBy?: string
  purchasedAt?: string
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
  message: string
}

export interface PurchaseSubmission {
  guestId: string
  giftId: string
  giftName: string
  selectedCotaIds: string[]
  totalPrice: number
  guestEmail: string
  cardMessage: string
}
