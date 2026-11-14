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

    // Two mails: the confirmation to whoever gave the gift, and the couple's
    // own receipt (which they get even if the guest left no address).
    var cotaLabels = selectedCotaLabels;
    var paidLabel = formatMoney(amountPaid, currency);
    if (guestEmail) {
      sendPurchaseEmail(guestEmail, guestRow, giftName, cotaLabels, paidLabel, cardMessage);
    }
    sendCoupleReceipt({
      guestId: guestId,
      groupName: guestRow ? guestRow.groupName : guestId,
      guestEmail: guestEmail,
      giftName: giftName,
      cotaLabels: cotaLabels,
      totalPrice: totalPrice,
      paymentMethod: paymentMethod,
      paidLabel: paidLabel,
      paymentRef: paymentRef,
      cardMessage: cardMessage,
    });

    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

function formatMoney(amount, currency) {
  var symbol = currency === 'BRL' ? 'R$' : currency === 'EUR' ? '€' : currency;
  return symbol + ' ' + Number(amount).toFixed(2);
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

/** A paragraph of plain text as HTML: its lines kept. */
function htmlParagraph(text) {
  return '<p style="margin:0 0 12px;">' + escapeHtml(text).replace(/\n/g, '<br>') + '</p>';
}

/** The written card as a block of its own, for the HTML half of a mail. */
function htmlCard(message, from) {
  return (
    '<div style="margin:16px 0;padding:20px 24px;background:#FBF6EC;border:1px solid #E4D9BF;' +
    'border-radius:10px;font-family:Georgia,serif;font-size:17px;line-height:1.5;color:#4A4033;">' +
    escapeHtml(message).replace(/\n/g, '<br>') +
    (from
      ? '<div style="margin-top:14px;text-align:right;font-style:italic;">— ' + escapeHtml(from) + '</div>'
      : '') +
    '</div>'
  );
}

function htmlBodyOf(parts) {
  return '<div style="font-family:Arial,sans-serif;font-size:15px;color:#333;">' + parts.join('') + '</div>';
}

/** What the guest gets as soon as the gift is confirmed. */
function sendPurchaseEmail(to, guest, giftName, cotaLabels, totalLabel, cardMessage) {
  var guestName = guest ? guest.groupName : to;
  var subject = '🌸 Confirmação do presente — ' + giftName;

  var cotaList = cotaLabels.map(function(l) { return '• ' + l; }).join('\n');

  var lines = [
    'Olá, ' + guestName + '!',
    '',
    'Obrigado pelo seu presente! Aqui está a confirmação:',
    '',
    '🎁 Presente: ' + giftName,
    cotaList,
    'Total: ' + totalLabel,
  ];
  var close = ['Mal podemos esperar para celebrar com você!', '', 'Com carinho,', COUPLE_NAMES];
  var body = lines.concat([''], cardMessage ? ['💌 Seu cartão:', '"' + cardMessage + '"', ''] : [], close).join('\n');

  var parts = [htmlParagraph(lines.join('\n'))];
  if (cardMessage) parts.push(htmlParagraph('💌 Seu cartão:'), htmlCard(cardMessage, ''));
  parts.push(htmlParagraph(close.join('\n')));

  sendMail({ to: to, subject: subject, body: body, htmlBody: htmlBodyOf(parts) });
}

/** The couple's own record of a gift, apart from the guest's confirmation. */
function sendCoupleReceipt(o) {
  var pix = o.paymentMethod !== 'paypal';
  var lines = [
    'Presente recebido!',
    '',
    'De: ' + o.groupName + ' (' + o.guestId + ')',
    'E-mail: ' + (o.guestEmail || '(não informado)'),
    '',
    '🎁 Presente: ' + o.giftName,
    o.cotaLabels.map(function(l) { return '• ' + l; }).join('\n'),
    'Total: ' + formatMoney(o.totalPrice, 'BRL'),
    pix
      ? 'Pagamento: PIX (o convidado confirmou no site: conferir no extrato)'
      : 'Pagamento: PayPal, ' + o.paidLabel + (o.paymentRef ? ' (ref. ' + o.paymentRef + ')' : ''),
  ];
  var parts = [htmlParagraph(lines.join('\n'))];
  var body = lines.join('\n');
  if (o.cardMessage) {
    body += '\n\n💌 Cartão:\n"' + o.cardMessage + '"';
    parts.push(htmlParagraph('💌 Cartão:'), htmlCard(o.cardMessage, ''));
  }
  sendMail(replyingTo(o.guestEmail, {
    to: coupleEmailsCsv(),
    subject: '🎁 Presente recebido — ' + o.giftName + ' (' + o.groupName + ')',
    body: body,
    htmlBody: htmlBodyOf(parts),
  }));
}

/** The guest's latest order of this gift (else their latest order), or null. */
function lastOrderFor(guestId, giftName) {
  var mine = sheetToObjects(getSheet('Orders')).filter(function(o) {
    return String(o.guestId) === String(guestId);
  });
  for (var i = mine.length - 1; i >= 0; i--) {
    if (String(mine[i].giftName) === String(giftName)) return mine[i];
  }
  return mine.length ? mine[mine.length - 1] : null;
}

/**
 * A card a guest writes for the couple after buying a gift. Stored in the
 * Cards tab and mailed to both: to the couple, and a copy to the guest (at
 * the address they gave with the gift) — each with the card in full.
 */
function handleSubmitCard(body) {
  var guestRow = handleGetGuest({ id: body.guestId });
  var groupName = guestRow ? guestRow.groupName : body.guestId;
  var message = String(body.message || '').slice(0, 400);
  var from = String(body.from || groupName).slice(0, 60);
  var theme = String(body.theme || '').slice(0, 30);
  var giftName = String(body.giftName || '').slice(0, 120);

  getSheet('Cards').appendRow([
    new Date().toISOString(),
    body.guestId,
    groupName,
    giftName,
    theme,
    from,
    message,
  ]);

  // The address and the total come from the order the guest made, never from
  // the request: a card can't be used to mail anyone else.
  var order = lastOrderFor(body.guestId, giftName);
  var guestEmail = order ? String(order.guestEmail || '') : '';

  var coupleLines = [
    'Cartão de ' + from + ' (' + groupName + ')',
    'Presente: ' + giftName + (order && order.totalPrice ? ' — ' + formatMoney(order.totalPrice, 'BRL') : ''),
    'E-mail: ' + (guestEmail || '(não informado)'),
    'Modelo: ' + theme,
  ];
  sendMail(replyingTo(guestEmail, {
    to: coupleEmailsCsv(),
    subject: '💌 Novo cartão de ' + from + ' — ' + giftName,
    body: coupleLines.concat(['', '"' + message + '"']).join('\n'),
    htmlBody: htmlBodyOf([htmlParagraph(coupleLines.join('\n')), htmlCard(message, from)]),
  }));

  if (guestEmail) {
    var guestLines = [
      'Olá, ' + groupName + '!',
      '',
      'Seu cartão para ' + COUPLE_NAMES + ' foi entregue. Aqui está uma cópia:',
    ];
    var close = ['Presente: ' + giftName, '', 'Com carinho,', COUPLE_NAMES];
    sendMail({
      to: guestEmail,
      subject: '💌 Seu cartão para ' + COUPLE_NAMES,
      body: guestLines.concat(['', '"' + message + '"', '— ' + from, ''], close).join('\n'),
      htmlBody: htmlBodyOf([htmlParagraph(guestLines.join('\n')), htmlCard(message, from), htmlParagraph(close.join('\n'))]),
    });
  }

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

  MailApp.sendEmail({
    to: coupleEmailsCsv(),
    subject: '✅ RSVP recebido — ' + groupName,
    body: [
      'Nova confirmação de presença!',
      '',
      'Grupo: ' + groupName,
      'ID: ' + guestId,
      '',
      'Convidados: ' + attendeesJson,
      songRequest ? 'Música: ' + songRequest : '',
      message ? 'Mensagem: ' + message : '',
    ].filter(Boolean).join('\n'),
  });

  return { success: true };
}
