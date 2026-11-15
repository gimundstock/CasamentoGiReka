import { describe, it, expect } from 'vitest'
import i18n from '../i18n'
import { guestPhotoSources, invitationOptions, padrinhoRoleEn, withDefaultPhotos } from './guest'
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

describe('withDefaultPhotos', () => {
  const defaults = ['d2', 'd3', 'd4', 'd5']

  it('theirs first; each one pushes out the last default still there', () => {
    expect(withDefaultPhotos([], defaults)).toEqual(['d2', 'd3', 'd4', 'd5'])
    expect(withDefaultPhotos(['g1'], defaults)).toEqual(['g1', 'd2', 'd3', 'd4'])
    expect(withDefaultPhotos(['g1', 'g2'], defaults)).toEqual(['g1', 'g2', 'd2', 'd3'])
    expect(withDefaultPhotos(['g1', 'g2', 'g3'], defaults)).toEqual(['g1', 'g2', 'g3', 'd2'])
  })

  it('as many as the defaults or more: only theirs', () => {
    expect(withDefaultPhotos(['g1', 'g2', 'g3', 'g4'], defaults)).toEqual(['g1', 'g2', 'g3', 'g4'])
    const ten = Array.from({ length: 10 }, (_, i) => `g${i + 1}`)
    expect(withDefaultPhotos(ten, defaults)).toEqual(ten)
  })
})

describe('padrinhoRoleEn', () => {
  const base = { guestId: 'x', groupName: 'X', language: 'en', attendees: ['A', 'B'] }
  const role = (gender: 'f' | 'm' | '', padrinhos: string[]) =>
    padrinhoRoleEn({ ...base, gender, padrinhos } as never)

  it('says bridesmaid(s) or groomsman / groomsmen from the invitation and how many', () => {
    expect(role('f', ['Ana'])).toEqual({ role: 'bridesmaid', guide: 'Bridesmaid’s guide' })
    expect(role('f', ['Ana', 'Bia']).role).toBe('bridesmaids')
    expect(role('m', ['Bruno'])).toEqual({ role: 'groomsman', guide: 'Groomsman’s guide' })
    expect(role('m', ['Bruno', 'Caio']).role).toBe('groomsmen')
  })

  it('both, for a mixed invitation', () => {
    expect(role('', ['Ana', 'Bruno']).role).toBe('bridesmaid and groomsman')
    expect(role('', ['Ana', 'Bruno', 'Caio']).role).toBe('bridesmaids and groomsmen')
  })
})
