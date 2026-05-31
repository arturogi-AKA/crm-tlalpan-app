const { google } = require('googleapis');
const path = require('path');

const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '../credentials.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const agregarProspectoGoogleSheets = async (datosProspecto) => {
  try {
    const spreadsheetId = process.env.SPREADSHEET_ID;
    
    if (!spreadsheetId) {
      throw new Error('SPREADSHEET_ID no está definido en el archivo .env');
    }

    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // Se asume que la pestaña se llama 'Prospectos' y se agregarán las filas consecutivamente
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Prospectos!A:Q', // Abarca desde ID_Cliente (A) hasta Ubicacion_Predio (Q)
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [datosProspecto]
      }
    });

  } catch (error) {
    console.error('Error en agregarProspectoGoogleSheets:', error);
    throw error;
  }
};

module.exports = {
  agregarProspectoGoogleSheets
};
