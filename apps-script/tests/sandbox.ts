import { readFileSync } from 'node:fs'
import { createContext, runInContext } from 'node:vm'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const codePath = resolve(here, '..', 'Code.gs')
const source = readFileSync(codePath, 'utf8')

type Row = unknown[]

class FakeSheet {
  constructor(
    public name: string,
    public rows: Row[],
  ) {}
  getDataRange() {
    return { getValues: () => this.rows }
  }
  appendRow(row: Row) {
    this.rows.push(row)
  }
}

export interface SandboxOptions {
  guests?: Row[]
  rsvps?: Row[]
  orders?: Row[]
}

export interface AppsScriptGlobals {
  doGet: (e: { parameter: Record<string, string> }) => { getContent: () => string }
  doPost: (e: { postData: { contents: string } }) => { getContent: () => string }
  handleGetGuest: (params: { id?: string; name?: string }) => Guest | null
  handleGetSoldCotas: () => { sold: string[] }
  handlePurchaseGift: (body: PurchaseBody) => { success: boolean; error?: string }
  handleSubmitRSVP: (body: RSVPBody) => { success: boolean }
  collectSoldCotaIds: () => Record<string, boolean>
}

export interface Guest {
  guestId: string
  groupName: string
  language: string
  attendees: string[]
  hasPhoto: boolean
}

export interface PurchaseBody {
  guestId: string
  giftId: string
  giftName: string
  selectedCotaIds: string[]
  selectedCotaLabels: string[]
  totalPrice: number
  guestEmail: string
  cardMessage: string
}

export interface RSVPBody {
  guestId: string
  attendeesJson: string
  songRequest?: string
  message?: string
}

export interface Sandbox {
  app: AppsScriptGlobals
  sheets: Record<'Guests' | 'RSVPs' | 'Orders', FakeSheet>
  sentMail: Array<{ to: string; bcc?: string; subject: string; body: string }>
}

const defaultGuests: Row[] = [['guestId', 'groupName', 'language', 'attendees', 'hasPhoto']]
const defaultRsvps: Row[] = [
  ['timestamp', 'guestId', 'groupName', 'attendeesJson', 'songRequest', 'message'],
]
const defaultOrders: Row[] = [
  [
    'timestamp',
    'guestId',
    'groupName',
    'guestEmail',
    'giftId',
    'giftName',
    'selectedCotas',
    'totalPrice',
    'cardMessage',
  ],
]

export function createSandbox(opts: SandboxOptions = {}): Sandbox {
  const sheets = {
    Guests: new FakeSheet('Guests', opts.guests ?? defaultGuests.map((r) => [...r])),
    RSVPs: new FakeSheet('RSVPs', opts.rsvps ?? defaultRsvps.map((r) => [...r])),
    Orders: new FakeSheet('Orders', opts.orders ?? defaultOrders.map((r) => [...r])),
  }
  const sentMail: Sandbox['sentMail'] = []

  const ctx = {
    SpreadsheetApp: {
      openById: () => ({
        getSheetByName: (name: keyof typeof sheets) => sheets[name],
      }),
    },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput: (s: string) => ({
        setMimeType: (m: unknown) => ({ getContent: () => s, getMimeType: () => m }),
      }),
    },
    MailApp: {
      sendEmail: (args: { to: string; bcc?: string; subject: string; body: string }) => {
        sentMail.push(args)
      },
    },
    LockService: {
      getScriptLock: () => ({
        waitLock: () => {},
        releaseLock: () => {},
      }),
    },
    console,
  } as Record<string, unknown>

  createContext(ctx)
  runInContext(source, ctx)

  return { app: ctx as unknown as AppsScriptGlobals, sheets, sentMail }
}
