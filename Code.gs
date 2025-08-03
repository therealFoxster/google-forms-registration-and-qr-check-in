function uuid() {
  return Utilities.getUuid();
}

function onFormSubmit(e) {
  const sheet = e.range.getSheet();
  const row = e.range.getRow();
  const values = e.values;

  const [timestamp, name, email] = values;
  let uuid = sheet.getRange(row, 4).getValue(); // Column D

  // Generate UUID if missing
  if (!uuid) {
    uuid = Utilities.getUuid();
    sheet.getRange(row, 4).setValue(uuid); // Set UUID in column D
  }

  const CHECKIN_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzZ3Is8ETEQrols2a6PC67U-8ED9r_97TH_yG8v_tmg3FT6gcu1YykkUd08BRsx60G7Vg/exec';
  const qrUrl = `https://quickchart.io/qr?text=${CHECKIN_ENDPOINT}?uuid=${uuid}&size=200`;

  const htmlBody = `
    <p>Hello ${name},</p>
    <p>Thanks for signing up! Please bring this QR code with you to the event for check-in:</p>
    <img src="${qrUrl}" width="200" height="200">
    <p>See you soon!</p>
  `;

  GmailApp.sendEmail(email, "Your Event QR Code", "Plain text fallback", {
    htmlBody: htmlBody,
  });

  // Mark as sent
  sheet.getRange(row, 5).setValue("Sent"); // Column E
}

function doGet(e) {
  const uuid = e.parameter.uuid;
  if (!uuid) return HtmlService.createHtmlOutput("❌ No UUID provided.");

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();

  const HEADER_ROW = 1;
  const UUID_COL = 4; // Column D (0-indexed: 3)
  const CHECKED_IN_COL = 6; // Column F (0-indexed: 5)
  const CHECKIN_TIME_COL = 7; // Column G (0-indexed: 6)

  // Skip header row
  for (let i = HEADER_ROW; i < data.length; i++) {
    if (data[i][UUID_COL - 1] === uuid) {
      const name = data[i][1]; // Name column (B)

      // Check if already checked in
      if (data[i][CHECKED_IN_COL - 1] === 'Yes') {
        return HtmlService.createHtmlOutput(`✅ <b>${name}</b> already checked in.`);
      }

      // Mark as checked in
      sheet.getRange(i + 1, CHECKED_IN_COL).setValue("Yes");
      sheet.getRange(i + 1, CHECKIN_TIME_COL).setValue(new Date());

      return HtmlService.createHtmlOutput(`✅ <b>${name}</b> successfully checked in!`);
    }
  }

  return HtmlService.createHtmlOutput("❌ UUID not found.");
}