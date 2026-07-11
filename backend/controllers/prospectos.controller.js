const { v4: uuidv4 } = require('uuid');
const {
  agregarProspectoGoogleSheets,
  actualizarProspectoGoogleSheets
} = require('../services/googleSheets.service');

// ─────────────────────────────────────────────────────────────────────────────
// PASO 1: Registrar nombre y apellidos → genera ID_Cliente y crea la fila
// POST /api/prospectos/iniciar
// ─────────────────────────────────────────────────────────────────────────────
const iniciarRegistro = async (req, res) => {
  try {
    const { nombre, apellidos } = req.body;

    if (!nombre || !apellidos) {
      return res.status(400).json({ success: false, message: 'Nombre y Apellidos son obligatorios.' });
    }

    const idCliente = uuidv4();
    const etapaActual = 'Registro';
    const fechaInicioEtapa = new Date().toISOString();

    // Columnas:  A            B        C           D    E    F    G    H    I    J    K    L    M    N             O                  P    Q
    const fila = [
      idCliente,    // A: ID_Cliente
      nombre,       // B: Nombre_Manual
      apellidos,    // C: Apellidos_Manual
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

    return res.status(201).json({
      success: true,
      message: 'Registro iniciado.',
      id_cliente: idCliente
    });

  } catch (error) {
    console.error('Error en iniciarRegistro:', error);
    return res.status(500).json({ success: false, message: 'Error al iniciar el registro.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PASO 2: Actualizar correo validado con Google
// POST /api/prospectos/actualizar-correo
// ─────────────────────────────────────────────────────────────────────────────
const actualizarCorreo = async (req, res) => {
  try {
    const { id_cliente, correo } = req.body;

    if (!id_cliente || !correo) {
      return res.status(400).json({ success: false, message: 'id_cliente y correo son obligatorios.' });
    }

    await actualizarProspectoGoogleSheets(id_cliente, [
      { col: 'F', value: correo }  // F: Correo_Google
    ]);

    return res.status(200).json({ success: true, message: 'Correo actualizado.' });

  } catch (error) {
    console.error('Error en actualizarCorreo:', error);
    return res.status(500).json({ success: false, message: 'Error al actualizar el correo.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PASO 3: Completar registro con teléfono y presupuesto
// POST /api/prospectos/completar
// ─────────────────────────────────────────────────────────────────────────────
const completarRegistro = async (req, res) => {
  try {
    const { id_cliente, telefono, presupuesto } = req.body;

    if (!id_cliente || !telefono || !presupuesto) {
      return res.status(400).json({ success: false, message: 'id_cliente, telefono y presupuesto son obligatorios.' });
    }

    await actualizarProspectoGoogleSheets(id_cliente, [
      { col: 'D', value: telefono },    // D: Telefono_Manual
      { col: 'E', value: presupuesto }, // E: Presupuesto_Estimado
      { col: 'N', value: 'Completo' }   // N: Etapa_Actual
    ]);

    return res.status(200).json({ success: true, message: 'Registro completado.' });

  } catch (error) {
    console.error('Error en completarRegistro:', error);
    return res.status(500).json({ success: false, message: 'Error al completar el registro.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// LEGADO: Ruta original de registro completo (se mantiene para compatibilidad)
// ─────────────────────────────────────────────────────────────────────────────
const registrarProspecto = async (req, res) => {
  try {
    const { nombre, apellidos, correo, telefono, presupuesto, ubicacion } = req.body;
    const foto_ine = req.file ? `/uploads/${req.file.filename}` : '';

    if (!nombre || !apellidos || !correo || !telefono || !presupuesto) {
      return res.status(400).json({ success: false, message: 'Faltan campos obligatorios.' });
    }

    const idCliente = uuidv4();
    const etapaActual = 'Registro';
    const fechaInicioEtapa = new Date().toISOString();

    const nuevoProspecto = [
      idCliente, nombre, apellidos, telefono, presupuesto, correo,
      '', '', foto_ine, '', '', '', '', etapaActual, fechaInicioEtapa, '', ubicacion || ''
    ];

    await agregarProspectoGoogleSheets(nuevoProspecto);

    return res.status(201).json({
      success: true,
      message: 'Prospecto registrado exitosamente.',
      data: { id_cliente: idCliente }
    });

  } catch (error) {
    console.error('Error en registrarProspecto:', error);
    return res.status(500).json({ success: false, message: 'Error interno al registrar el prospecto.' });
  }
};

module.exports = {
  iniciarRegistro,
  actualizarCorreo,
  completarRegistro,
  registrarProspecto
};
