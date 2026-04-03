/**
 * Wedding Website — Google Apps Script Backend
 *
 * HOW TO DEPLOY:
 * 1. Go to script.google.com and create a new project
 * 2. Paste this code into Code.gs
 * 3. Update SHEET_ID with your Google Sheets document ID
 * 4. Update COUPLE_EMAIL with your email address
 * 5. Click Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Copy the Web App URL and paste it into src/content.config.ts → appScriptUrl
 *
 * GOOGLE SHEETS SETUP:
 * Create a spreadsheet with 5 tabs named exactly:
 *   Guests | Gifts | Cotas | RSVPs | Orders
 *
 * Guests columns: guestId | groupName | language | attendees | hasPhoto | notes
 * Gifts columns:  giftId | name_pt | name_en | description_pt | description_en | imageUrl
 * Cotas columns:  cotaId | giftId | label_pt | label_en | price | purchased | purchasedBy | purchasedAt
 * RSVPs columns:  timestamp | guestId | groupName | attendeesJson | songRequest | message
 * Orders columns: timestamp | guestId | groupName | guestEmail | giftId | giftName | selectedCotas | totalPrice | cardMessage
 */

var SHEET_ID = 'YOUR_GOOGLE_SHEETS_ID_HERE';
var COUPLE_EMAIL = 'YOUR_EMAIL_HERE@gmail.com';

// ── CORS headers ─────────────────────────────────────────────────────────────

function cors(output) {
  return output
    .setMimeType(ContentService.MimeType.JSON)
    .addHeader('Access-Control-Allow-Origin', '*')
    .addHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .addHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function jsonResponse(data) {
  return cors(ContentService.createTextOutput(JSON.stringify(data)));
}

// ── Entry points ─────────────────────────────────────────────────────────────

function doGet(e) {
  try {
    var action = e.parameter.action;
    if (action === 'getGuest') return jsonResponse(handleGetGuest(e.parameter));
    if (action === 'getGifts') return jsonResponse(handleGetGifts());
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
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName(name);
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

// ── Handlers ─────────────────────────────────────────────────────────────────

function handleGetGuest(params) {
  var sheet = getSheet('Guests');
  var rows = sheetToObjects(sheet);

  if (params.id) {
    var byId = rows.find(function(r) { return r.guestId === params.id; });
    if (!byId) return null;
    return formatGuest(byId);
  }

  if (params.name) {
    var needle = normalize(params.name);
    // Exact match first
    var exact = rows.find(function(r) { return normalize(r.groupName) === needle; });
    if (exact) return formatGuest(exact);
    // Fuzzy: check if any attendee name matches
    var fuzzy = rows.find(function(r) {
      var attendees = String(r.attendees).split(',').map(normalize);
      return attendees.some(function(a) { return a.includes(needle) || needle.includes(a); });
    });
    if (fuzzy) return formatGuest(fuzzy);
    // Partial group name match
    var partial = rows.find(function(r) {
      return normalize(r.groupName).includes(needle) || needle.includes(normalize(r.groupName));
    });
    if (partial) return formatGuest(partial);
    return null;
  }

  return null;
}

function formatGuest(row) {
  return {
    guestId: row.guestId,
    groupName: row.groupName,
    language: row.language || 'pt',
    attendees: String(row.attendees).split(',').map(function(s) { return s.trim(); }).filter(Boolean),
    hasPhoto: row.hasPhoto === true || row.hasPhoto === 'true' || row.hasPhoto === 'TRUE',
    notes: row.notes || '',
  };
}

function handleGetGifts() {
  var gifts = sheetToObjects(getSheet('Gifts'));
  var cotas = sheetToObjects(getSheet('Cotas'));

  return gifts.map(function(g) {
    var giftCotas = cotas.filter(function(c) { return c.giftId === g.giftId; });
    var available = giftCotas.filter(function(c) {
      return c.purchased !== true && c.purchased !== 'true' && c.purchased !== 'TRUE';
    }).length;
    return {
      giftId: g.giftId,
      name_pt: g.name_pt,
      name_en: g.name_en,
      description_pt: g.description_pt,
      description_en: g.description_en,
      imageUrl: g.imageUrl,
      cotas: giftCotas.map(function(c) {
        return {
          cotaId: c.cotaId,
          giftId: c.giftId,
          label_pt: c.label_pt,
          label_en: c.label_en,
          price: Number(c.price),
          purchased: c.purchased === true || c.purchased === 'true' || c.purchased === 'TRUE',
          purchasedBy: c.purchasedBy || '',
        };
      }),
      available: available,
      total: giftCotas.length,
    };
  });
}

function handlePurchaseGift(body) {
  var guestId = body.guestId;
  var giftId = body.giftId;
  var giftName = body.giftName;
  var selectedCotaIds = body.selectedCotaIds;
  var totalPrice = body.totalPrice;
  var guestEmail = body.guestEmail;
  var cardMessage = body.cardMessage || '';

  // Validate cotas are still available
  var cotaSheet = getSheet('Cotas');
  var cotaData = cotaSheet.getDataRange().getValues();
  var cotaHeaders = cotaData[0];
  var cotaIdIdx = cotaHeaders.indexOf('cotaId');
  var purchasedIdx = cotaHeaders.indexOf('purchased');
  var purchasedByIdx = cotaHeaders.indexOf('purchasedBy');
  var purchasedAtIdx = cotaHeaders.indexOf('purchasedAt');

  var now = new Date().toISOString();
  var purchasedCotas = [];

  for (var i = 1; i < cotaData.length; i++) {
    var rowCotaId = cotaData[i][cotaIdIdx];
    if (selectedCotaIds.indexOf(rowCotaId) !== -1) {
      if (cotaData[i][purchasedIdx] === true || cotaData[i][purchasedIdx] === 'true' || cotaData[i][purchasedIdx] === 'TRUE') {
        return { success: false, error: 'Cota ' + rowCotaId + ' já foi comprada.' };
      }
      cotaSheet.getRange(i + 1, purchasedIdx + 1).setValue(true);
      cotaSheet.getRange(i + 1, purchasedByIdx + 1).setValue(guestId);
      cotaSheet.getRange(i + 1, purchasedAtIdx + 1).setValue(now);
      purchasedCotas.push(String(cotaData[i][cotaHeaders.indexOf('label_pt')]));
    }
  }

  // Append to Orders sheet
  var ordersSheet = getSheet('Orders');
  var guestRow = handleGetGuest({ id: guestId });
  ordersSheet.appendRow([
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

  // Send confirmation email to guest
  if (guestEmail) {
    sendPurchaseEmail(guestEmail, guestRow, giftName, purchasedCotas, totalPrice, cardMessage, COUPLE_EMAIL);
  }

  return { success: true };
}

function sendPurchaseEmail(to, guest, giftName, cotaLabels, totalPrice, cardMessage, coupleBcc) {
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
    coupleBcc,
  ].filter(function(l) { return l !== undefined; }).join('\n');

  MailApp.sendEmail({
    to: to,
    bcc: coupleBcc,
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

  // Notify couple
  MailApp.sendEmail({
    to: COUPLE_EMAIL,
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
