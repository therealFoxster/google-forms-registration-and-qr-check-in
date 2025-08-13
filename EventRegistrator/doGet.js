function doGet(e) {
  const config = Library.getConfig();

  const uuid = e.parameter.uuid;

  if (!uuid) {
    return Library.errorPage(
      'Invalid Request',
      'UUID is missing.'
    );
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const columns = Library.getColumnMappings(sheet);

  // Skip header row
  for (let i = 1; i < data.length; i++) {
    if (columns.uuid && data[i][columns.uuid - 1] === uuid) {
      const name = data[i][columns.name - 1];
      const email = data[i][columns.email - 1];

      // Remove the cancelling registrant row
      sheet.deleteRow(i + 1);

      GmailApp.sendEmail(email, config.cancellation_email_subject, "Plain text fallback", {
        htmlBody: `
          <p>${Library.replaceTokens(config.cancellation_email_body, { name, email: email })}</p>
        `
      });

      // Promote first waitlisted user in order (top-most Waitlisted after header)
      if (columns.status) {
        const lastRow = sheet.getLastRow();
        if (lastRow > 1) {
          const statusCol = columns.status;
          const statusValues = sheet.getRange(2, statusCol, lastRow - 1).getValues().flat();
          const firstIdx = statusValues.findIndex(v => String(v || '').toLowerCase() === 'waitlisted');
          if (firstIdx >= 0) {
            const promoteRow = firstIdx + 2; // convert to sheet row
            const waitlistedUserName = columns.name ? sheet.getRange(promoteRow, columns.name).getValue() : '';
            const waitlistedUserEmail = columns.email ? sheet.getRange(promoteRow, columns.email).getValue() : '';
            const waitlistedUserId = columns.id ? sheet.getRange(promoteRow, columns.id).getValue() : '';
            const waitlistedUserUuid = columns.uuid ? sheet.getRange(promoteRow, columns.uuid).getValue() : '';

            const qrUrl = `https://quickchart.io/qr?text=${config.checkin_endpoint}?uuid=${waitlistedUserUuid}&size=${config.qr_size}`;
            const qrBlob = UrlFetchApp.fetch(qrUrl).getBlob();
            qrBlob.setName(`${waitlistedUserUuid}.png`);

            const htmlBody = `
              <p>${Library.replaceTokens(config.email_body, { name: waitlistedUserName, id: waitlistedUserId, uuid: waitlistedUserUuid })}</p>
            `;

            GmailApp.sendEmail(
              waitlistedUserEmail,
              config.email_subject || 'Your Event QR Code',
              'Plain text fallback',
              { htmlBody: htmlBody, attachments: [qrBlob] }
            );

            // Mark as confirmation sent
            sheet.getRange(promoteRow, statusCol).setValue('Confirmation Sent');
          }
        }
      }

      return Library.successPage(
        'Registration Cancelled',
        config.cancellation_message
          .replaceAll('{full_name}', name)
          .replaceAll('{email}', email)
      );
    }
  }

  return Library.errorPage(
    'Error',
    `No participant found with UUID ${uuid}.`
  );
}