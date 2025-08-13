function onFormSubmit(e) {
  const sheet = e.range.getSheet();
  const row = e.range.getRow();
  // const values = e.values; 
  const values = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  const config = Library.getConfig();
  let columns = Library.getColumnMappings(sheet);

  // Ensure Status column exists for capacity/waitlist logic
  if (!columns.status) {
    const lastCol = sheet.getLastColumn();
    sheet.insertColumnAfter(lastCol);
    sheet.getRange(1, lastCol + 1).setValue('Status');
    columns = Library.getColumnMappings(sheet);
  }

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
      if (aboveId && !isNaN(aboveId)) {
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

  ////////////
  // REJECT //
  ////////////
  if (columns.rejectionCriteria) {
    const rejectionCriteria = sheet.getRange(row, columns.rejectionCriteria).getValue();
    if (rejectionCriteria && rejectionCriteria.toLowerCase().includes('yes')) {
      const html = `
        <p>${Library.replaceTokens(config.rejection_email_body, { name, id, uuid })}</p>
      `;

      GmailApp.sendEmail(email, config.rejection_email_subject, "Plain text fallback", {
        htmlBody: html
      });

      // Set status to rejected
      if (columns.status) {
        sheet.getRange(row, columns.status).setValue('Rejected');
      }

      return;
    }
  }

  //////////////
  // WAITLIST //
  //////////////
  // Use a lock to avoid race conditions with concurrent submissions
  const lock = LockService.getScriptLock();
  let locked = false;
  try {
    locked = lock.tryLock(30000);
    // Capacity-based waitlist only if registration_limit is configured
    const limit = parseInt(config.registration_limit, 10);
    if (!isNaN(limit) && limit > 0) {
      const totalRows = Math.max(0, sheet.getLastRow() - 1);
      const statusValues = columns.status
        ? sheet.getRange(2, columns.status, Math.max(0, totalRows)).getValues().flat()
        : [];

      // Count confirmed seats (Confirmation Sent or Checked In)
      const confirmedCount = statusValues.reduce((acc, v) => {
        const s = String(v || '').toLowerCase();
        return acc + ((s === 'confirmation sent' || s === 'checked in') ? 1 : 0);
      }, 0);

      if (confirmedCount >= limit) {
        const waitlistedCount = statusValues.filter(v => String(v || '').toLowerCase() === 'waitlisted').length + 1;

        // Send waitlisted email
        const html = `
          <p>${Library
            .replaceTokens(config.waitlisted_email_body || 'You have been added to the waitlist at position {waitlisted_count}.', { name, id, uuid })
            .replaceAll('{waitlisted_count}', String(waitlistedCount))
          }</p>
        `;

        GmailApp.sendEmail(
          email,
          config.waitlisted_email_subject || 'You are on the waitlist',
          'Plain text fallback',
          { htmlBody: html }
        );

        // Set status to waitlisted
        if (columns.status) {
          sheet.getRange(row, columns.status).setValue('Waitlisted');
        }

        return;
      }
    }
  } finally {
    if (locked) lock.releaseLock();
  }

  //////////////////
  // CONFIRMATION //
  //////////////////
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

  // Set status to confirmation sent
  if (columns.status) {
    sheet.getRange(row, columns.status).setValue('Confirmation Sent');
  }
}