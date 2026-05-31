const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { google } = require('googleapis');

async function testConnection() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, 'credentials.json'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const spreadsheetId = process.env.SPREADSHEET_ID;
    console.log('Testing connection to Google Sheets...');
    console.log('Spreadsheet ID:', spreadsheetId);
    
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const response = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
    });

    console.log('Successfully connected to Google Sheet!');
    console.log('Sheet Title:', response.data.properties.title);
  } catch (error) {
    console.error('Error connecting to Google Sheet:', error.message);
  }
}

testConnection();
