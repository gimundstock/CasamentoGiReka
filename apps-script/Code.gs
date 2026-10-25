/**
 * Wedding Website — Google Apps Script Backend
 *
 * HOW TO DEPLOY: see apps-script/README.md (pushed with clasp).
 *
 * CONFIGURATION — no private values live in this file. Set them once in the
 * Apps Script editor under Project Settings → Script properties:
 *   SHEET_ID       the Google Sheets document ID
 *   COUPLE_EMAILS  comma-separated addresses that receive RSVP and gift copies
 *                  (must mirror CONFIG.coupleEmails in src/content.config.ts)
 *
 * GOOGLE SHEETS SETUP:
 * Create a spreadsheet with 3 tabs named exactly:
 *   Guests | RSVPs | Orders
 *
 * The gift catalog lives in src/content.config.ts (CONFIG.gifts). The sheet
 * only stores state — guests, RSVPs, and the purchase log. Availability is
 * derived from which cotaIds appear in the Orders tab.
 *
 * Guests columns: guestId | groupName | language | attendees | hasPhoto
 * RSVPs columns:  timestamp | guestId | groupName | attendeesJson | songRequest | message
 * Orders columns: timestamp | guestId | groupName | guestEmail | giftId | giftName | selectedCotas | totalPrice | cardMessage
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

/** Whether this guest already has a reply in the RSVPs tab. */
function hasRsvp(guestId) {
  return sheetToObjects(getSheet('RSVPs')).some(function(r) {
    return String(r.guestId) === String(guestId);
  });
}

function formatGuest(row) {
  return {
    guestId: row.guestId,
    groupName: row.groupName,
    language: row.language || 'pt',
    attendees: String(row.attendees).split(',').map(function(s) { return s.trim(); }).filter(Boolean),
    hasPhoto: row.hasPhoto === true || row.hasPhoto === 'true' || row.hasPhoto === 'TRUE',
    rsvpSubmitted: hasRsvp(row.guestId),
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

    var sold = collectSoldCotaIds();
    for (var i = 0; i < selectedCotaIds.length; i++) {
      if (sold[selectedCotaIds[i]]) {
        return { success: false, error: 'Cota ' + selectedCotaIds[i] + ' já foi comprada.' };
      }
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
    ]);

    if (guestEmail) {
      sendPurchaseEmail(guestEmail, guestRow, giftName, selectedCotaLabels, totalPrice, cardMessage);
    }

    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

function sendPurchaseEmail(to, guest, giftName, cotaLabels, totalPrice, cardMessage) {
  var guestName = guest ? guest.groupName : to;
  var subject = '🌸 Confirmação do presente — ' + giftName;

  var cotaList = cotaLabels.map(function(l) { return '• ' + l; }).join('\n');

  var body = [
    'Olá, ' + guestName + '!',
    '',
    'Obrigado pelo seu presente! Aqui está a confirmação:',
    '',
    '🎁 Presente: ' + giftName,
    cotaList,
    'Total: R$ ' + Number(totalPrice).toFixed(2),
    '',
    cardMessage ? '💌 Seu cartão:\n"' + cardMessage + '"' : '',
    '',
    'Mal podemos esperar para celebrar com você!',
    '',
    'Com carinho,',
    COUPLE_NAMES,
  ].filter(function(l) { return l !== undefined; }).join('\n');

  MailApp.sendEmail({
    to: to,
    bcc: coupleEmailsCsv(),
    subject: subject,
    body: body,
  });
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
