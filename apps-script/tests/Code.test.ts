import { describe, it, expect } from 'vitest'
import { createSandbox } from './sandbox'

type GuestRow = [string, string, string, string, boolean]
const GUESTS_HEADER = ['guestId', 'groupName', 'language', 'attendees', 'hasPhoto']

function guestsSheet(...rows: GuestRow[]) {
  return [GUESTS_HEADER, ...rows]
}

const ORDERS_HEADER = [
  'timestamp',
  'guestId',
  'groupName',
  'guestEmail',
  'giftId',
  'giftName',
  'selectedCotas',
  'totalPrice',
  'cardMessage',
]

describe('handleGetGuest', () => {
  const baseGuests = guestsSheet(
    ['r01', 'Ana e Bruno', 'pt', 'Bruno Souza, Ana Souza', true],
    ['r02', 'Carla e Diego', 'pt', 'Carla Lima, Diego Rocha', true],
  )

  it('looks up by id', () => {
    const { app } = createSandbox({ guests: baseGuests })
    const guest = app.handleGetGuest({ id: 'r01' })
    expect(guest).toMatchObject({ guestId: 'r01', groupName: 'Ana e Bruno', language: 'pt' })
    expect(guest?.attendees).toEqual(['Bruno Souza', 'Ana Souza'])
    expect(guest?.hasPhoto).toBe(true)
  })

  it('displayName falls back to groupName; padrinho defaults to false', () => {
    const { app } = createSandbox({ guests: baseGuests })
    expect(app.handleGetGuest({ id: 'r01' })).toMatchObject({
      displayName: 'Ana e Bruno',
      padrinho: false,
    })
  })

  it('reads displayName and padrinho when the columns are there', () => {
    const guests = [
      [...GUESTS_HEADER, 'displayName', 'padrinho'],
      ['p01', 'Helaine e Ivanio', 'pt', 'Helaine Silva, Ivanio Silva', false, 'Mãe e Pai', true],
      ['p02', 'Eva e Felipe', 'pt', 'Eva Melo, Felipe Melo', false, '  ', 'TRUE'],
      ['p03', 'Gil', 'pt', 'Gil Prado', false, 'Tio Gil', 'false'],
    ]
    const { app } = createSandbox({ guests })
    expect(app.handleGetGuest({ id: 'p01' })).toMatchObject({
      groupName: 'Helaine e Ivanio',
      displayName: 'Mãe e Pai',
      padrinho: true,
    })
    expect(app.handleGetGuest({ id: 'p02' })).toMatchObject({
      displayName: 'Eva e Felipe',
      padrinho: true,
    })
    expect(app.handleGetGuest({ id: 'p03' })?.padrinho).toBe(false)
  })

  it('logging in by name ignores displayName', () => {
    const guests = [
      [...GUESTS_HEADER, 'displayName', 'padrinho'],
      ['p01', 'Helaine e Ivanio', 'pt', 'Helaine Silva, Ivanio Silva', false, 'Mãe e Pai', true],
    ]
    const { app } = createSandbox({ guests })
    expect(app.handleGetGuest({ name: 'Mãe e Pai' })).toBeNull()
    expect(app.handleGetGuest({ name: 'helaine e ivanio' })?.guestId).toBe('p01')
  })

  it('returns null for unknown id', () => {
    const { app } = createSandbox({ guests: baseGuests })
    expect(app.handleGetGuest({ id: 'nope' })).toBeNull()
  })

  it('exact match on group name ignoring diacritics and case', () => {
    const { app } = createSandbox({ guests: baseGuests })
    expect(app.handleGetGuest({ name: 'ana e bruno' })?.guestId).toBe('r01')
    expect(app.handleGetGuest({ name: 'CARLA E DIEGO' })?.guestId).toBe('r02')
  })

  it('exact match on one attendee full name', () => {
    const { app } = createSandbox({ guests: baseGuests })
    expect(app.handleGetGuest({ name: 'Carla Lima' })?.guestId).toBe('r02')
    expect(app.handleGetGuest({ name: '  bruno   SOUZA ' })?.guestId).toBe('r01')
  })

  it('no partial matches: a first name alone does not log in', () => {
    const { app } = createSandbox({ guests: baseGuests })
    expect(app.handleGetGuest({ name: 'Carla' })).toBeNull()
    expect(app.handleGetGuest({ name: 'Ana e Bruno Souza' })).toBeNull()
  })

  it('regression: "Eva e Felipe" is the couple, never the Eva on her own', () => {
    const guests = guestsSheet(
      ['g1', 'Eva', 'pt', 'Eva', false],
      ['g2', 'Eva & Felipe', 'pt', 'Eva Prado, Felipe Prado', false],
    )
    const { app } = createSandbox({ guests })
    expect(app.handleGetGuest({ name: 'Eva e Felipe' })?.guestId).toBe('g2')
    expect(app.handleGetGuest({ name: 'Eva & Felipe' })?.guestId).toBe('g2')
    expect(app.handleGetGuest({ name: 'Eva' })?.guestId).toBe('g1')
  })

  it('treats &, e and and alike, and ignores the order of the names', () => {
    const guests = guestsSheet(['g2', 'Eva & Felipe', 'en', 'Eva, Felipe', false])
    const { app } = createSandbox({ guests })
    expect(app.handleGetGuest({ name: 'Felipe e Eva' })?.guestId).toBe('g2')
    expect(app.handleGetGuest({ name: 'eva and felipe' })?.guestId).toBe('g2')
  })

  it('regression: trailing comma in attendees must not match every search', () => {
    const guests = guestsSheet(
      ['r01', 'Ana e Bruno', 'pt', 'Bruno Souza, Ana Souza,', true],
      ['r02', 'Carla e Diego', 'pt', 'Carla Lima, Diego Rocha', true],
    )
    const { app } = createSandbox({ guests })
    expect(app.handleGetGuest({ name: 'Carla Lima' })?.guestId).toBe('r02')
    expect(app.handleGetGuest({ name: 'xyznotfound' })).toBeNull()
  })

  it('empty or too-short needle returns null', () => {
    const { app } = createSandbox({ guests: baseGuests })
    expect(app.handleGetGuest({ name: '' })).toBeNull()
    expect(app.handleGetGuest({ name: '   ' })).toBeNull()
    expect(app.handleGetGuest({ name: 'a' })).toBeNull()
  })

  it('filters empty attendees from the returned guest', () => {
    const guests = guestsSheet(['r01', 'Group', 'pt', 'One, , Two,', true])
    const { app } = createSandbox({ guests })
    expect(app.handleGetGuest({ id: 'r01' })?.attendees).toEqual(['One', 'Two'])
  })

  it('defaults language to pt when column is blank', () => {
    const guests = guestsSheet(['r01', 'Group', '', 'Someone', true])
    const { app } = createSandbox({ guests })
    expect(app.handleGetGuest({ id: 'r01' })?.language).toBe('pt')
  })
})

