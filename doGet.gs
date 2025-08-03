function doGet(e) {
  const config = getConfig();

  const page = (title, icon, subtitle, color) => {
    let template = HtmlService.createTemplateFromFile('index');
    template.data = {
      title: title,
      icon: icon,
      subtitle: subtitle,
      color: color
    };
    return template
      .evaluate()
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
      .setTitle(title);
  };

  const errorPage = (title, message) => page(title, '❌', message, '#dc3545');

  const successPage = (title, message) => page(title, '✅', message, '#28a745');

  // Check if authorized_users is configured and not empty
  if (config.authorized_users && config.authorized_users.trim()) {
    const userEmail = Session.getActiveUser().getEmail();
    const authorizedEmails = config.authorized_users.split(',').map(email => email.trim().toLowerCase());

    if (!userEmail || !authorizedEmails.includes(userEmail.toLowerCase())) {
      return errorPage(
        'Access Denied',
        `Your email (${userEmail}) is not authorized to access this resource.`
      );
    }
  } else {
    // If no authorized users configured, no access
    return errorPage(
      'Error',
      `No authorized users configured.`
    );
  }

  const uuid = e.parameter.uuid;

  if (!uuid) {
    return errorPage(
      'Invalid Request',
      'UUID is missing.'
    );
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const columns = getColumnMappings(sheet);

  // Skip header row
  for (let i = 1; i < data.length; i++) {
    if (columns.uuid && data[i][columns.uuid - 1] === uuid) {
      const name = data[i][columns.name - 1];
      const email = data[i][columns.email - 1];

      // Check if already checked in
      if (columns.isCheckedIn && data[i][columns.isCheckedIn - 1].trim().length > 0) {
        return errorPage(
          'Already Checked In',
          `${name} (${email}) has already checked in.`
        );
      }

      // Mark as checked in
      if (columns.isCheckedIn) {
        sheet.getRange(i + 1, columns.isCheckedIn).setValue('Yes');
      }

      if (columns.checkinTime) {
        sheet.getRange(i + 1, columns.checkinTime).setValue((new Date()).toISOString());
      }

      return successPage(
        'Checked In',
        `${name} (${email}) is checked in!`
      );
    }
  }

  return errorPage(
    'Unknown Participant',
    `No participant found with UUID ${uuid}.`
  );
}