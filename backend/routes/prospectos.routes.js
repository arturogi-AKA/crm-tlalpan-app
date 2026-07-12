const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
  step1,
  iniciarRegistro,
  testSheets,
  testWrite,
  actualizarCorreo,
  step3,
  completarRegistro,
  registrarProspecto
} = require('../controllers/prospectosController');

// Configuración de multer (se mantiene para la ruta legado)
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// ─── Diagnóstico Google Sheets ───────────────────────────────────────────────
router.get('/test-sheets', testSheets);
router.get('/test-write', testWrite);

// ─── Rutas incrementales (flujo por pasos) ───────────────────────────────────
// POST /api/prospectos/step1 y /iniciar → Paso 1: nombre + apellidos
router.post('/step1', step1);
router.post('/iniciar', iniciarRegistro);

// POST /api/prospectos/actualizar-correo → Paso 2: correo Google
router.post('/actualizar-correo', actualizarCorreo);

// POST /api/prospectos/completar y /step3 → Paso 3: teléfono + presupuesto + whatsapp
router.post('/step3', step3);
router.post('/completar', completarRegistro);

// ─── Ruta legado (registro completo en un solo paso) ─────────────────────────
// POST /api/prospectos/registro
router.post('/registro', upload.single('foto_ine'), registrarProspecto);

module.exports = router;
