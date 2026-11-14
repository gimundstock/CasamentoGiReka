/**
 * Wedding Website — Google Apps Script Backend
 *
 * HOW TO DEPLOY: see apps-script/README.md (pushed with clasp).
 *
 * CONFIGURATION — no private values live in this file. Set them once in the
 * Apps Script editor under Project Settings → Script properties:
 *   SHEET_ID       the Google Sheets document ID
 *   GUEST_PHOTOS_FOLDER_ID  optional: the Drive folder holding one subfolder per
 *                  guest, named by guestId, with that guest's photos
 *   PHOTO_SYNC_TOKEN  a long random string, also a GitHub Actions secret: the
 *                  deploy uses it to list every guest photo and copy them
 *                  into the site (action=photoManifest)
 *   COUPLE_EMAILS  comma-separated addresses that receive the RSVPs, the gift
 *                  receipts and the cards
 *   SITE_URL       (optional) where the mails' pictures are served from (public/email/);
 *                  else https://giovannaerenato.com.br
 *   CARDS_FOLDER_ID  (optional) Drive folder where the cards' images are archived;
 *                  else a "Cartões do casamento" folder is made in the owner's Drive
 *                  (must mirror CONFIG.coupleEmails in src/content.config.ts)
 *   PAYPAL_CLIENT_ID, PAYPAL_SECRET
 *                  the PayPal REST app's credentials (developer.paypal.com),
 *                  needed only for PayPal gifts. The Secret lives here only.
 *   PAYPAL_ENV     'live' for real payments; anything else (or unset) uses
 *                  the PayPal sandbox
 *
 * GOOGLE SHEETS SETUP:
 * Create a spreadsheet with 4 tabs named exactly:
 *   Guests | RSVPs | Orders | Cards
 *
 * The gift catalog lives in src/content.config.ts (CONFIG.gifts). The sheet
 * only stores state — guests, RSVPs, and the purchase log. Availability is
 * derived from which cotaIds appear in the Orders tab.
 *
 * Guests columns: guestId | groupName | language | attendees | displayName | padrinhos | genero
 *   groupName    the name on the invitation, also what guests type to log in
 *   displayName  optional: how the site greets them ("Mãe e Pai"); blank → groupName
 *   padrinhos    the invitation's padrinhos, by name ("Alice, Laura"): they also
 *                get the padrinhos' manual, made out to them. TRUE: all of the
 *                invitation's attendees. (The header may also be `padrinho`.)
 *   genero       optional: F or M, so the Portuguese invitation says
 *                convidada/convidado (one guest) or convidadas/convidados (a
 *                group: F only when they're all women). Blank: convidado(a) for
 *                one, convidados for a group. (The header may also be `gênero`
 *                or `gender`.)
 * Columns are read by header name, so their order in the sheet doesn't matter.
 * A guest's photos aren't in the sheet: they're whatever images sit in their
 * Drive subfolder (see GUEST_PHOTOS_FOLDER_ID), in file-name order.
 * RSVPs columns:  timestamp | guestId | groupName | attendeesJson | songRequest | message
 * Orders columns: timestamp | guestId | groupName | guestEmail | giftId | giftName | selectedCotas | totalPrice | cardMessage | paymentMethod | currency | amountPaid | paymentRef
 *   totalPrice is always in BRL (the catalog price). paymentMethod is 'pix' or
 *   'paypal'; for PayPal, currency/amountPaid are what PayPal actually
 *   captured and paymentRef is the PayPal capture ID.
 * Cards columns:  timestamp | guestId | groupName | giftName | theme | from | message
 */

var COUPLE_NAMES = 'Giovanna & Renato';

/** Reads a required Script Property, failing loudly if it was never set. */
function requiredProperty(key) {
  var value = PropertiesService.getScriptProperties().getProperty(key);
  if (!value) throw new Error('Missing Script Property: ' + key);
  return value;
}

function coupleEmailsCsv() {
  return requiredProperty('COUPLE_EMAILS')
    .split(',')
    .map(function(s) { return s.trim(); })
    .filter(Boolean)
    .join(',');
}

// ── Response helper ──────────────────────────────────────────────────────────
// Apps Script web apps deployed with "Anyone" access automatically send
// Access-Control-Allow-Origin: * — no manual CORS headers needed (and
// TextOutput.addHeader throws if you try).

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}

// ── Entry points ─────────────────────────────────────────────────────────────

function doGet(e) {
  try {
    var action = e.parameter.action;
    if (action === 'getGuest') return jsonResponse(handleGetGuest(e.parameter));
    if (action === 'getSoldCotas') return jsonResponse(handleGetSoldCotas());
    if (action === 'photoManifest') return jsonResponse(handlePhotoManifest(e.parameter));
    return jsonResponse({ error: 'Unknown action' });
  } catch (err) {
    return jsonResponse({ error: String(err) });
  }
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;
    if (action === 'purchaseGift') return jsonResponse(handlePurchaseGift(body));
    if (action === 'submitRSVP') return jsonResponse(handleSubmitRSVP(body));
    if (action === 'submitCard') return jsonResponse(handleSubmitCard(body));
    if (action === 'finishPurchase') return jsonResponse(handleFinishPurchase(body));
    return jsonResponse({ error: 'Unknown action' });
  } catch (err) {
    return jsonResponse({ error: String(err) });
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getSheet(name) {
  return SpreadsheetApp.openById(requiredProperty('SHEET_ID')).getSheetByName(name);
}

function sheetToObjects(sheet) {
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  return data.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });
}

