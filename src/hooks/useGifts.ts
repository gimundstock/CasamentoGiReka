import { useState, useEffect, useCallback } from 'react'
import { getGifts } from '../api/sheets'
import type { Gift } from '../types'

export function useGifts() {
  const [gifts, setGifts] = useState<Gift[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getGifts()
      setGifts(data)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Optimistically mark cotas as purchased locally (instant UI feedback)
  function markCotasPurchased(cotaIds: string[]) {
    setGifts((prev) =>
      prev.map((gift) => ({
        ...gift,
        cotas: gift.cotas.map((c) => (cotaIds.includes(c.cotaId) ? { ...c, purchased: true } : c)),
        available: gift.cotas.filter((c) => !cotaIds.includes(c.cotaId) && !c.purchased).length,
      }))
    )
  }

  return { gifts, loading, error, reload: load, markCotasPurchased }
}
