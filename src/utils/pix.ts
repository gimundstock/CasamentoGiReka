// PIX QR payload builder (EMV QRCPS-MPM spec)
// Generates the "Pix Copia e Cola" string used in QR codes

function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0')
  return `${id}${len}${value}`
}

function crc16(str: string): string {
  let crc = 0xffff
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021
      } else {
        crc <<= 1
      }
      crc &= 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export interface PixPayloadOptions {
  pixKey: string
  amount: number
  name: string       // merchant name, max 25 chars
  city: string       // max 15 chars
  txid?: string      // max 25 chars, alphanumeric only
  description?: string
}

export function buildPixPayload(opts: PixPayloadOptions): string {
  const merchantName = opts.name.slice(0, 25).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const city = opts.city.slice(0, 15).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const txid = (opts.txid ?? '***').replace(/[^a-zA-Z0-9]/g, '').slice(0, 25) || '***'

  // Merchant Account Info (ID 26)
  const pixKeyField = tlv('01', opts.pixKey)
  const descField = opts.description ? tlv('02', opts.description.slice(0, 72)) : ''
  const merchantAccountInfo = tlv('26', tlv('00', 'BR.GOV.BCB.PIX') + pixKeyField + descField)

  // Additional data (ID 62): transaction reference
  const additionalData = tlv('62', tlv('05', txid))

  // Amount field (ID 54)
  const amountStr = opts.amount.toFixed(2)

  const payload =
    tlv('00', '01') +                   // Payload Format Indicator
    tlv('01', '12') +                   // Point of Initiation Method (12 = dynamic, 11 = static)
    merchantAccountInfo +
    tlv('52', '0000') +                 // Merchant Category Code
    tlv('53', '986') +                  // Transaction Currency (BRL)
    tlv('54', amountStr) +              // Transaction Amount
    tlv('58', 'BR') +                   // Country Code
    tlv('59', merchantName) +           // Merchant Name
    tlv('60', city) +                   // Merchant City
    additionalData +
    '6304'                              // CRC placeholder

  return payload + crc16(payload)
}
