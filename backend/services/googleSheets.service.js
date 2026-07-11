const { google } = require('googleapis');
const path = require('path');

const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '../credentials.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const getSheetClient = async () => {
  const client = await auth.getClient();
  return google.sheets({ version: 'v4', auth: client });
};

// Inserta una fila nueva con todos los datos del prospecto
const agregarProspectoGoogleSheets = async (datosProspecto) => {
  try {
    const spreadsheetId = process.env.SPREADSHEET_ID;
    if (!spreadsheetId) throw new Error('SPREADSHEET_ID no está definido en .env');

    const sheets = await getSheetClient();

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Prospectos!A:Q',
      valueInputOption: 'USER_ENTERED',
      resource: { values: [datosProspecto] }
    });
  } catch (error) {
    console.error('Error en agregarProspectoGoogleSheets:', error);
    throw error;
  }
};

// Busca la fila del prospecto por ID_Cliente (col A) y actualiza columnas específicas.
// updates: array de { col: 'B', value: 'dato' }  (letras de columna A-Q)
const actualizarProspectoGoogleSheets = async (idCliente, updates) => {
  try {
    const spreadsheetId = process.env.SPREADSHEET_ID;
    if (!spreadsheetId) throw new Error('SPREADSHEET_ID no está definido en .env');

    const sheets = await getSheetClient();

    // Leer columna A completa para encontrar la fila del ID_Cliente
    const readRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Prospectos!A:A'
    });

    const rows = readRes.data.values || [];
    const rowIndex = rows.findIndex(r => r[0] === idCliente);

    if (rowIndex === -1) {
      throw new Error(`ID_Cliente '${idCliente}' no encontrado en la hoja.`);
    }

    // Las filas en Sheets son 1-indexadas; la fila 0 del array = fila 1 de Sheets
    const sheetRow = rowIndex + 1;

    // Construir los rangos de actualización
    const data = updates.map(({ col, value }) => ({
      range: `Prospectos!${col}${sheetRow}`,
      values: [[value]]
    }));

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      resource: {
        valueInputOption: 'USER_ENTERED',
        data
      }
    });
  } catch (error) {
    console.error('Error en actualizarProspectoGoogleSheets:', error);
    throw error;
  }
};

module.exports = {
  agregarProspectoGoogleSheets,
  actualizarProspectoGoogleSheets
};