describe('handleGetSoldCotas', () => {
  it('collects cota ids across all orders', () => {
    const orders = [
      ORDERS_HEADER,
      ['2026-01-01', 'r01', 'Ana', 'm@t.com', 'g1', 'Jantar', JSON.stringify(['c1', 'c2']), 200, ''],
      ['2026-01-02', 'r02', 'Carla', 'h@i.com', 'g2', 'Lua de Mel', JSON.stringify(['c5']), 500, ''],
    ]
    const { app } = createSandbox({ orders })
    expect(app.handleGetSoldCotas().sold.sort()).toEqual(['c1', 'c2', 'c5'])
  })

  it('ignores malformed JSON rows', () => {
    const orders = [
      ORDERS_HEADER,
      ['2026-01-01', 'r01', 'x', 'x', 'g', 'n', 'not-valid-json', 0, ''],
      ['2026-01-02', 'r02', 'x', 'x', 'g', 'n', JSON.stringify(['c1']), 0, ''],
    ]
    const { app } = createSandbox({ orders })
    expect(app.handleGetSoldCotas().sold).toEqual(['c1'])
  })
})

describe('handlePurchaseGift', () => {
  const guests = guestsSheet(['r01', 'Ana e Bruno', 'pt', 'Bruno Souza', true])

  function purchase(overrides: Partial<Parameters<ReturnType<typeof createSandbox>['app']['handlePurchaseGift']>[0]> = {}) {
    return {
      guestId: 'r01',
      giftId: 'g1',
      giftName: 'Jantar',
      selectedCotaIds: ['c1', 'c2'],
      selectedCotaLabels: ['Entrada', 'Prato'],
      totalPrice: 200,
      guestEmail: 'guest@example.com',
      cardMessage: 'Parabéns!',
      ...overrides,
    }
  }

  it('appends an Orders row and emails the guest on success', () => {
    const { app, sheets, sentMail } = createSandbox({ guests })
    const result = app.handlePurchaseGift(purchase())
    expect(result).toEqual({ success: true })
    expect(sheets.Orders.rows).toHaveLength(2)
    const row = sheets.Orders.rows[1]
    expect(row[1]).toBe('r01')
    expect(row[2]).toBe('Ana e Bruno')
    expect(row[6]).toBe(JSON.stringify(['c1', 'c2']))
    expect(row[7]).toBe(200)
    expect(sentMail).toHaveLength(1)
    expect(sentMail[0].to).toBe('guest@example.com')
    expect(sentMail[0].subject).toContain('Jantar')
    expect(sentMail[0].body).toContain('Parabéns!')
  })

  it('rejects when any selected cota is already sold', () => {
    const orders = [
      ORDERS_HEADER,
      ['2026-01-01', 'r99', 'Prev', 'p@p.com', 'g1', 'Jantar', JSON.stringify(['c1']), 100, ''],
    ]
    const { app, sheets, sentMail } = createSandbox({ guests, orders })
    const result = app.handlePurchaseGift(purchase())
    expect(result.success).toBe(false)
    expect(result.error).toContain('c1')
    expect(sheets.Orders.rows).toHaveLength(2)
    expect(sentMail).toHaveLength(0)
  })

  it('skips the email when guestEmail is empty', () => {
    const { app, sheets, sentMail } = createSandbox({ guests })
    const result = app.handlePurchaseGift(purchase({ guestEmail: '' }))
    expect(result.success).toBe(true)
    expect(sheets.Orders.rows).toHaveLength(2)
    expect(sentMail).toHaveLength(0)
  })
  it('records a PIX purchase as pix, in BRL', () => {
    const { app, sheets, fetched } = createSandbox({ guests })
    app.handlePurchaseGift(purchase())
    expect(sheets.Orders.rows[1].slice(9)).toEqual(['pix', 'BRL', 200, ''])
    expect(fetched).toHaveLength(0)
  })
})

