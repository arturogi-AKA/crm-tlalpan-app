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

// Escribe la fila del Paso 1 en Google Sheets
const escribirFilaPaso1 = async (arg1, arg2, arg3) => {
  try {
    let idCliente, nombre, apellidos;
    if (typeof arg1 === 'object' && arg1 !== null && !Array.isArray(arg1)) {
      idCliente = arg1.ID_Cliente || arg1.id_cliente || arg1.idCliente;
      nombre = arg1.Nombre_Manual || arg1.nombre;
      apellidos = arg1.Apellidos_Manual || arg1.apellidos;
    } else if (Array.isArray(arg1)) {
      return agregarProspectoGoogleSheets(arg1);
    } else {
      idCliente = arg1;
      nombre = arg2;
      apellidos = arg3;
    }

    const etapaActual = 'Registro';
    const fechaInicioEtapa = new Date().toISOString();

    const fila = [
      idCliente || '',    // A: ID_Cliente
      nombre || '',       // B: Nombre_Manual
      apellidos || '',    // C: Apellidos_Manual
      '',           // D: Telefono_Manual
      '',           // E: Presupuesto_Estimado
      '',           // F: Correo_Google
      '',           // G: Fecha_Hora_Cita
      '',           // H: Estatus_Cita
      '',           // I: URL_Frente_INE
      '',           // J: Nombre_INE
      '',           // K: Apellidos_INE
      '',           // L: CURP_INE
      '',           // M: Alerta_Discrepancia
      etapaActual,  // N: Etapa_Actual
      fechaInicioEtapa, // O: Fecha_Inicio_Etapa
      '',           // P: Foto_INE
      ''            // Q: Ubicacion_Predio
    ];

    await agregarProspectoGoogleSheets(fila);
    return { success: true, ID_Cliente: idCliente };
  } catch (error) {
    console.error('Error en escribirFilaPaso1:', error);
    throw error;
  }
};

// Prueba la conexión básica obteniendo el título del documento
const probarConexionBasica = async () => {
  try {
    const spreadsheetId = process.env.SPREADSHEET_ID;
    if (!spreadsheetId) throw new Error('SPREADSHEET_ID no está definido en .env');

    const sheets = await getSheetClient();
    const res = await sheets.spreadsheets.get({
      spreadsheetId
    });
    const title = res.data.properties ? res.data.properties.title : 'Desconocido';
    return { success: true, title };
  } catch (error) {
    console.error('Error en probarConexionBasica:', error);
    throw error;
  }
};

// Intenta hacer un append de una fila estática de prueba
const probarEscrituraBasica = async () => {
  try {
    const spreadsheetId = process.env.SPREADSHEET_ID;
    if (!spreadsheetId) throw new Error('SPREADSHEET_ID no está definido en .env');

    const sheets = await getSheetClient();
    const timestamp = new Date().toISOString();
    const fila = ["TEST-WRITE", "Prueba", "Aislada", "", "", "", `Test Timestamp: ${timestamp}`];

    const res = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Prospectos!A:Q',
      valueInputOption: 'USER_ENTERED',
      resource: { values: [fila] }
    });
    return { success: true, message: 'Fila insertada correctamente.', updates: res.data.updates };
  } catch (error) {
    console.error('Error en probarEscrituraBasica:', error);
    throw error;
  }
};

module.exports = {
  agregarProspectoGoogleSheets,
  actualizarProspectoGoogleSheets,
  escribirFilaPaso1,
  probarConexionBasica,
  probarEscrituraBasica
};
