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
    const targetId = String(idCliente).trim().toLowerCase();
    
    let rowIndex = rows.findIndex(r => r && r[0] && String(r[0]).trim().toLowerCase() === targetId);

    // Fallback: Si por alguna razón no coincide el ID exacto, usar la última fila registrada
    if (rowIndex === -1 && rows.length > 1) {
      console.warn(`[GoogleSheets] ID_Cliente '${idCliente}' no encontrado por coincidencia exacta en Columna A. Actualizando última fila (${rows.length}).`);
      rowIndex = rows.length - 1;
    } else if (rowIndex === -1) {
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

    console.log(`[GoogleSheets] Fila ${sheetRow} actualizada OK para ID '${idCliente}'. Columnas:`, updates.map(u => u.col).join(', '));
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

// Actualización del Paso 3 en rango continuo A:F (6 columnas explícitas: ID_Cliente, Nombre_Manual, Apellidos_Manual, Telefono_Manual, Presupuesto_Estimado, Correo_Google)
const actualizarFilaProspectoPaso3 = async (idCliente, { nombre, apellidos, telefono, presupuesto, correoGoogle }) => {
  try {
    const spreadsheetId = process.env.SPREADSHEET_ID;
    if (!spreadsheetId) throw new Error('SPREADSHEET_ID no está definido en .env');

    const sheets = await getSheetClient();

    // Buscar fila por ID_Cliente en Columna A
    const readRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Prospectos!A:A'
    });

    const rows = readRes.data.values || [];
    const targetId = String(idCliente).trim().toLowerCase();
    
    let rowIndex = rows.findIndex(r => r && r[0] && String(r[0]).trim().toLowerCase() === targetId);

    if (rowIndex === -1 && rows.length > 1) {
      console.warn(`[GoogleSheets] ID_Cliente '${idCliente}' no encontrado por coincidencia exacta en Columna A. Usando última fila (${rows.length}).`);
      rowIndex = rows.length - 1;
    } else if (rowIndex === -1) {
      throw new Error(`ID_Cliente '${idCliente}' no encontrado en la hoja.`);
    }

    const sheetRow = rowIndex + 1;

    // Obtener valores existentes de Nombre y Apellidos si no vienen en la petición
    let finalNombre = nombre;
    let finalApellidos = apellidos;

    if (!finalNombre || !finalApellidos) {
      try {
        const rowRes = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `Prospectos!A${sheetRow}:C${sheetRow}`
        });
        const existingRow = rowRes.data.values ? rowRes.data.values[0] : [];
        if (!finalNombre) finalNombre = existingRow[1] || '';
        if (!finalApellidos) finalApellidos = existingRow[2] || '';
      } catch (readErr) {
        console.warn('[GoogleSheets] No se pudo leer Nombre/Apellidos existentes:', readErr.message);
      }
    }

    // Arreglo explícito de 6 elementos para el rango continuo Prospectos!A{fila}:F{fila}
    const fila6Col = [
      String(idCliente || ''),
      String(finalNombre || ''),
      String(finalApellidos || ''),
      String(telefono || ''),
      String(presupuesto || ''),
      String(correoGoogle || '')
    ];

    console.log(`[GoogleSheets] Escribiendo 6 elementos en Prospectos!A${sheetRow}:F${sheetRow}:`, fila6Col);

    // 1. Actualizar rango continuo A:F
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Prospectos!A${sheetRow}:F${sheetRow}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [fila6Col] }
    });

    // 2. Actualizar Etapa_Actual en Columna N
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Prospectos!N${sheetRow}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [['Completo']] }
    });

    console.log(`[GoogleSheets] Fila ${sheetRow} actualizada OK en A:F + N.`);
    return { success: true, sheetRow };
  } catch (error) {
    console.error('Error en actualizarFilaProspectoPaso3:', error);
    throw error;
  }
};

module.exports = {
  agregarProspectoGoogleSheets,
  actualizarProspectoGoogleSheets,
  actualizarFilaProspectoPaso3,
  escribirFilaPaso1,
  probarConexionBasica,
  probarEscrituraBasica
};
