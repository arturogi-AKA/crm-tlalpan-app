const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno desde la raíz del proyecto
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
// Configuración de orígenes permitidos en CORS (locales, túneles y producción)
const allowedOrigins = [
  'https://crm-tlalpan-app.loca.lt',
  'https://crm-predios-tlalpan.loca.lt',
  'https://espacio-compra-tlalpan.loca.lt',
  'http://localhost:5173'
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(...process.env.FRONTEND_URL.split(',').map(url => url.trim()));
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Origin not allowed by CORS: ' + origin));
    }
  },
  credentials: true
}));
app.use(express.json());

// Importar Rutas
const prospectosRoutes = require('./routes/prospectos.routes');

// Rutas API
app.use('/api/prospectos', prospectosRoutes);

// Endpoint de prueba
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Backend CRM funcionando correctamente.' });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Ocurrió un error en el servidor.' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
