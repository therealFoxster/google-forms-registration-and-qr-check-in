function doGet(e) {
  const config = Library.getConfig();

  // Check if authorized_users is configured and not empty
  if (config.authorized_users && config.authorized_users.trim()) {
    const userEmail = Session.getActiveUser().getEmail();
    const authorizedEmails = config.authorized_users.split(',').map(email => email.trim().toLowerCase());

    if (!userEmail || !authorizedEmails.includes(userEmail.toLowerCase())) {
      return Library.errorPage(
        'Access Denied',
        `Your email (${userEmail}) is not authorized to access this resource.`
      );
    }
  } else {
    // If no authorized users configured, no access
    return Library.errorPage(
      'Error',
      `No authorized users configured.`
    );
  }

  const uuid = e.parameter.uuid;

  if (!uuid) {
    return Library.errorPage(
      'Invalid Request',
      'UUID is missing.'
    );
  }

  const sheet = SpreadsheetApp.openById(config.spreadsheet_id).getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const columns = Library.getColumnMappings(sheet);

  // Skip header row
  for (let i = 1; i < data.length; i++) {
    if (columns.uuid && data[i][columns.uuid - 1] === uuid) {
      const name = data[i][columns.name - 1];
      const email = data[i][columns.email - 1];

      // Check current status
      const currentStatus = columns.status ? data[i][columns.status - 1] : '';
      
      if (currentStatus && currentStatus.toLowerCase().includes('checked in')) {
        return Library.errorPage(
          'Already Checked In',
          `${name} (${email}) already checked in @ ${data[i][columns.checkinTime - 1]}`
        );
      }

      // Set status to checked in
      if (columns.status) {
        sheet.getRange(i + 1, columns.status).setValue('Checked In');
      }

      if (columns.checkinTime) {
        const now = new Date();
        const formattedTime = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        sheet.getRange(i + 1, columns.checkinTime).setValue(formattedTime);
      }

      return Library.successPage(
        'Checked In',
        `${name} (${email}) is checked in!`
      );
    }
  }

  return Library.errorPage(
    'Unknown Participant',
    `No participant found with UUID ${uuid}.`
  );
}