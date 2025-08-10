function replaceTokens(s, { name, id, uuid }) {
  return s
    .replace(/\n/g, '<br>')
    .replaceAll('{full_name}', name)
    .replaceAll('{id}', id)
    .replaceAll('{uuid}', uuid);
}

function getConfig() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let configSheet;

  try {
    configSheet = ss.getSheetByName('config');
  } catch (e) {
    // Create config sheet if it doesn't exist
    configSheet = createConfigSheet(ss);
  }

  if (!configSheet) {
    configSheet = createConfigSheet(ss);
  }

  const configData = configSheet.getDataRange().getValues();
  const config = {};

  for (let i = 1; i < configData.length; i++) { // Skip header
    const [key, value] = configData[i];
    if (key && value) {
      config[key] = value;
    }
  }

  return config;
}

function createConfigSheet(spreadsheet) {
  const configSheet = spreadsheet.insertSheet('config');

  // Set up default configuration
  const defaultConfig = [
    ['key', 'value'],
    ['checkin_endpoint', ''],
    ['email_subject', 'Your Event QR Code'],
    ['email_body', 'Thanks for signing up! Please bring this QR code with you to the event for check-in:'],
    ['qr_size', '200'],
    ['authorized_users', ''],
  ];

  configSheet.getRange(1, 1, defaultConfig.length, 2).setValues(defaultConfig);

  configSheet.autoResizeColumns(1, 2);

  return configSheet;
}

function getColumnMappings(sheet) {
  const data = sheet.getDataRange().getValues();
  const header = data[0];

  // Helper function to find column with flexible matching
  const findCol = (patterns) => {
    for (const pattern of patterns) {
      const index = header.findIndex(h =>
        h.toString().toLowerCase().includes(pattern.toLowerCase())
      );
      if (index >= 0) return index + 1; // Convert to 1-based indexing
    }
    return null;
  };

  return {
    id: findCol(['ID Number']),
    name: findCol(['Full Name', 'Name']),
    email: findCol(['Email', 'Email Address']),
    uuid: findCol(['UUID']),
    isEmailSent: findCol(['Confirmation Sent', 'Sent', 'Email Sent']),
    isCheckedIn: findCol(['Checked In', 'Check']),
    checkinTime: findCol(['Check-in Time', 'Arrival Time', 'Time']),
    rejectionCriteria: findCol(['Medical Condition']),
  };
}

function uuid() {
  return Utilities.getUuid();
}