describe('handlePurchaseGift with PayPal', () => {
  const guests = guestsSheet(['r01', 'Ana e Bruno', 'pt', 'Bruno Souza', true])
  const properties = {
    SHEET_ID: 'test-sheet-id',
    COUPLE_EMAILS: 'a@example.com',
    PAYPAL_CLIENT_ID: 'cid',
    PAYPAL_SECRET: 'secret',
  }
  const completed = {
    status: 'COMPLETED',
    payer: { email_address: 'payer@example.eu' },
    purchase_units: [
      { payments: { captures: [{ id: 'CAP123', amount: { value: '32.00', currency_code: 'EUR' } }] } },
    ],
  }
  function paypal(captureCode = 201, captureBody: unknown = completed) {
    return (url: string) =>
      url.endsWith('/v1/oauth2/token')
        ? { code: 200, body: { access_token: 'tok' } }
        : { code: captureCode, body: captureBody }
  }
  const body = {
    guestId: 'r01',
    giftId: 'g1',
    giftName: 'Jantar',
    selectedCotaIds: ['c1', 'c2'],
    selectedCotaLabels: ['Entrada', 'Prato'],
    totalPrice: 200,
    guestEmail: '',
    cardMessage: '',
    paymentMethod: 'paypal' as const,
    paypalOrderId: 'ORDER-1',
  }

  it('captures the order, records what PayPal took, and mails the payer', () => {
    const { app, sheets, sentMail, fetched } = createSandbox({
      guests,
      properties,
      fetch: paypal(),
    })
    expect(app.handlePurchaseGift(body)).toEqual({ success: true })
    expect(fetched.map((f) => f.url)).toEqual([
      'https://api-m.sandbox.paypal.com/v1/oauth2/token',
      'https://api-m.sandbox.paypal.com/v2/checkout/orders/ORDER-1/capture',
    ])
    expect(fetched[0].opts.headers?.Authorization).toBe(
      'Basic ' + Buffer.from('cid:secret').toString('base64'),
    )
    const row = sheets.Orders.rows[1]
    expect(row[3]).toBe('payer@example.eu')
    expect(row[7]).toBe(200)
    expect(row.slice(9)).toEqual(['paypal', 'EUR', 32, 'CAP123'])
    expect(sentMail[0].to).toBe('payer@example.eu')
    expect(sentMail[0].body).toContain('€ 32.00')
  })

  it('uses the live API when PAYPAL_ENV is live', () => {
    const { app, fetched } = createSandbox({
      guests,
      properties: { ...properties, PAYPAL_ENV: 'live' },
      fetch: paypal(),
    })
    app.handlePurchaseGift(body)
    expect(fetched[0].url).toBe('https://api-m.paypal.com/v1/oauth2/token')
  })

  it('records nothing when PayPal does not complete the capture', () => {
    const { app, sheets, sentMail } = createSandbox({
      guests,
      properties,
      fetch: paypal(422, { name: 'UNPROCESSABLE_ENTITY' }),
    })
    const result = app.handlePurchaseGift(body)
    expect(result.success).toBe(false)
    expect(sheets.Orders.rows).toHaveLength(1)
    expect(sentMail).toHaveLength(0)
  })

  it('never captures when a cota is already sold', () => {
    const orders = [
      ORDERS_HEADER,
      ['2026-01-01', 'r99', 'Prev', 'p@p.com', 'g1', 'Jantar', JSON.stringify(['c2']), 100, ''],
    ]
    const { app, fetched } = createSandbox({ guests, orders, properties, fetch: paypal() })
    expect(app.handlePurchaseGift(body).success).toBe(false)
    expect(fetched).toHaveLength(0)
  })

  it('rejects a malformed order ID without calling PayPal', () => {
    const { app, fetched } = createSandbox({ guests, properties, fetch: paypal() })
    expect(app.handlePurchaseGift({ ...body, paypalOrderId: '../x' }).success).toBe(false)
    expect(fetched).toHaveLength(0)
  })
})

