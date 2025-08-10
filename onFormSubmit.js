function onFormSubmit(e) {
  const sheet = e.range.getSheet();
  const row = e.range.getRow();
  // const values = e.values; 
  const values = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  const config = Library.getConfig();
  const columns = Library.getColumnMappings(sheet);

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

  // Handle ID column (row number)
  let id;
  if (columns.id) {
    id = sheet.getRange(row, columns.id).getValue();
    if (!id) {
      // Check id of row above
      const aboveId = sheet.getRange(row - 1, columns.id).getValue();
      if (aboveId) {
        id = aboveId + 1;
      } else {
        id = 1; // Start from 1 if no ID above
      }

      sheet.getRange(row, columns.id).setValue(id);
    }
  } else {
    // If no ID column found, add one new col in 4th position
    sheet.insertColumnAfter(3);
    sheet.getRange(1, 4).setValue('ID');
    id = 1;
    sheet.getRange(row, 4).setValue(id);
  }

  // Send rejection email
  if (columns.rejectionCriteria) {
    const rejectionCriteria = sheet.getRange(row, columns.rejectionCriteria).getValue();
    if (rejectionCriteria && rejectionCriteria.toLowerCase().includes('yes')) {
      const html = `
        <p>${Library.replaceTokens(config.rejection_email_body, { name, id, uuid })}</p>
      `;

      GmailApp.sendEmail(email, config.rejection_email_subject, "Plain text fallback", {
        htmlBody: html
      });

      return;
    }
  }

  const qrUrl = `https://quickchart.io/qr?text=${config.checkin_endpoint}?uuid=${uuid}&size=${config.qr_size}`;
  // Generate QR code as blob and attach it
  const qrBlob = UrlFetchApp.fetch(qrUrl).getBlob();
  qrBlob.setName(`${uuid}.png`);

  const htmlBody = `
    <p>${Library.replaceTokens(config.email_body, { name, id, uuid })}</p>
  `;

  GmailApp.sendEmail(email, config.email_subject, "Plain text fallback", {
    htmlBody: htmlBody,
    attachments: [qrBlob]
  });

  // Mark as sent if column exists
  if (columns.isEmailSent) {
    sheet.getRange(row, columns.isEmailSent).setValue(`Sent`);
  }
}