import { useState, useEffect, useRef } from 'react'
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
}

export type GuestState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'found'; guest: Guest }
  | { status: 'not_found' }
  | { status: 'error' }

export function useGuest() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { i18n } = useTranslation()
  const [state, setState] = useState<GuestState>({ status: 'idle' })
  // Bumped by "not you?": an answer from the backend that was on its way
  // (the background refresh of a cached guest, a lookup) is then dropped
  // when it lands, instead of logging the guest back in.
  const generation = useRef(0)

  // On mount: try URL param first, then localStorage. A cached guest shows
  // straight away and is then refreshed from the backend, so what comes from
  // the Sheet (e.g. whether they already replied) is never stale.
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
        refreshGuest(parsed.guestId)
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

    const gen = generation.current
    setState({ status: 'loading' })
    const guest = await getGuestById(id)
    if (gen !== generation.current) return
    if (guest) {
      setState({ status: 'found', guest })
      persist(guest)
    } else {
      setState({ status: 'not_found' })
    }
  }

  /** Re-reads a cached guest in the background; keeps the cache if offline. */
  async function refreshGuest(id: string) {
    if (CONFIG.appScriptUrl === 'PLACEHOLDER_APPS_SCRIPT_URL') return
    const gen = generation.current
    const guest = await getGuestById(id)
    if (gen !== generation.current) return
    if (guest) {
      setState({ status: 'found', guest })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(guest))
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

    const gen = generation.current
    setState({ status: 'loading' })
    const guest = await getGuestByName(name)
    if (gen !== generation.current) return
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

  /**
   * "Not you?": forgets the guest for good — the cache, any answer still on
   * its way, and the invitation link's ?g= (or a reload would log them back in).
   */
  function reset() {
    generation.current++
    localStorage.removeItem(STORAGE_KEY)
    if (searchParams.has('g')) {
      setSearchParams(
        (params) => {
          params.delete('g')
          return params
        },
        { replace: true }
      )
    }
    setState({ status: 'idle' })
  }

  return { state, lookupByName, reset }
}
