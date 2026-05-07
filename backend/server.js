const express    = require('express');   // Framework web para Node.js
const mongoose   = require('mongoose');  // ODM para MongoDB
const cors       = require('cors');      // Permite peticiones desde el frontend
const dotenv     = require('dotenv');    // Lee el archivo .env

// Importamos las rutas (cada archivo maneja un recurso)
const authRoutes    = require('./routes/auth');
const usuarioRoutes = require('./routes/usuarios');
const armaRoutes    = require('./routes/armas');

// ---- Configuración inicial ----
dotenv.config(); // Carga las variables del archivo .env al proceso

const app  = express();           // Crea la aplicación Express
const PORT = process.env.PORT || 3000;

// =============================================
// MIDDLEWARES GLOBALES
// ¿Qué es un middleware? Es una función que se
// ejecuta ENTRE que llega la petición y antes
// de que llegue a la ruta final.
// =============================================

// 1. CORS: permite que el frontend (otro origen/puerto) se comunique con esta API.
//    ¿Se puede quitar? No si el frontend está en otro puerto o dominio.
//    ¿Se puede cambiar? Sí, se puede restringir a un origen específico:
//    cors({ origin: 'http://localhost:5500' })
app.use(cors());

// 2. express.json(): parsea el body de las peticiones con formato JSON.
//    ¿Se puede quitar? NO. Sin esto, req.body siempre llegará undefined.
//    ¿Se puede cambiar? No hay alternativa práctica para APIs REST.
app.use(express.json());

// 3. express.urlencoded: parsea formularios HTML tradicionales (no usados aquí,
//    pero útil si el frontend enviara datos con Content-Type form-urlencoded)
app.use(express.urlencoded({ extended: true }));

// =============================================
// CONEXIÓN A MONGODB
// ¿Por qué mongoose y no el driver nativo?
// Mongoose agrega esquemas, validaciones y
// métodos útiles que el driver nativo no tiene.
// =============================================
mongoose.connect(process.env.MONGO_CONNECTION)
  .then(() => {
    console.log('Conectado a MongoDB exitosamente');
  })
  .catch((error) => {
    console.error('Error al conectar a MongoDB:', error.message);
    process.exit(1); // Si no hay BD, el servidor no tiene sentido correr
  });

app.use('/api/auth',     authRoutes);      // POST /api/auth/login, POST /api/auth/register
app.use('/api/usuarios', usuarioRoutes);   // CRUD completo de usuarios
app.use('/api/armas',    armaRoutes);      // CRUD completo de armas/productos

app.get('/', (req, res) => {
  res.json({
    mensaje: 'GunsfierroCund API funcionando',
    version: '1.0.0',
    endpoints: {
      auth:     '/api/auth',
      usuarios: '/api/usuarios',
      armas:    '/api/armas'
    }
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});