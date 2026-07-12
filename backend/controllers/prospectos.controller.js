const { v4: uuidv4 } = require('uuid');
const {
  agregarProspectoGoogleSheets,
  actualizarProspectoGoogleSheets,
  probarConexionBasica,
  probarEscrituraBasica,
  escribirFilaPaso1
} = require('../services/sheetsService');

// ─────────────────────────────────────────────────────────────────────────────
// DIAGNÓSTICO: Prueba de conexión básica con Google Sheets
// GET /api/prospectos/test-sheets
// ─────────────────────────────────────────────────────────────────────────────
const testSheets = async (req, res) => {
  try {
    const resultado = await probarConexionBasica();
    return res.status(200).json({
      success: true,
      title: resultado.title,
      message: `Conexión básica exitosa. Título del documento: ${resultado.title}`
    });
  } catch (error) {
    console.error('Error en testSheets:', error);
    return res.status(500).json({
      success: false,
      message: 'Error en la prueba de conexión básica con Google Sheets.',
      error: error.message || error
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DIAGNÓSTICO: Prueba de escritura básica con Google Sheets
// GET /api/prospectos/test-write
// ─────────────────────────────────────────────────────────────────────────────
const testWrite = async (req, res) => {
  try {
    const resultado = await probarEscrituraBasica();
    return res.status(200).json({
      success: true,
      message: 'Fila de prueba insertada correctamente.',
      details: resultado.updates || resultado
    });
  } catch (error) {
    console.error('Error en testWrite:', error);
    return res.status(500).json({
      success: false,
      message: 'Error en la prueba de escritura básica con Google Sheets.',
      error: error.message || error
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PASO 1: Registrar nombre y apellidos → genera ID_Cliente y crea la fila
// POST /api/prospectos/step1 y POST /api/prospectos/iniciar
// ─────────────────────────────────────────────────────────────────────────────
const step1 = async (req, res) => {
  try {
    const Nombre_Manual = req.body.Nombre_Manual || req.body.nombre;
    const Apellidos_Manual = req.body.Apellidos_Manual || req.body.apellidos;

    if (!Nombre_Manual || !Apellidos_Manual) {
      return res.status(400).json({ success: false, message: 'Nombre_Manual y Apellidos_Manual son obligatorios.' });
    }

    // Generar ID_Cliente único (ej. TLP-XXXX-Time)
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const timestampCode = Date.now();
    const ID_Cliente = `TLP-${randomCode}-${timestampCode}`;

    await escribirFilaPaso1(ID_Cliente, Nombre_Manual, Apellidos_Manual);

    return res.status(201).json({
      success: true,
      message: 'Registro iniciado exitosamente.',
      ID_Cliente: ID_Cliente,
      id_cliente: ID_Cliente // Por compatibilidad
    });

  } catch (error) {
    console.error('Error en step1/iniciarRegistro:', error);
    return res.status(500).json({ success: false, message: 'Error al iniciar el registro en el Paso 1.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PASO 2: Actualizar correo validado con Google
// POST /api/prospectos/actualizar-correo
// ─────────────────────────────────────────────────────────────────────────────
const actualizarCorreo = async (req, res) => {
  try {
    const idCliente = req.body.ID_Cliente || req.body.id_cliente;
    const { correo } = req.body;

    if (!idCliente || !correo) {
      return res.status(400).json({ success: false, message: 'id_cliente y correo son obligatorios.' });
    }

    await actualizarProspectoGoogleSheets(idCliente, [
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
    const idCliente = req.body.ID_Cliente || req.body.id_cliente;
    const { telefono, presupuesto } = req.body;

    if (!idCliente || !telefono || !presupuesto) {
      return res.status(400).json({ success: false, message: 'id_cliente, telefono y presupuesto son obligatorios.' });
    }

    await actualizarProspectoGoogleSheets(idCliente, [
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
  step1,
  iniciarRegistro: step1,
  testSheets,
  testWrite,
  actualizarCorreo,
  completarRegistro,
  registrarProspecto
};
