import { CONFIG } from '../content.config'
import type { Guest, Gift, RSVPSubmission, PurchaseSubmission } from '../types'

const BASE_URL = CONFIG.appScriptUrl

async function get<T>(params: Record<string, string>): Promise<T> {
  const url = new URL(BASE_URL)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json() as Promise<T>
}

async function post<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json() as Promise<T>
}

export async function getGuestById(id: string): Promise<Guest | null> {
  try {
    return await get<Guest>({ action: 'getGuest', id })
  } catch {
    return null
  }
}

export async function getGuestByName(name: string): Promise<Guest | null> {
  try {
    return await get<Guest>({ action: 'getGuest', name })
  } catch {
    return null
  }
}

export async function getGifts(): Promise<Gift[]> {
  const soldIds =
    BASE_URL === 'PLACEHOLDER_APPS_SCRIPT_URL'
      ? new Set<string>()
      : new Set(await fetchSoldCotaIds())

  return CONFIG.gifts.map((g) => {
    const cotas = g.cotas.map((c) => ({
      ...c,
      giftId: g.giftId,
      purchased: soldIds.has(c.cotaId),
    }))
    return {
      ...g,
      cotas,
      total: cotas.length,
      available: cotas.filter((c) => !c.purchased).length,
    }
  })
}

async function fetchSoldCotaIds(): Promise<string[]> {
  try {
    const res = await get<{ sold?: string[] }>({ action: 'getSoldCotas' })
    return res.sold ?? []
  } catch {
    return []
  }
}

export async function purchaseGift(data: PurchaseSubmission): Promise<{ success: boolean }> {
  return post<{ success: boolean }>({
    action: 'purchaseGift',
    guestId: data.guestId,
    giftId: data.giftId,
    giftName: data.giftName,
    selectedCotaIds: data.selectedCotaIds,
    selectedCotaLabels: data.selectedCotaLabels,
    totalPrice: data.totalPrice,
    guestEmail: data.guestEmail,
    cardMessage: data.cardMessage,
  })
}

export async function submitRSVP(data: RSVPSubmission): Promise<{ success: boolean }> {
  return post<{ success: boolean }>({
    action: 'submitRSVP',
    guestId: data.guestId,
    attendeesJson: JSON.stringify(data.attendees),
    songRequest: data.songRequest,
    message: data.message,
  })
}
