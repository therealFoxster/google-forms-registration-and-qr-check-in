# Google Forms Registration and QR Check-In

This project provides a complete solution for event registration and check-in using Google Forms and QR codes. It is organized into three main modules:

## Project structure

- `EventRegistrator/`
  - `doGet.js`: Handles HTTP GET requests for registration.
  - `onFormSubmit.js`: Processes form submissions and generates QR codes for eligible registrants.
- `Library/`
  - `status.html`: Status page for registration/check-in.
  - `statusPages.js`: Logic for displaying status pages.
  - `utils.js`: Utility functions shared across modules.
- `QRCodeScanner/`
  - `doGet.js`: Handles QR code scanning and check-in logic.

## Features

- **Registration via Google Forms**: Users register for events using a Google Form. Upon submission, a QR code is generated and sent to the registrant.
- **Check-In**: Event staff can scan QR codes at the venue to check in attendees quickly and securely.

## How it works

- **Registration**: Attendees fill out a Google Form. The form submission triggers the script, which generates a QR code and sends it to the attendee.
- **Check-In**: At the event, staff scans the QR code which contains the attendee's UUID and redirects them to the QR code check-in endpoint for validation. The check-in status is displayed on the staff's screen.

## Setup

### Library
1. Create a new Google Apps Script project.
2. Copy the code from the `status.html`, `statusPages.js`, and `utils.js` files into the App Script project.
3. Deploy the Library module as a library and note the Script ID.

### EventRegistrator
1. Set up a Google Form and link the responses to a Google Sheet.
2. In the responses main sheet, ensure that the following columns are present:
   - `Status`
   - `Check-in Time`
   - `Full name`
   - `Email`
   - `UUID`
3. Create another sheet named `config`. Title the first column `key` and the second column `value`. Add the following keys with appropriate values:
   - `event_name`
   - `event_code`
   - `registration_limit`
   - `email_subject`
   - `email_body`
   - `rejection_email_subject`
   - `rejection_email_body`
   - `cancellation_email_subject`
   - `cancellation_email_body`
   - `waitlisted_email_subject`
   - `waitlisted_email_body`
   - `qr_size`
   - `cancellation_endpoint`
   - `checkin_endpoint`
4. Create a new App Script project by going to Extensions > Apps Script in your Google Sheet.
5. Import the Library module into your App Script project using the Script ID noted earlier. Make sure it's called `Library`.
6. Copy the code from the `doGet.js` and `onFormSubmit.js` files into the App Script project. You can either put them both in the default `Code.gs` file or create separate files for each (i.e., `doGet.gs`, `onFormSubmit.gs`).
7. Create a trigger for the `onFormSubmit` function to run on form submissions.
8. Save and deploy the App Script project as a web app. Set the access level to "Anyone" and "Execute as me".
9. Copy the web app URL and set it as the `cancellation_endpoint` in the `config` sheet.
    - Note: Change the URL to start with `https://script.google.com/a/*/macros/s/` instead of `https://script.google.com/a/macros/s/` as the latter might not open on devices with mutiple Google accounts signed in (https://stackoverflow.com/a/75926303/31258176)

### QRCodeScanner
1. Create a blank Google Sheet.
2. Name the sheet `config`. Name the first column `key` and the second column `value`. Add the following keys with appropriate values:
   - `spreadsheet_id`: The ID of the sheet used for the EventRegistrator.
   - `sheet_name`: The name of the main sheet used for the EventRegistrator (e.g., Form Responses 1)
   - `authorized_users`: A list of email addresses authorized to use the QR code scanner.
3. Create a new App Script project by going to Extensions > Apps Script in your Google Sheet.
4. Import the Library module into your App Script project using the Script ID noted earlier. Make sure it's called `Library`.
5. Copy the code from the `doGet.js` file into the App Script project.
6. Save and deploy the App Script project as a web app. Set the access level to "Anyone with a Google account" and "Execute as user accessing the web app".
7. Copy the web app URL and set it as the `checkin_endpoint` in `EventRegistrator`'s `config` sheet.

## License
[The MIT License](LICENSE)