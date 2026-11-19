/**
 * RSVP receiver for the wedding website.
 * Paste this whole file into Extensions > Apps Script of your RSVP Google Sheet.
 * Then follow the steps in README.md.
 */
const SHEET_NAME = 'RSVPs';
const HEADERS = ['Received', 'Name', 'Attending', 'Party size', 'Guest names',
                 'Dietary requirements', 'Email', 'Message', 'Invite (from personal link)'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
    const p = e.parameter;
    const clean = (v) => String(v || '').slice(0, 1000).replace(/^[=+\-@]/, "'$&"); // stop formula injection
    sheet.appendRow([
      new Date(), clean(p.name), clean(p.attending), clean(p.guests), clean(p.guestNames),
      clean(p.dietary), clean(p.email), clean(p.message), clean(p.invite),
    ]);
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Opening the Web App URL in a browser shows this, which is handy for checking it is live.
function doGet() {
  return ContentService.createTextOutput('RSVP endpoint is running.');
}
