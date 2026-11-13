import { describe, it, expect } from 'vitest'
import i18n from '../i18n'
import { guestPhotoSources, invitationOptions } from './guest'
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

describe('invitationOptions', () => {
  const invited = (attendees: string[], gender?: Guest['gender']): Guest => ({
    guestId: 'r01',
    groupName: 'X',
    language: 'pt',
    attendees,
    gender,
  })
  const line = (g: Guest, lng = 'pt') =>
    i18n.getFixedT(lng)('welcome.invitation', invitationOptions(g))

  it('one guest: convidado, convidada, or convidado(a) when the column is blank', () => {
    expect(line(invited(['Gil'], 'm'))).toBe('Você está convidado para celebrar com a gente!')
    expect(line(invited(['Ana'], 'f'))).toBe('Você está convidada para celebrar com a gente!')
    expect(line(invited(['Ana']))).toBe('Você está convidado(a) para celebrar com a gente!')
  })

  it('a group: convidadas only when F, else convidados', () => {
    const two = ['Ana', 'Bia']
    expect(line(invited(two, 'f'))).toBe('Vocês estão convidadas para celebrar com a gente!')
    expect(line(invited(two, 'm'))).toBe('Vocês estão convidados para celebrar com a gente!')
    expect(line(invited(two, ''))).toBe('Vocês estão convidados para celebrar com a gente!')
  })

  it('English has one line for all', () => {
    expect(line(invited(['Ana', 'Bia'], 'f'), 'en')).toBe('You are invited to celebrate with us!')
    expect(line(invited([]), 'en')).toBe('You are invited to celebrate with us!')
  })
})
