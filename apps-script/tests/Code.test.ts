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
    expect(guest?.photos).toEqual([])
  })

  it('displayName falls back to groupName; padrinho defaults to false', () => {
    const { app } = createSandbox({ guests: baseGuests })
    expect(app.handleGetGuest({ id: 'r01' })).toMatchObject({
      displayName: 'Ana e Bruno',
      padrinho: false,
      padrinhos: [],
    })
  })

  it('padrinhos: the names in the column, only those of the invitation who are', () => {
    const guests = [
      [...GUESTS_HEADER, 'padrinhos'],
      ['f01', 'Família Lima', 'pt', 'Alice Lima, Laura Lima, Rui Lima, Eva Lima, Tom Lima', false, ' Alice,Laura '],
      ['f02', 'Gil', 'pt', 'Gil Prado', false, ''],
      ['f03', 'Eva e Felipe', 'pt', 'Eva Melo, Felipe Melo', false, true],
      ['f04', 'Hugo', 'pt', 'Hugo Reis', false, 'FALSE'],
    ]
    const { app } = createSandbox({ guests })
    expect(app.handleGetGuest({ id: 'f01' })).toMatchObject({
      padrinho: true,
      padrinhos: ['Alice', 'Laura'],
    })
    expect(app.handleGetGuest({ id: 'f02' })).toMatchObject({ padrinho: false, padrinhos: [] })
    // A checkbox still works: all of the invitation.
    expect(app.handleGetGuest({ id: 'f03' })?.padrinhos).toEqual(['Eva Melo', 'Felipe Melo'])
    expect(app.handleGetGuest({ id: 'f04' })?.padrinho).toBe(false)
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

  it('gender: F or M from the genero column, blank otherwise', () => {
    const guests = [
      [...GUESTS_HEADER, 'genero'],
      ['g01', 'Ana', 'pt', 'Ana Souza', false, 'F'],
      ['g02', 'Gil', 'pt', 'Gil Prado', false, ' masculino '],
      ['g03', 'Eva e Felipe', 'pt', 'Eva Melo, Felipe Melo', false, ''],
      ['g04', 'Hugo', 'pt', 'Hugo Reis', false, 'x'],
    ]
    const { app } = createSandbox({ guests })
    expect(app.handleGetGuest({ id: 'g01' })?.gender).toBe('f')
    expect(app.handleGetGuest({ id: 'g02' })?.gender).toBe('m')
    expect(app.handleGetGuest({ id: 'g03' })?.gender).toBe('')
    expect(app.handleGetGuest({ id: 'g04' })?.gender).toBe('')
    // No column at all: blank.
    expect(createSandbox({ guests: baseGuests }).app.handleGetGuest({ id: 'r01' })?.gender).toBe('')
  })

  it('gender: the header may be gênero or gender', () => {
    for (const header of ['gênero', 'gender']) {
      const { app } = createSandbox({
        guests: [[...GUESTS_HEADER, header], ['g01', 'Ana', 'pt', 'Ana Souza', false, 'Feminino']],
      })
      expect(app.handleGetGuest({ id: 'g01' })?.gender).toBe('f')
    }
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

  it("photos: the images in the guest's Drive subfolder, by file name", () => {
    const { app } = createSandbox({
      guests: baseGuests,
      properties: { SHEET_ID: 's', COUPLE_EMAILS: 'a@x.com', GUEST_PHOTOS_FOLDER_ID: 'root' },
      drive: {
        root: {
          r01: [
            { id: 'idB', name: 'b-praia.jpg', mimeType: 'image/jpeg' },
            { id: 'idN', name: 'notas.txt', mimeType: 'text/plain' },
            { id: 'idA', name: 'a-festa.heic', mimeType: 'image/heif' },
          ],
        },
      },
    })
    expect(app.handleGetGuest({ id: 'r01' })?.photos).toEqual([
      'https://lh3.googleusercontent.com/d/idA=w1600',
      'https://lh3.googleusercontent.com/d/idB=w1600',
    ])
    expect(app.handleGetGuest({ id: 'r02' })?.photos).toEqual([])
  })

  it('photoManifest: every guest photo ID, only with the token', () => {
    const { app } = createSandbox({
      guests: baseGuests,
      properties: {
        SHEET_ID: 's',
        COUPLE_EMAILS: 'a@x.com',
        GUEST_PHOTOS_FOLDER_ID: 'root',
        PHOTO_SYNC_TOKEN: 'segredo',
      },
      drive: {
        root: {
          r01: [
            { id: 'idB', name: 'b.jpg', mimeType: 'image/jpeg' },
            { id: 'idN', name: 'n.txt', mimeType: 'text/plain' },
          ],
          r02: [{ id: 'idC', name: 'c.png', mimeType: 'image/png' }],
        },
      },
    })
    expect(app.handlePhotoManifest({ token: 'segredo' })).toEqual({ ids: ['idB', 'idC'] })
    expect(app.handlePhotoManifest({ token: 'errado' })).toEqual({ error: 'Forbidden' })
    expect(app.handlePhotoManifest({})).toEqual({ error: 'Forbidden' })
  })

  it('photoManifest: refuses everyone while PHOTO_SYNC_TOKEN is unset', () => {
    const { app } = createSandbox({ guests: baseGuests })
    expect(() => app.handlePhotoManifest({ token: '' })).toThrow(/PHOTO_SYNC_TOKEN/)
  })

  it('photos: a wrong folder ID never breaks the login', () => {
    const { app } = createSandbox({
      guests: baseGuests,
      properties: { SHEET_ID: 's', COUPLE_EMAILS: 'a@x.com', GUEST_PHOTOS_FOLDER_ID: 'gone' },
    })
    expect(app.handleGetGuest({ id: 'r01' })).toMatchObject({ guestId: 'r01', photos: [] })
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

  it('appends an Orders row, confirms to the guest and sends the couple a receipt', () => {
    const { app, sheets, sentMail } = createSandbox({ guests })
    const result = app.handlePurchaseGift(purchase())
    expect(result).toEqual({ success: true })
    expect(sheets.Orders.rows).toHaveLength(2)
    const row = sheets.Orders.rows[1]
    expect(row[1]).toBe('r01')
    expect(row[2]).toBe('Ana e Bruno')
    expect(row[6]).toBe(JSON.stringify(['c1', 'c2']))
    expect(row[7]).toBe(200)
    expect(sentMail).toHaveLength(2)
    const [toGuest, toCouple] = sentMail
    // The guest's own confirmation, not copied to the couple (they get their own).
    expect(toGuest.to).toBe('guest@example.com')
    expect(toGuest.bcc).toBeUndefined()
    expect(toGuest.subject).toContain('Jantar')
    expect(toGuest.body).toContain('Parabéns!')
    expect(toGuest.htmlBody).toContain('Parabéns!')
    // The couple's receipt: who, what, how much and how it was paid.
    expect(toCouple.to).toBe('a@example.com,b@example.com')
    expect(toCouple.replyTo).toBe('guest@example.com')
    expect(toCouple.subject).toContain('Jantar')
    expect(toCouple.body).toContain('Ana e Bruno')
    expect(toCouple.body).toContain('guest@example.com')
    expect(toCouple.body).toContain('• Entrada')
    expect(toCouple.body).toContain('R$ 200,00')
    expect(toCouple.body).toContain('PIX')
    expect(toCouple.body).toContain('Parabéns!')
  })

  it('a mail that fails never undoes the recorded purchase', () => {
    const { app, sheets } = createSandbox({
      guests,
      mailError: new Error('Service invoked too many times for one day: email.'),
    })
    expect(app.handlePurchaseGift(purchase())).toEqual({ success: true })
    expect(sheets.Orders.rows).toHaveLength(2)
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

  it('without a guest address, only the couple is mailed', () => {
    const { app, sheets, sentMail } = createSandbox({ guests })
    const result = app.handlePurchaseGift(purchase({ guestEmail: '' }))
    expect(result.success).toBe(true)
    expect(sheets.Orders.rows).toHaveLength(2)
    expect(sentMail).toHaveLength(1)
    expect(sentMail[0].to).toBe('a@example.com,b@example.com')
    expect(sentMail[0].replyTo).toBeUndefined()
    expect(sentMail[0].body).toContain('(não informado)')
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
    expect(sentMail[0].body).toContain('€ 32,00')
    expect(sentMail[1].to).toContain('a@example.com')
    expect(sentMail[1].body).toContain('PayPal, € 32,00 (ref. CAP123)')
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

  it('the couple\'s mail is the site-styled HTML: who goes, who doesn\'t, the song and the message', () => {
    const guests = guestsSheet(['r01', 'Ana e Bruno', 'pt', 'Bruno Souza, Ana Souza', true])
    const { app, sentMail } = createSandbox({ guests })
    app.handleSubmitRSVP({
      guestId: 'r01',
      attendeesJson: JSON.stringify([
        { name: 'Bruno Souza', attending: true, menu: 'Peixe' },
        { name: 'Ana <Souza>', attending: false, menu: '' },
      ]),
      songRequest: 'Samba',
      message: 'Até lá!',
    })
    const html = sentMail[0].htmlBody ?? ''
    expect(html).toContain('https://giovannaerenato.com.br/email/wreath.jpg')
    expect(html).toContain('Confirmação de presença')
    expect(html).toContain('Bruno Souza <span style="color:#8A8A87;">· Peixe</span>')
    expect(html).toContain('Ana &lt;Souza&gt;')
    expect(html).toContain('Samba')
    expect(html).toContain('Até lá!')
  })

  it('a broken attendees list still mails the couple', () => {
    const guests = guestsSheet(['r01', 'Ana e Bruno', 'pt', 'Bruno Souza', true])
    const { app, sentMail } = createSandbox({ guests })
    app.handleSubmitRSVP({ guestId: 'r01', attendeesJson: 'not json', songRequest: '', message: '' })
    expect(sentMail).toHaveLength(1)
    expect(sentMail[0].htmlBody).toContain('Ana e Bruno')
  })
})

describe('the mails\' look', () => {
  const guests = guestsSheet(['r01', 'Ana e Bruno', 'pt', 'Bruno Souza', true])

  it('writes amounts the Brazilian way', () => {
    const { app, sentMail } = createSandbox({ guests })
    app.handlePurchaseGift({
      guestId: 'r01',
      giftId: 'g1',
      giftName: 'Lua de Mel',
      selectedCotaIds: ['c1'],
      selectedCotaLabels: ['Hospedagem'],
      totalPrice: 12300.5,
      guestEmail: 'ana@example.com',
      cardMessage: '',
    })
    expect(sentMail[0].body).toContain('R$ 12.300,50')
    expect(sentMail[1].htmlBody).toContain('R$ 12.300,50')
  })

  it('takes the pictures from SITE_URL when it is set', () => {
    const { app, sentMail } = createSandbox({
      guests,
      properties: {
        SHEET_ID: 'x',
        COUPLE_EMAILS: 'a@example.com',
        SITE_URL: 'https://preview.example/',
      },
    })
    app.handleSubmitRSVP({ guestId: 'r01', attendeesJson: '[]', songRequest: '', message: '' })
    expect(sentMail[0].htmlBody).toContain('src="https://preview.example/email/wreath.jpg"')
    expect(sentMail[0].htmlBody).toContain('src="https://preview.example/email/flowers.jpg"')
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

describe('the gift mails held for the card (deferEmail)', () => {
  const guests = guestsSheet(['r01', 'Ana e Bruno', 'pt', 'Bruno Souza', true])
  const gift = {
    guestId: 'r01',
    giftId: 'g1',
    giftName: 'Jantar',
    selectedCotaIds: ['c1', 'c2'],
    selectedCotaLabels: ['Entrada', 'Prato'],
    totalPrice: 200,
    guestEmail: 'ana@example.com',
    cardMessage: '',
    deferEmail: true,
  }

  it('purchaseGift records the order and sends nothing yet', () => {
    const { app, sheets, sentMail } = createSandbox({ guests })
    expect(app.handlePurchaseGift(gift)).toEqual({ success: true })
    expect(sheets.Orders.rows).toHaveLength(2)
    expect(sentMail).toHaveLength(0)
  })

  it('the card sends them once each, with the card in full', () => {
    const { app, sentMail } = createSandbox({ guests })
    app.handlePurchaseGift(gift)
    app.handleSubmitCard({
      guestId: 'r01',
      giftName: 'Jantar',
      theme: 'cerrado',
      from: 'Ana e Bruno',
      message: 'Muito amor!',
      completePurchase: true,
      selectedCotaLabels: ['Entrada', 'Prato'],
    })
    expect(sentMail).toHaveLength(2)
    const [toGuest, toCouple] = sentMail
    expect(toGuest.to).toBe('ana@example.com')
    expect(toGuest.subject).toContain('Confirmação do presente')
    expect(toGuest.body).toContain('• Entrada')
    expect(toGuest.body).toContain('Muito amor!')
    expect(toGuest.htmlBody).toContain('Muito amor!')
    expect(toCouple.to).toBe('a@example.com,b@example.com')
    expect(toCouple.subject).toContain('Presente recebido')
    expect(toCouple.body).toContain('R$ 200,00')
    expect(toCouple.body).toContain('Muito amor!')
    expect(toCouple.replyTo).toBe('ana@example.com')
  })

  it('skipping the card sends the same two mails, without one', () => {
    const { app, sentMail } = createSandbox({ guests })
    app.handlePurchaseGift(gift)
    const out = app.handleFinishPurchase({
      guestId: 'r01',
      giftName: 'Jantar',
      selectedCotaLabels: ['Entrada', 'Prato'],
    })
    expect(out).toEqual({ success: true })
    expect(sentMail.map((m) => m.to)).toEqual(['ana@example.com', 'a@example.com,b@example.com'])
    expect(sentMail[0].body).not.toContain('Seu cartão')
    expect(sentMail[1].body).not.toContain('Cartão')
  })

  it('a PayPal order is mailed from the order\'s own columns, even with the header names missing', () => {
    const orders = [
      ['timestamp', 'guestId', 'groupName', 'guestEmail', 'giftId', 'giftName', 'selectedCotas', 'totalPrice', 'cardMessage'],
      ['2026-01-01', 'r01', 'Ana e Bruno', 'ana@example.com', 'g1', 'Jantar', '["c1"]', 200, '', 'paypal', 'EUR', 32, 'CAP123'],
    ]
    const { app, sentMail } = createSandbox({ guests, orders })
    app.handleFinishPurchase({ guestId: 'r01', giftName: 'Jantar', selectedCotaLabels: ['Entrada'] })
    expect(sentMail[0].body).toContain('€ 32,00')
    expect(sentMail[1].body).toContain('PayPal, € 32,00 (ref. CAP123)')
  })

  it('finishPurchase without an order of theirs mails nobody', () => {
    const { app, sentMail } = createSandbox({ guests })
    expect(app.handleFinishPurchase({ guestId: 'r01', giftName: 'Jantar' }).success).toBe(false)
    expect(sentMail).toHaveLength(0)
  })

  it('the card is mailed even when the Cards tab is missing: it is created', () => {
    const { app, sheets, sentMail } = createSandbox({ guests, noCardsTab: true })
    app.handlePurchaseGift(gift)
    app.handleSubmitCard({
      guestId: 'r01',
      giftName: 'Jantar',
      theme: 'cerrado',
      from: 'Ana',
      message: 'Oi!',
      completePurchase: true,
      selectedCotaLabels: ['Entrada'],
    })
    expect(sheets.Cards.rows.at(-1)?.[6]).toBe('Oi!')
    expect(sheets.Cards.rows.some((r) => r[0] === 'timestamp' && r[6] === 'message')).toBe(true)
    expect(sentMail).toHaveLength(2)
  })
})


describe('the card as an image', () => {
  const guests = guestsSheet(['r01', 'Ana e Bruno', 'pt', 'Bruno Souza', true])
  const orders = [
    ORDERS_HEADER,
    ['2026-01-01', 'r01', 'Ana e Bruno', 'ana@example.com', 'g1', 'Jantar', '["c1"]', 200, '', 'pix', 'BRL', 200, ''],
  ]
  // A JPEG starts FF D8 FF E0.
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4]).toString('base64')
  const card = {
    guestId: 'r01',
    giftName: 'Jantar',
    theme: 'cerrado',
    from: 'Ana e Bruno',
    message: 'Muito amor!',
    completePurchase: true,
    selectedCotaLabels: ['Entrada'],
    cardImage: jpeg,
  }

  it('shows it in both mails and attaches it to them', () => {
    const { app, sentMail } = createSandbox({ guests, orders })
    app.handleSubmitCard(card)
    expect(sentMail).toHaveLength(2)
    for (const mail of sentMail) {
      expect(mail.htmlBody).toContain('cid:cartao')
      expect(mail.inlineImages?.cartao.type).toBe('image/jpeg')
      expect(mail.attachments).toHaveLength(1)
      expect(mail.attachments?.[0].name).toBe('Cartão - Ana e Bruno.jpg')
      expect(mail.attachments?.[0].bytes.slice(0, 2)).toEqual([-1, -40])
      // The text is still there, for clients that don't show images.
      expect(mail.body).toContain('Muito amor!')
    }
  })

  it('archives it in Drive and records where, in the Cards tab', () => {
    const { app, sheets, driveFiles } = createSandbox({ guests, orders })
    app.handleSubmitCard(card)
    expect(driveFiles).toHaveLength(1)
    expect(driveFiles[0].folder).toBe('Cartões do casamento')
    expect(driveFiles[0].name).toMatch(/^\d{4}-\d\d-\d\d \d\dh\d\d - Ana e Bruno - Jantar\.jpg$/)
    expect(driveFiles[0].bytes.slice(0, 2)).toEqual([-1, -40])
    expect(sheets.Cards.rows.at(-1)?.[7]).toContain('https://drive.example/')
  })

  it('Drive refusing never stops the mails', () => {
    const { app, sheets, sentMail } = createSandbox({
      guests,
      orders,
      driveError: new Error('You do not have permission to call DriveApp.createFolder'),
    })
    expect(app.handleSubmitCard(card)).toEqual({ success: true })
    expect(sentMail).toHaveLength(2)
    expect(sentMail[0].htmlBody).toContain('cid:cartao')
    expect(sheets.Cards.rows.at(-1)?.[7]).toBe('')
  })

  it('takes only a JPEG within the limit: anything else is ignored, the mails carry the text', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4]).toString('base64')
    for (const cardImage of [png, 'not base64!', 'A'.repeat(6_000_001)]) {
      const { app, sentMail, driveFiles } = createSandbox({ guests, orders })
      app.handleSubmitCard({ ...card, cardImage })
      expect(sentMail).toHaveLength(2)
      expect(sentMail[0].inlineImages).toBeUndefined()
      expect(sentMail[0].attachments).toBeUndefined()
      expect(sentMail[0].htmlBody).not.toContain('cid:cartao')
      expect(sentMail[0].body).toContain('Muito amor!')
      expect(driveFiles).toHaveLength(0)
    }
  })

  it('the card sent on its own (older page) carries the image too', () => {
    const { app, sentMail } = createSandbox({ guests, orders })
    app.handleSubmitCard({ ...card, completePurchase: false })
    expect(sentMail).toHaveLength(2)
    expect(sentMail.every((m) => m.attachments?.length === 1)).toBe(true)
  })
})

describe('handleSubmitCard', () => {
  const guests = guestsSheet(['r01', 'Ana e Bruno', 'pt', 'Bruno Souza', true])

  it('appends a Cards row and mails the couple (no order found: only them)', () => {
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

  it('mails the card, in full, to the couple and to the guest who gave the gift', () => {
    const orders = [
      ORDERS_HEADER,
      ['2026-01-01', 'r01', 'Ana e Bruno', 'ana@example.com', 'g1', 'Air Fryer', JSON.stringify(['c1']), 380, ''],
    ]
    const { app, sentMail } = createSandbox({ guests, orders })
    app.handleSubmitCard({
      guestId: 'r01',
      giftName: 'Air Fryer',
      theme: 'zelda',
      from: 'Ana e Bruno',
      message: 'Muito amor!\nBeijos <3',
    })
    expect(sentMail).toHaveLength(2)
    const [toCouple, toGuest] = sentMail
    expect(toCouple.to).toBe('a@example.com,b@example.com')
    expect(toCouple.replyTo).toBe('ana@example.com')
    expect(toCouple.body).toContain('Muito amor!\nBeijos <3')
    expect(toCouple.body).toContain('R$ 380,00')
    expect(toCouple.htmlBody).toContain('Muito amor!<br>Beijos &lt;3')
    expect(toGuest.to).toBe('ana@example.com')
    expect(toGuest.subject).toContain('Seu cartão')
    expect(toGuest.body).toContain('Muito amor!\nBeijos <3')
    expect(toGuest.body).toContain('Air Fryer')
    expect(toGuest.htmlBody).toContain('Muito amor!<br>Beijos &lt;3')
  })

  it('takes the address from the guest\'s own order, never from the request', () => {
    const orders = [
      ORDERS_HEADER,
      ['2026-01-01', 'r01', 'Ana e Bruno', 'ana@example.com', 'g1', 'Air Fryer', JSON.stringify(['c1']), 380, ''],
      ['2026-01-02', 'r99', 'Outros', 'outros@example.com', 'g2', 'Panela', JSON.stringify(['c2']), 100, ''],
    ]
    const { app, sentMail } = createSandbox({ guests, orders })
    app.handleSubmitCard({
      guestId: 'r01',
      giftName: 'Air Fryer',
      theme: 'up',
      from: 'Ana',
      message: 'Oi',
      guestEmail: 'evil@example.com',
    } as never)
    expect(sentMail.map((m) => m.to)).toEqual(['a@example.com,b@example.com', 'ana@example.com'])
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