function normalize(str) {
  return String(str).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * A name as a comparable key: case, accents, punctuation and extra spaces
 * don't matter, "&" / "e" / "and" are the same joiner, and the people in a
 * group can be listed in any order ("Felipe e Eva" = "Eva & Felipe").
 */
function nameKey(str) {
  return normalize(str)
    .replace(/&/g, ' e ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+(?:e|and)\s+|\s*,\s*/)
    .map(function(part) { return part.replace(/\s+/g, ' ').trim(); })
    .filter(Boolean)
    .sort()
    .join('|');
}

function collectSoldCotaIds() {
  var orders = sheetToObjects(getSheet('Orders'));
  var sold = {};
  orders.forEach(function(o) {
    try {
      var ids = JSON.parse(o.selectedCotas || '[]');
      if (Array.isArray(ids)) ids.forEach(function(id) { sold[id] = true; });
    } catch (e) {
      // ignore malformed rows
    }
  });
  return sold;
}

// ── Handlers ─────────────────────────────────────────────────────────────────

function handleGetGuest(params) {
  var sheet = getSheet('Guests');
  var rows = sheetToObjects(sheet);

  if (params.id) {
    var byId = rows.find(function(r) { return r.guestId === params.id; });
    if (!byId) return null;
    return formatGuest(byId);
  }

  // By name: exact matches only — on the group name or on one guest's full
  // name. No partial matching, so "Eva e Felipe" can never land on a
  // group that merely contains an "Eva".
  if (params.name) {
    var needle = nameKey(params.name);
    if (needle.replace(/\|/g, '').length < 2) return null;
    var byGroup = rows.find(function(r) { return nameKey(r.groupName) === needle; });
    if (byGroup) return formatGuest(byGroup);
    var byAttendee = rows.find(function(r) {
      return String(r.attendees).split(',').some(function(a) {
        return a.trim() && nameKey(a) === needle;
      });
    });
    if (byAttendee) return formatGuest(byAttendee);
    return null;
  }

  return null;
}

/**
 * This guest's latest reply in the RSVPs tab, as [{ name, attending }], or
 * null if they haven't replied. A malformed attendeesJson still counts as a
 * reply, with an empty list.
 */
function latestRsvpAttendees(guestId) {
  var rows = sheetToObjects(getSheet('RSVPs')).filter(function(r) {
    return String(r.guestId) === String(guestId);
  });
  if (!rows.length) return null;
  try {
    var parsed = JSON.parse(rows[rows.length - 1].attendeesJson || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.map(function(a) {
      return { name: String(a.name || ''), attending: a.attending === true };
    });
  } catch (e) {
    return [];
  }
}

/**
 * The invitation's padrinhos, by name, from the `padrinhos` (or `padrinho`)
 * cell: a comma-separated list; TRUE (a checkbox) for all its attendees;
 * blank or FALSE for none.
 */
function padrinhoNames(row) {
  var cell = row.padrinhos != null ? row.padrinhos : row.padrinho;
  if (cell == null || cell === false) return [];
  if (isTrue(cell)) return splitNames(row.attendees);
  var text = String(cell).trim();
  if (!text || text.toLowerCase() === 'false') return [];
  return splitNames(text);
}

/**
 * The invitation's grammatical gender, from the `genero` (or `gênero`,
 * `gender`) cell: 'f' for F/feminino/female, 'm' for M/masculino/male, ''
 * when blank or anything else.
 */
function guestGender(row) {
  var cell = row.genero != null ? row.genero : row['gênero'] != null ? row['gênero'] : row.gender;
  var first = normalize(cell == null ? '' : cell).charAt(0);
  return first === 'f' || first === 'm' ? first : '';
}

/** A comma-separated list of names, trimmed, blanks dropped. */
function splitNames(value) {
  return String(value == null ? '' : value)
    .split(',')
    .map(function(s) { return s.trim(); })
    .filter(Boolean);
}

/** A checkbox or TRUE/true typed into a cell. */
function isTrue(value) {
  return value === true || String(value).trim().toLowerCase() === 'true';
}

/** The images in a Drive folder, in file-name order, as { name, id }. */
function imagesIn(folder) {
  var files = folder.getFiles();
  var images = [];
  while (files.hasNext()) {
    var f = files.next();
    if (String(f.getMimeType()).indexOf('image/') === 0) {
      images.push({ name: f.getName(), id: f.getId() });
    }
  }
  images.sort(function(a, b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0; });
  return images;
}

function guestPhotosRoot() {
  var rootId = PropertiesService.getScriptProperties().getProperty('GUEST_PHOTOS_FOLDER_ID');
  return rootId ? DriveApp.getFolderById(rootId) : null;
}

/**
 * The images in this guest's Drive subfolder, in file-name order, as Drive
 * URLs. The site shows the copy the deploy made of each one (see
 * handlePhotoManifest) and falls back to this URL for photos added since.
 * Drive serves them only if the folder is shared "anyone with the link".
 * Any trouble (no property, no subfolder, Drive down) means no photos, never
 * a failed login.
 */
function guestPhotoUrls(guestId) {
  if (!guestId) return [];
  try {
    var root = guestPhotosRoot();
    if (!root) return [];
    var folders = root.getFoldersByName(String(guestId));
    if (!folders.hasNext()) return [];
    return imagesIn(folders.next()).map(function(img) {
      return 'https://lh3.googleusercontent.com/d/' + img.id + '=w1600';
    });
  } catch (e) {
    console.error('guestPhotoUrls(' + guestId + '): ' + e);
    return [];
  }
}

/**
 * Every guest photo's Drive file ID, for the deploy to copy them into the
 * site. It lists all guests' photos at once, so it needs PHOTO_SYNC_TOKEN.
 */
function handlePhotoManifest(params) {
  var token = requiredProperty('PHOTO_SYNC_TOKEN');
  if (!params || params.token !== token) return { error: 'Forbidden' };
  var root = guestPhotosRoot();
  if (!root) return { ids: [] };
  var ids = [];
  var folders = root.getFolders();
  while (folders.hasNext()) {
    imagesIn(folders.next()).forEach(function(img) { ids.push(img.id); });
  }
  return { ids: ids };
}

function formatGuest(row) {
  var rsvp = latestRsvpAttendees(row.guestId);
  var displayName = String(row.displayName == null ? '' : row.displayName).trim();
  return {
    guestId: row.guestId,
    groupName: row.groupName,
    displayName: displayName || String(row.groupName),
    language: row.language || 'pt',
    attendees: String(row.attendees).split(',').map(function(s) { return s.trim(); }).filter(Boolean),
    photos: guestPhotoUrls(row.guestId),
    padrinhos: padrinhoNames(row),
    padrinho: padrinhoNames(row).length > 0,
    gender: guestGender(row),
    rsvpSubmitted: rsvp !== null,
    rsvpAttendees: rsvp || [],
  };
}

function handleGetSoldCotas() {
  var sold = collectSoldCotaIds();
  return { sold: Object.keys(sold) };
}

function handlePurchaseGift(body) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var guestId = body.guestId;
    var giftId = body.giftId;
    var giftName = body.giftName;
    var selectedCotaIds = body.selectedCotaIds || [];
    var selectedCotaLabels = body.selectedCotaLabels || [];
    var totalPrice = body.totalPrice;
    var guestEmail = body.guestEmail;
    var cardMessage = body.cardMessage || '';

    var paymentMethod = body.paymentMethod === 'paypal' ? 'paypal' : 'pix';

    var sold = collectSoldCotaIds();
    for (var i = 0; i < selectedCotaIds.length; i++) {
      if (sold[selectedCotaIds[i]]) {
        return { success: false, error: 'Cota ' + selectedCotaIds[i] + ' já foi comprada.' };
      }
    }

    // PIX is paid outside the site; the guest's word is the record. A PayPal
    // order is only approved by the guest at this point: we capture it here,
    // after the cotas are known to be free, so a sold-out cota never charges.
    var currency = 'BRL';
    var amountPaid = totalPrice;
    var paymentRef = '';
    if (paymentMethod === 'paypal') {
      var capture = capturePaypalOrder(body.paypalOrderId);
      if (!capture.ok) return { success: false, error: capture.error };
      currency = capture.currency;
      amountPaid = capture.amount;
      paymentRef = capture.captureId;
      if (!guestEmail) guestEmail = capture.payerEmail;
    }

    var now = new Date().toISOString();
    var guestRow = handleGetGuest({ id: guestId });

    getSheet('Orders').appendRow([
      now,
      guestId,
      guestRow ? guestRow.groupName : guestId,
      guestEmail,
      giftId,
      giftName,
      JSON.stringify(selectedCotaIds),
      totalPrice,
      cardMessage,
      paymentMethod,
      currency,
      amountPaid,
      paymentRef,
    ]);

    // The mails wait for the card when the site says one is coming
    // (deferEmail): the gift's confirmation and the couple's receipt then
    // go out once, with the card, from submitCard / finishPurchase. Without
    // it (an older page), they go now.
    if (!body.deferEmail) {
      mailOrder(
        {
          guestId: guestId,
          guestEmail: guestEmail,
          giftName: giftName,
          totalPrice: totalPrice,
          paymentMethod: paymentMethod,
          currency: currency,
          amountPaid: amountPaid,
          paymentRef: paymentRef,
        },
        selectedCotaLabels,
        cardMessage ? { message: cardMessage, from: '' } : null
      );
    }

    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

function formatMoney(amount, currency) {
  var symbol = currency === 'BRL' ? 'R$' : currency === 'EUR' ? '€' : currency;
  // Written the Brazilian way: 2.300,00.
  var parts = Number(amount).toFixed(2).split('.');
  return symbol + ' ' + parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + parts[1];
}

function paypalBaseUrl() {
  var env = PropertiesService.getScriptProperties().getProperty('PAYPAL_ENV');
  return env === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
}

/**
 * Captures a PayPal order the guest approved in the browser. Returns
 * { ok, captureId, amount, currency, payerEmail } or { ok: false, error }.
 */
function capturePaypalOrder(orderId) {
  if (!orderId || !/^[A-Za-z0-9-]+$/.test(String(orderId))) {
    return { ok: false, error: 'Pedido PayPal inválido.' };
  }
  var base = paypalBaseUrl();
  var auth = Utilities.base64Encode(
    requiredProperty('PAYPAL_CLIENT_ID') + ':' + requiredProperty('PAYPAL_SECRET')
  );
  var tokenRes = UrlFetchApp.fetch(base + '/v1/oauth2/token', {
    method: 'post',
    headers: { Authorization: 'Basic ' + auth },
    payload: { grant_type: 'client_credentials' },
    muteHttpExceptions: true,
  });
  if (tokenRes.getResponseCode() !== 200) {
    return { ok: false, error: 'PayPal indisponível. Tente novamente.' };
  }
  var token = JSON.parse(tokenRes.getContentText()).access_token;

  var res = UrlFetchApp.fetch(base + '/v2/checkout/orders/' + orderId + '/capture', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: '{}',
    muteHttpExceptions: true,
  });
  var order = {};
  try {
    order = JSON.parse(res.getContentText());
  } catch (e) {
    // fall through to the status check
  }
  var unit = order.purchase_units && order.purchase_units[0];
  var cap = unit && unit.payments && unit.payments.captures && unit.payments.captures[0];
  if (res.getResponseCode() >= 300 || order.status !== 'COMPLETED' || !cap) {
    return { ok: false, error: 'O pagamento PayPal não foi concluído.' };
  }
  return {
    ok: true,
    captureId: cap.id,
    amount: Number(cap.amount.value),
    currency: cap.amount.currency_code,
    payerEmail: (order.payer && order.payer.email_address) || '',
  };
}

/**
 * Mail must never undo what is already recorded: a purchase or a card is in
 * its sheet by now, so a mail that fails (quota, a bad address) is logged and
 * the guest still sees it go through.
 */
function sendMail(args) {
  try {
    MailApp.sendEmail(args);
  } catch (e) {
    if (typeof console !== 'undefined') console.error('sendEmail failed: ' + e);
  }
}

/** `args` with Reply-To set to the guest's address, so the couple can answer them. */
function replyingTo(email, args) {
  if (email) args.replyTo = email;
  return args;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── HTML mails, in the site's look ───────────────────────────────────────────
// Table layout and inline styles, as mail clients need. The site's fonts are
// asked for (Apple Mail and iOS show them); Gmail and Outlook fall back to
// Georgia / Arial. The header (the couple's names in the site's script among
// the Save the Date's wildflowers, still) is a picture served by the site
// itself, from public/email/.

var MAIL = {
  canvas: '#F3EEE7', // around the mail
  paper: '#FBFAF8', // the site's background (and the header picture's)
  text: '#535351', // the site's text
  heading: '#3D3229',
  accent: '#94651A', // amber for small labels
  line: '#E7DCC9',
  serif: "'Cormorant Garamond', Georgia, 'Times New Roman', serif",
  sans: "Jost, 'Helvetica Neue', Helvetica, Arial, sans-serif",
};

/** The site's address (SITE_URL Script Property, else the wedding domain), no trailing slash. */
function siteUrl() {
  var url = PropertiesService.getScriptProperties().getProperty('SITE_URL');
  return String(url || 'https://giovannaerenato.com.br').replace(/\/+$/, '');
}

/** A paragraph of plain text: its lines kept. */
function htmlParagraph(text) {
  return (
    '<p style="margin:0 0 14px;font-family:' + MAIL.serif + ';font-size:18px;line-height:1.55;color:' +
    MAIL.text + ';">' + escapeHtml(text).replace(/\n/g, '<br>') + '</p>'
  );
}

/** A small spaced-out capital label, as the site's kickers. */
function htmlLabel(text) {
  return (
    '<p style="margin:22px 0 8px;font-family:' + MAIL.sans + ';font-size:11px;letter-spacing:3px;' +
    'text-transform:uppercase;color:' + MAIL.accent + ';">' + escapeHtml(text) + '</p>'
  );
}

/** Label / value rows, the value as HTML already (escape it first). */
function htmlDetails(rows) {
  return (
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 10px;' +
    'border-top:1px solid ' + MAIL.line + ';">' +
    rows
      .filter(function(r) { return r && r[1] !== ''; })
      .map(function(r) {
        return (
          '<tr><td valign="top" style="padding:10px 12px 10px 0;width:110px;border-bottom:1px solid ' + MAIL.line +
          ';font-family:' + MAIL.sans + ';font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8A8A87;">' +
          escapeHtml(r[0]) + '</td><td style="padding:9px 0;border-bottom:1px solid ' + MAIL.line +
          ';font-family:' + MAIL.serif + ';font-size:17px;line-height:1.45;color:' + MAIL.text + ';">' + r[1] +
          '</td></tr>'
        );
      })
      .join('') +
    '</table>'
  );
}

/** Lines of text as escaped HTML, one per line. */
function htmlLines(lines) {
  return lines.map(escapeHtml).join('<br>');
}

/** The written card as a block of its own (no picture of it). */
function htmlCard(message, from) {
  return (
    '<div style="margin:8px 0 16px;padding:22px 26px;background:#FFF4E8;border:1px solid ' + MAIL.line + ';' +
    'border-radius:12px;font-family:' + MAIL.serif + ';font-size:18px;line-height:1.55;color:' + MAIL.text + ';">' +
    escapeHtml(message).replace(/\n/g, '<br>') +
    (from
      ? '<div style="margin-top:14px;text-align:right;font-style:italic;">— ' + escapeHtml(from) + '</div>'
      : '') +
    '</div>'
  );
}

/** The card as the picture the guest made on the site, embedded (cid:cartao). */
function htmlCardImage() {
  return (
    '<p style="margin:8px 0 16px;"><img src="cid:cartao" alt="Cartão" width="488" style="display:block;' +
    'width:100%;max-width:488px;height:auto;border-radius:12px;border:1px solid ' + MAIL.line + ';"></p>'
  );
}

/** The card's image, shown in the mail and attached to it, when there is one. */
function withCardImage(args, blob) {
  if (blob) {
    args.inlineImages = { cartao: blob };
    args.attachments = [blob];
  }
  return args;
}

/**
 * A whole mail: the header (the couple's names among wildflowers), a kicker
 * and a title, the content, and the site's address at the foot.
 * o = { kicker, title, preheader, parts: [html, …] }
 */
function emailShell(o) {
  var site = siteUrl();
  var host = site.replace(/^https?:\/\//, '');
  return (
    '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400' +
    '&family=Jost:wght@400;500&display=swap" rel="stylesheet"></head>' +
    '<body style="margin:0;padding:0;background:' + MAIL.canvas + ';">' +
    // What the inbox shows next to the subject.
    '<div style="display:none;max-height:0;overflow:hidden;opacity:0;">' + escapeHtml(o.preheader || '') + '</div>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' + MAIL.canvas + ';">' +
    '<tr><td align="center" style="padding:28px 12px;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:' +
    MAIL.paper + ';border:1px solid ' + MAIL.line + ';border-radius:20px;">' +
    // The header picture, the kicker, the title.
    '<tr><td style="padding:0;"><a href="' + site + '" style="text-decoration:none;"><img src="' + site +
    '/email/header.jpg" width="560" alt="' + escapeHtml(COUPLE_NAMES) + '" style="display:block;width:100%;max-width:560px;' +
    'height:auto;border:0;border-radius:20px 20px 0 0;"></a></td></tr>' +
    '<tr><td align="center" style="padding:16px 32px 6px;">' +
    (o.kicker
      ? '<p style="margin:0 0 6px;font-family:' + MAIL.sans + ';font-size:11px;letter-spacing:4px;' +
        'text-transform:uppercase;color:' + MAIL.accent + ';">' + escapeHtml(o.kicker) + '</p>'
      : '') +
    '<h1 style="margin:0;font-family:' + MAIL.serif + ';font-size:30px;font-weight:400;font-style:italic;' +
    'line-height:1.2;color:' + MAIL.heading + ';">' + escapeHtml(o.title) + '</h1>' +
    '</td></tr>' +
    // The content.
    '<tr><td style="padding:22px 36px 8px;">' + o.parts.join('') + '</td></tr>' +
    // The foot: the site's address.
    '<tr><td align="center" style="padding:14px 32px 28px;">' +
    '<a href="' + site + '" style="font-family:' + MAIL.sans + ';font-size:11px;letter-spacing:3px;' +
    'text-transform:uppercase;color:' + MAIL.accent + ';text-decoration:none;">' + escapeHtml(host) + '</a>' +
    '</td></tr></table></td></tr></table></body></html>'
  );
}

/** What the guest gets for their gift: the confirmation (with their card, once written). */
function sendPurchaseEmail(to, guest, giftName, cotaLabels, totalLabel, cardMessage, cardFrom, cardBlob) {
  // Greeted as the site greets them (displayName, else the group's name).
  var guestName = guest ? guest.displayName || guest.groupName : to;
  var subject = '🌸 Confirmação do presente — ' + giftName;

  var cotaList = cotaLabels.map(function(l) { return '• ' + l; }).join('\n');

  var lines = [
    guestName + ',',
    'Recebemos o seu presente, e ficamos muito agradecidos com o carinho. Aqui está a confirmação:',
    '',
    '🎁 Presente: ' + giftName,
    cotaList,
    'Total: ' + totalLabel,
  ];
  var close = ['Com carinho,', COUPLE_NAMES];
  var body = lines.concat([''], cardMessage ? ['💌 Seu cartão:', '"' + cardMessage + '"' + (cardFrom ? '\n— ' + cardFrom : ''), ''] : [], close).join('\n');

  var parts = [
    htmlParagraph(guestName + ',\nRecebemos o seu presente, e ficamos muito agradecidos com o carinho. Aqui está a confirmação:'),
    htmlDetails([
      ['Presente', escapeHtml(giftName)],
      ['Cotas', htmlLines(cotaLabels)],
      ['Total', escapeHtml(totalLabel)],
    ]),
  ];
  if (cardMessage) {
    parts.push(htmlLabel('Seu cartão'), cardBlob ? htmlCardImage() : htmlCard(cardMessage, cardFrom));
  }

  sendMail(withCardImage({
    to: to,
    subject: subject,
    body: body,
    htmlBody: emailShell({
      kicker: 'Presente confirmado',
      title: 'Obrigado pelo carinho!',
      preheader: giftName + ' — ' + totalLabel,
      parts: parts,
    }),
  }, cardBlob));
}

/** The couple's own record of a gift, apart from the guest's confirmation. */
function sendCoupleReceipt(o) {
  var pix = o.paymentMethod !== 'paypal';
  var payment = pix
    ? 'PIX (o convidado confirmou no site: conferir no extrato)'
    : 'PayPal, ' + o.paidLabel + (o.paymentRef ? ' (ref. ' + o.paymentRef + ')' : '');
  var lines = [
    'Presente recebido!',
    '',
    'De: ' + o.groupName + ' (' + o.guestId + ')',
    'E-mail: ' + (o.guestEmail || '(não informado)'),
    '',
    '🎁 Presente: ' + o.giftName,
    o.cotaLabels.map(function(l) { return '• ' + l; }).join('\n'),
    'Total: ' + formatMoney(o.totalPrice, 'BRL'),
    'Pagamento: ' + payment,
  ];
  var body = lines.join('\n');
  var parts = [
    htmlDetails([
      ['De', escapeHtml(o.groupName) + ' <span style="color:#8A8A87;">(' + escapeHtml(o.guestId) + ')</span>'],
      ['E-mail', escapeHtml(o.guestEmail || '(não informado)')],
      ['Presente', escapeHtml(o.giftName)],
      ['Cotas', htmlLines(o.cotaLabels)],
      ['Total', escapeHtml(formatMoney(o.totalPrice, 'BRL'))],
      ['Pagamento', escapeHtml(payment)],
    ]),
  ];
  if (o.cardMessage) {
    body += '\n\n💌 Cartão' + (o.cardFrom ? ' de ' + o.cardFrom : '') + ':\n"' + o.cardMessage + '"';
    parts.push(htmlLabel('Cartão' + (o.cardFrom ? ' de ' + o.cardFrom : '')), o.cardBlob ? htmlCardImage() : htmlCard(o.cardMessage, o.cardFrom));
  }
  sendMail(withCardImage(replyingTo(o.guestEmail, {
    to: coupleEmailsCsv(),
    subject: '🎁 Presente recebido — ' + o.giftName + ' (' + o.groupName + ')',
    body: body,
    htmlBody: emailShell({
      kicker: 'Presente recebido',
      title: o.giftName,
      preheader: o.groupName + ' — ' + formatMoney(o.totalPrice, 'BRL'),
      parts: parts,
    }),
  }), o.cardBlob));
}

/**
 * The guest's latest order of this gift (else their latest order), or null.
 * Read by column position, as appended: the sheet's header row may be missing
 * names for the payment columns, and a mail must not depend on it.
 */
function lastOrderFor(guestId, giftName) {
  var rows = getSheet('Orders').getDataRange().getValues().slice(1).filter(function(r) {
    return String(r[1]) === String(guestId);
  });
  var row = null;
  for (var i = rows.length - 1; i >= 0 && !row; i--) {
    if (String(rows[i][5]) === String(giftName)) row = rows[i];
  }
  row = row || rows[rows.length - 1];
  if (!row) return null;
  return {
    guestId: row[1],
    guestEmail: String(row[3] || ''),
    giftName: row[5],
    totalPrice: row[7],
    paymentMethod: row[9] === 'paypal' ? 'paypal' : 'pix',
    currency: row[10] || 'BRL',
    amountPaid: row[11] === '' || row[11] === undefined ? row[7] : row[11],
    paymentRef: row[12] || '',
  };
}

/**
 * The two mails for a gift, once: the confirmation to the guest (at the
 * address on their order) and the receipt to the couple — each with the
 * written card in full, when there is one: card = { message, from }.
 */
function mailOrder(order, cotaLabels, card) {
  var guestRow = handleGetGuest({ id: order.guestId });
  var paidLabel = formatMoney(order.amountPaid, order.currency);
  var message = card ? card.message : '';
  var from = card ? card.from : '';
  if (order.guestEmail) {
    sendPurchaseEmail(order.guestEmail, guestRow, order.giftName, cotaLabels, paidLabel, message, from, card ? card.blob : null);
  }
  sendCoupleReceipt({
    guestId: order.guestId,
    groupName: guestRow ? guestRow.groupName : order.guestId,
    guestEmail: order.guestEmail,
    giftName: order.giftName,
    cotaLabels: cotaLabels,
    totalPrice: order.totalPrice,
    paymentMethod: order.paymentMethod,
    paidLabel: paidLabel,
    paymentRef: order.paymentRef,
    cardMessage: message,
    cardFrom: from,
    cardBlob: card ? card.blob : null,
  });
}

/** The cota names the site sends along, only ever shown in the mail text. */
function cleanLabels(labels) {
  return (Array.isArray(labels) ? labels : []).slice(0, 40).map(function(l) {
    return String(l).slice(0, 120);
  });
}

/** The Cards tab, made (with its header) if the sheet doesn't have one yet. */
function cardsSheet() {
  var ss = SpreadsheetApp.openById(requiredProperty('SHEET_ID'));
  var sheet = ss.getSheetByName('Cards');
  if (!sheet) {
    sheet = ss.insertSheet('Cards');
    sheet.appendRow(['timestamp', 'guestId', 'groupName', 'giftName', 'theme', 'from', 'message', 'imageUrl']);
  }
  return sheet;
}

/** Largest card image taken, as base64 text (a 1484 x 1060 JPEG is ~0.4 MB). */
var MAX_CARD_IMAGE_B64 = 6000000;

/**
 * The card as the guest saw it on the site (the picture they chose, their
 * text on it), sent as base64 JPEG. Anything that isn't a JPEG within the
 * size limit is ignored, and the mails carry the text alone.
 */
function cardImageBlob(b64, from) {
  if (typeof b64 !== 'string' || !b64 || b64.length > MAX_CARD_IMAGE_B64) return null;
  if (!/^[A-Za-z0-9+\/=]+$/.test(b64)) return null;
  try {
    var bytes = Utilities.base64Decode(b64);
    // JPEG magic number FF D8 (as signed bytes).
    if (bytes.length < 4 || bytes[0] !== -1 || bytes[1] !== -40) return null;
    var name = ('Cartão - ' + from).replace(/[\\/:*?"<>|]/g, ' ').slice(0, 80) + '.jpg';
    return Utilities.newBlob(bytes, 'image/jpeg', name);
  } catch (e) {
    if (typeof console !== 'undefined') console.error('card image: ' + e);
    return null;
  }
}

/**
 * Archives the card image in Drive (CARDS_FOLDER_ID, or a folder "Cartões do
 * casamento" made in the owner's Drive) and returns its URL, or '' if Drive
 * wouldn't: the mails go out either way.
 */
function archiveCardImage(blob, stamp, from, giftName) {
  try {
    var id = PropertiesService.getScriptProperties().getProperty('CARDS_FOLDER_ID');
    var folder;
    if (id) {
      folder = DriveApp.getFolderById(id);
    } else {
      var found = DriveApp.getFoldersByName('Cartões do casamento');
      folder = found.hasNext() ? found.next() : DriveApp.createFolder('Cartões do casamento');
    }
    var name = (stamp.slice(0, 16).replace('T', ' ').replace(':', 'h') + ' - ' + from + ' - ' + giftName)
      .replace(/[\\/:*?"<>|]/g, ' ')
      .slice(0, 120) + '.jpg';
    return folder.createFile(Utilities.newBlob(blob.getBytes(), 'image/jpeg', name)).getUrl();
  } catch (e) {
    if (typeof console !== 'undefined') console.error('archive card image: ' + e);
    return '';
  }
}

/**
 * A card a guest writes for the couple after buying a gift: stored in the
 * Cards tab and mailed. With completePurchase (the site holds the gift's
 * mails until now) it sends them, once each, with the card in full: the
 * confirmation to the guest and the receipt to the couple. Without it (an
 * older page already mailed the gift) it sends the card on its own: to the
 * couple, and a copy to the guest. The address is taken from the guest's own
 * order, never from the request.
 */
function handleSubmitCard(body) {
  var guestRow = handleGetGuest({ id: body.guestId });
  var groupName = guestRow ? guestRow.groupName : body.guestId;
  var message = String(body.message || '').slice(0, 400);
  var from = String(body.from || groupName).slice(0, 60);
  var theme = String(body.theme || '').slice(0, 30);
  var giftName = String(body.giftName || '').slice(0, 120);

  var now = new Date().toISOString();
  var blob = cardImageBlob(body.cardImage, from);
  var imageUrl = blob ? archiveCardImage(blob, now, from, giftName) : '';

  // Whatever happens to the sheet, the card still reaches them by mail.
  try {
    cardsSheet().appendRow([
      now,
      body.guestId,
      groupName,
      giftName,
      theme,
      from,
      message,
      imageUrl,
    ]);
  } catch (e) {
    if (typeof console !== 'undefined') console.error('Cards tab: ' + e);
  }

  var order = lastOrderFor(body.guestId, giftName);
  if (body.completePurchase && order) {
    mailOrder(order, cleanLabels(body.selectedCotaLabels), { message: message, from: from, blob: blob });
    return { success: true };
  }

  var guestEmail = order ? order.guestEmail : '';
  var coupleLines = [
    'Cartão de ' + from + ' (' + groupName + ')',
    'Presente: ' + giftName + (order && order.totalPrice ? ' — ' + formatMoney(order.totalPrice, 'BRL') : ''),
    'E-mail: ' + (guestEmail || '(não informado)'),
    'Modelo: ' + theme,
  ];
  sendMail(withCardImage(replyingTo(guestEmail, {
    to: coupleEmailsCsv(),
    subject: '💌 Novo cartão de ' + from + ' — ' + giftName,
    body: coupleLines.concat(['', '"' + message + '"']).join('\n'),
    htmlBody: emailShell({
      kicker: 'Novo cartão',
      title: 'Cartão de ' + from,
      preheader: giftName,
      parts: [
        htmlDetails([
          ['De', escapeHtml(groupName)],
          ['Presente', escapeHtml(giftName) + (order && order.totalPrice ? ' — ' + escapeHtml(formatMoney(order.totalPrice, 'BRL')) : '')],
          ['E-mail', escapeHtml(guestEmail || '(não informado)')],
        ]),
        blob ? htmlCardImage() : htmlCard(message, from),
      ],
    }),
  }), blob));

  if (guestEmail) {
    var guestLines = [
      'Olá, ' + groupName + '!',
      '',
      'Seu cartão para ' + COUPLE_NAMES + ' foi entregue. Aqui está uma cópia:',
    ];
    var close = ['Presente: ' + giftName, '', 'Com carinho,', COUPLE_NAMES];
    sendMail(withCardImage({
      to: guestEmail,
      subject: '💌 Seu cartão para ' + COUPLE_NAMES,
      body: guestLines.concat(['', '"' + message + '"', '— ' + from, ''], close).join('\n'),
      htmlBody: emailShell({
        kicker: 'Cartão entregue',
        title: 'Seu cartão chegou!',
        preheader: giftName,
        parts: [
          htmlParagraph('Olá, ' + groupName + '!\nSeu cartão para ' + COUPLE_NAMES + ' foi entregue. Aqui está uma cópia:'),
          blob ? htmlCardImage() : htmlCard(message, from),
          htmlDetails([['Presente', escapeHtml(giftName)]]),
        ],
      }),
    }, blob));
  }

  return { success: true };
}

/** The guest left without writing a card: the gift's two mails, with none. */
function handleFinishPurchase(body) {
  var order = lastOrderFor(body.guestId, String(body.giftName || '').slice(0, 120));
  if (!order) return { success: false, error: 'Pedido não encontrado.' };
  mailOrder(order, cleanLabels(body.selectedCotaLabels), null);
  return { success: true };
}

function handleSubmitRSVP(body) {
  var guestId = body.guestId;
  var attendeesJson = body.attendeesJson;
  var songRequest = body.songRequest || '';
  var message = body.message || '';

  var guestRow = handleGetGuest({ id: guestId });
  var groupName = guestRow ? guestRow.groupName : guestId;

  var rsvpSheet = getSheet('RSVPs');
  rsvpSheet.appendRow([
    new Date().toISOString(),
    guestId,
    groupName,
    attendeesJson,
    songRequest,
    message,
  ]);

  var attendees = [];
  try {
    attendees = JSON.parse(attendeesJson || '[]');
  } catch (e) {
    attendees = [];
  }
  if (!Array.isArray(attendees)) attendees = [];
  var going = attendees.filter(function(a) { return a && a.attending; });
  var notGoing = attendees.filter(function(a) { return a && !a.attending; });
  var person = function(a) {
    return escapeHtml(a.name || '');
  };

  sendMail({
    to: coupleEmailsCsv(),
    subject: '✅ RSVP recebido — ' + groupName,
    body: [
      'Nova confirmação de presença!',
      '',
      'Grupo: ' + groupName,
      'ID: ' + guestId,
      '',
      'Vão: ' + (going.map(function(a) { return a.name; }).join(', ') || '—'),
      notGoing.length ? 'Não vão: ' + notGoing.map(function(a) { return a.name; }).join(', ') : '',
      songRequest ? 'Música: ' + songRequest : '',
    ].filter(Boolean).join('\n'),
    htmlBody: emailShell({
      kicker: 'Confirmação de presença',
      title: groupName,
      preheader: going.length + ' vão, ' + notGoing.length + ' não vão',
      parts: [
        htmlDetails([
          ['Vão', going.map(person).join('<br>') || '—'],
          ['Não vão', notGoing.map(person).join('<br>')],
          ['Música', escapeHtml(songRequest)],
          ['ID', escapeHtml(guestId)],
        ]),
      ],
    }),
  });

  return { success: true };
}
