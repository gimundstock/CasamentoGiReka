import { describe, it, expect } from 'vitest'
import { guestPhotoSources } from './guest'
import type { Guest } from '../types'

const guest = (photos?: string[]): Guest => ({
  guestId: 'r27',
  groupName: 'X',
  language: 'pt',
  attendees: [],
  photos,
})

describe('guestPhotoSources', () => {
  it("the deploy's copy first, the Drive URL as fallback", () => {
    const drive = 'https://lh3.googleusercontent.com/d/1AbC-d_9=w1600'
    expect(guestPhotoSources(guest([drive]), '/')).toEqual([
      { src: '/guest-photos/1AbC-d_9.jpg', fallbackSrc: drive },
    ])
  })

  it('any other URL is used as it is; no photos, none', () => {
    expect(guestPhotoSources(guest(['https://x.com/a.jpg']), '/')).toEqual([
      { src: 'https://x.com/a.jpg' },
    ])
    expect(guestPhotoSources(guest(), '/')).toEqual([])
  })
})
