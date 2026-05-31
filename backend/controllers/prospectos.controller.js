const { v4: uuidv4 } = require('uuid');
const { agregarProspectoGoogleSheets } = require('../services/googleSheets.service');

const registrarProspecto = async (req, res) => {
  try {
    const { nombre, apellidos, correo, telefono, presupuesto, ubicacion } = req.body;
    const foto_ine = req.file ? `/uploads/${req.file.filename}` : '';

    // Validación básica
    if (!nombre || !apellidos || !correo || !telefono || !presupuesto) {
      return res.status(400).json({ success: false, message: 'Faltan campos obligatorios.' });
    }

    // Generar ID de Cliente y Timestamp
    const idCliente = uuidv4();
    const etapaActual = 'Registro';
    const fechaInicioEtapa = new Date().toISOString();

    // Estructurar los datos exactos que espera Google Sheets alineados con los encabezados reales de la hoja:
    // A: ID_Cliente, B: Nombre_Manual, C: Apellidos_Manual, D: Telefono_Manual, E: Presupuesto_Estimado, 
    // F: Correo_Google, G: Fecha_Hora_Cita, H: Estatus_Cita, I: URL_Frente_INE, J: Nombre_INE, 
    // K: Apellidos_INE, L: CURP_INE, M: Alerta_Discrepancia, N: Etapa_Actual, O: Fecha_Inicio_Etapa, 
    // P: Foto_INE, Q: Ubicacion_Predio
    const nuevoProspecto = [
      idCliente,             // ID_Cliente (Col A, index 0)
      nombre,                // Nombre_Manual (Col B, index 1)
      apellidos,             // Apellidos_Manual (Col C, index 2)
      telefono,              // Telefono_Manual (Col D, index 3)
      presupuesto,           // Presupuesto_Estimado (Col E, index 4)
      correo,                // Correo_Google (Col F, index 5)
      '',                    // Fecha_Hora_Cita (Col G, index 6)
      '',                    // Estatus_Cita (Col H, index 7)
      foto_ine,              // URL_Frente_INE (Col I, index 8)
      '',                    // Nombre_INE (Col J, index 9)
      '',                    // Apellidos_INE (Col K, index 10)
      '',                    // CURP_INE (Col L, index 11)
      '',                    // Alerta_Discrepancia (Col M, index 12)
      etapaActual,           // Etapa_Actual (Col N, index 13)
      fechaInicioEtapa,      // Fecha_Inicio_Etapa (Col O, index 14)
      '',                    // Foto_INE (Col P, index 15)
      ubicacion || ''        // Ubicacion_Predio (Col Q, index 16)
    ];

    // Llamar al servicio de Google Sheets
    await agregarProspectoGoogleSheets(nuevoProspecto);

    return res.status(201).json({
      success: true,
      message: 'Prospecto registrado exitosamente.',
      data: {
        id_cliente: idCliente
      }
    });

  } catch (error) {
    console.error('Error en registrarProspecto:', error);
    return res.status(500).json({ success: false, message: 'Error interno al registrar el prospecto.' });
  }
};

module.exports = {
  registrarProspecto
};
