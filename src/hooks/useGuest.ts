import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getGuestById, getGuestByName } from '../api/sheets'
import type { Guest } from '../types'
import { CONFIG } from '../content.config'

const STORAGE_KEY = 'wedding_guest'

// When Apps Script isn't configured yet, use a demo guest for development
const DEMO_GUEST: Guest = {
  guestId: 'demo',
  groupName: 'Família Demo',
  language: 'pt',
  attendees: ['João Demo', 'Maria Demo', 'Pedro Demo'],
  hasPhoto: false,
}

export type GuestState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'found'; guest: Guest }
  | { status: 'not_found' }
  | { status: 'error' }

export function useGuest() {
  const [searchParams] = useSearchParams()
  const { i18n } = useTranslation()
  const [state, setState] = useState<GuestState>({ status: 'idle' })

  // On mount: try URL param first, then localStorage
  useEffect(() => {
    const guestIdFromUrl = searchParams.get('g')
    const stored = localStorage.getItem(STORAGE_KEY)

    if (guestIdFromUrl) {
      loadGuestById(guestIdFromUrl)
    } else if (stored) {
      try {
        const parsed = JSON.parse(stored) as Guest
        setState({ status: 'found', guest: parsed })
        i18n.changeLanguage(parsed.language)
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadGuestById(id: string) {
    // Demo mode when Apps Script not configured
    if (CONFIG.appScriptUrl === 'PLACEHOLDER_APPS_SCRIPT_URL') {
      const guest = { ...DEMO_GUEST, guestId: id }
      setState({ status: 'found', guest })
      persist(guest)
      return
    }

    setState({ status: 'loading' })
    const guest = await getGuestById(id)
    if (guest) {
      setState({ status: 'found', guest })
      persist(guest)
    } else {
      setState({ status: 'not_found' })
    }
  }

  async function lookupByName(name: string) {
    // Demo mode
    if (CONFIG.appScriptUrl === 'PLACEHOLDER_APPS_SCRIPT_URL') {
      const guest: Guest = { ...DEMO_GUEST, groupName: name, attendees: [name] }
      setState({ status: 'found', guest })
      persist(guest)
      return
    }

    setState({ status: 'loading' })
    const guest = await getGuestByName(name)
    if (guest) {
      setState({ status: 'found', guest })
      persist(guest)
    } else {
      setState({ status: 'not_found' })
    }
  }

  function persist(guest: Guest) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(guest))
    i18n.changeLanguage(guest.language)
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY)
    setState({ status: 'idle' })
  }

  return { state, lookupByName, reset }
}