describe('handleSubmitRSVP', () => {
  it('appends an RSVP row and notifies the couple', () => {
    const guests = guestsSheet(['r01', 'Ana e Bruno', 'pt', 'Bruno Souza, Ana Souza', true])
    const { app, sheets, sentMail } = createSandbox({ guests })
    const result = app.handleSubmitRSVP({
      guestId: 'r01',
      attendeesJson: JSON.stringify([{ name: 'Bruno Souza', attending: true }]),
      songRequest: 'Samba',
      message: 'Até lá!',
    })
    expect(result).toEqual({ success: true })
    expect(sheets.RSVPs.rows).toHaveLength(2)
    const row = sheets.RSVPs.rows[1]
    expect(row[1]).toBe('r01')
    expect(row[2]).toBe('Ana e Bruno')
    expect(sentMail).toHaveLength(1)
    expect(sentMail[0].subject).toContain('Ana e Bruno')
    expect(sentMail[0].body).toContain('Samba')
    expect(sentMail[0].body).toContain('Até lá!')
  })
})

describe('rsvpSubmitted on the guest', () => {
  const guests = guestsSheet(
    ['r01', 'Ana e Bruno', 'pt', 'Bruno Souza', true],
    ['r02', 'Carla e Diego', 'pt', 'Carla Lima', true],
  )
  const RSVP_HEADER = ['timestamp', 'guestId', 'groupName', 'attendeesJson', 'songRequest', 'message']

  it('is true only for guests with a row in the RSVPs tab', () => {
    const rsvps = [RSVP_HEADER, ['2026-10-01', 'r01', 'Ana e Bruno', '[]', '', '']]
    const { app } = createSandbox({ guests, rsvps })
    expect(app.handleGetGuest({ id: 'r01' })?.rsvpSubmitted).toBe(true)
    expect(app.handleGetGuest({ id: 'r02' })?.rsvpSubmitted).toBe(false)
    expect(app.handleGetGuest({ name: 'Ana e Bruno' })?.rsvpSubmitted).toBe(true)
  })

  it('returns who is and is not coming from the latest reply', () => {
    const rsvps = [
      RSVP_HEADER,
      ['2026-10-01', 'r01', 'Ana e Bruno', '[{"name":"Bruno Souza","attending":true}]', '', ''],
      [
        '2026-10-02',
        'r01',
        'Ana e Bruno',
        '[{"name":"Bruno Souza","attending":true},{"name":"Ana Souza","attending":false}]',
        '',
        '',
      ],
    ]
    const { app } = createSandbox({ guests, rsvps })
    expect(app.handleGetGuest({ id: 'r01' })?.rsvpAttendees).toEqual([
      { name: 'Bruno Souza', attending: true },
      { name: 'Ana Souza', attending: false },
    ])
    expect(app.handleGetGuest({ id: 'r02' })?.rsvpAttendees).toEqual([])
  })

  it('a malformed reply still counts as replied, with no names', () => {
    const rsvps = [RSVP_HEADER, ['2026-10-01', 'r01', 'Ana e Bruno', 'not json', '', '']]
    const { app } = createSandbox({ guests, rsvps })
    const guest = app.handleGetGuest({ id: 'r01' })
    expect(guest?.rsvpSubmitted).toBe(true)
    expect(guest?.rsvpAttendees).toEqual([])
  })

  it('turns true right after the guest replies', () => {
    const { app } = createSandbox({ guests })
    expect(app.handleGetGuest({ id: 'r02' })?.rsvpSubmitted).toBe(false)
    app.handleSubmitRSVP({ guestId: 'r02', attendeesJson: '[]' })
    expect(app.handleGetGuest({ id: 'r02' })?.rsvpSubmitted).toBe(true)
  })
})

