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

      sheet.deleteRow(i + 1);

      GmailApp.sendEmail(email, config.cancellation_email_subject, "Plain text fallback", {
        htmlBody: `
          <p>${Library.replaceTokens(config.cancellation_email_body, { name, email: email })}</p>
        `
      });

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