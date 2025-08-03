function onFormSubmit(e) {
  const sheet = e.range.getSheet();
  const row = e.range.getRow();
  // const values = e.values; 
  const values = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  const config = getConfig();
  const columns = getColumnMappings(sheet);

  // Get name and email from form submission
  const name = values[columns.name - 1];
  const email = values[columns.email - 1];

  // Handle UUID column
  let uuid;
  if (columns.uuid) {
    uuid = sheet.getRange(row, columns.uuid).getValue();
    if (!uuid) {
      uuid = Utilities.getUuid();
      sheet.getRange(row, columns.uuid).setValue(uuid);
    }
  } else {
    // If no UUID column found, add one
    const lastCol = sheet.getLastColumn();
    sheet.getRange(1, lastCol + 1).setValue('UUID');
    uuid = Utilities.getUuid();
    sheet.getRange(row, lastCol + 1).setValue(uuid);
  }

  const qrUrl = `https://quickchart.io/qr?text=${config.checkin_endpoint}?uuid=${uuid}&size=${config.qr_size}`;

  const htmlBody = `
    <p>${config.email_greeting.replace('{name}', name)}</p>
    <p>${config.email_body}</p>
    <img src="${qrUrl}" width="${config.qr_size}" height="${config.qr_size}">
    <p>${config.email_closing}</p>
  `;

  GmailApp.sendEmail(email, config.email_subject, "Plain text fallback", {
    htmlBody: htmlBody,
  });

  // Mark as sent if column exists
  if (columns.isEmailSent) {
    sheet.getRange(row, columns.isEmailSent).setValue(`Sent`);
  }
}