describe('configuration (Script Properties)', () => {
  it('sends couple notifications to the addresses in COUPLE_EMAILS', () => {
    const guests = guestsSheet(['r01', 'Ana e Bruno', 'pt', 'Bruno Souza', true])
    const { app, sentMail } = createSandbox({ guests })
    app.handleSubmitRSVP({ guestId: 'r01', attendeesJson: '[]' })
    expect(sentMail[0].to).toBe('a@example.com,b@example.com')
  })

  it('fails with a clear error when SHEET_ID is not set', () => {
    const { app } = createSandbox({ properties: { COUPLE_EMAILS: 'a@example.com' } })
    const res = JSON.parse(app.doGet({ parameter: { action: 'getSoldCotas' } }).getContent())
    expect(res.error).toContain('Missing Script Property: SHEET_ID')
  })
})

describe('doGet / doPost entry points', () => {
  const guests = guestsSheet(['r01', 'Ana e Bruno', 'pt', 'Bruno Souza', true])

  it('doGet dispatches getGuest by id', () => {
    const { app } = createSandbox({ guests })
    const out = app.doGet({ parameter: { action: 'getGuest', id: 'r01' } })
    const body = JSON.parse(out.getContent())
    expect(body).toMatchObject({ guestId: 'r01' })
  })

  it('doGet returns an error for unknown action', () => {
    const { app } = createSandbox({ guests })
    const out = app.doGet({ parameter: { action: 'bogus' } })
    expect(JSON.parse(out.getContent())).toEqual({ error: 'Unknown action' })
  })

  it('doPost routes purchaseGift', () => {
    const { app, sheets } = createSandbox({ guests })
    const out = app.doPost({
      postData: {
        contents: JSON.stringify({
          action: 'purchaseGift',
          guestId: 'r01',
          giftId: 'g1',
          giftName: 'Jantar',
          selectedCotaIds: ['c1'],
          selectedCotaLabels: ['Entrada'],
          totalPrice: 100,
          guestEmail: '',
          cardMessage: '',
        }),
      },
    })
    expect(JSON.parse(out.getContent())).toEqual({ success: true })
    expect(sheets.Orders.rows).toHaveLength(2)
  })
})

describe('handleSubmitCard', () => {
  const guests = guestsSheet(['r01', 'Ana e Bruno', 'pt', 'Bruno Souza', true])

  it('appends a Cards row and notifies the couple', () => {
    const { app, sheets, sentMail } = createSandbox({ guests })
    const result = app.handleSubmitCard({
      guestId: 'r01',
      giftName: 'Air Fryer',
      theme: 'zelda',
      from: 'Ana e Bruno',
      message: 'Muito amor!',
    })
    expect(result).toEqual({ success: true })
    expect(sheets.Cards.rows).toHaveLength(2)
    const row = sheets.Cards.rows[1]
    expect(row[1]).toBe('r01')
    expect(row[2]).toBe('Ana e Bruno')
    expect(row[3]).toBe('Air Fryer')
    expect(row[4]).toBe('zelda')
    expect(row[6]).toBe('Muito amor!')
    expect(sentMail).toHaveLength(1)
    expect(sentMail[0].body).toContain('Muito amor!')
  })

  it('caps the message at 400 characters', () => {
    const { app, sheets } = createSandbox({ guests })
    app.handleSubmitCard({
      guestId: 'r01',
      giftName: 'Air Fryer',
      theme: 'up',
      from: 'Ana',
      message: 'x'.repeat(1000),
    })
    expect(String(sheets.Cards.rows[1][6])).toHaveLength(400)
  })
})
