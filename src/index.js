const express = require('express');
require('dotenv').config();
const { testConnection, syncDatabase } = require('./config/sequelize');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware para leer JSON
app.use(express.json());

// CORS (para cuando conectes tu app móvil)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    message: 'Servidor Node.js funcionando',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      registro: 'POST /api/auth/registro',
      login: 'POST /api/auth/login',
      perfil: 'GET /api/auth/perfil (requiere token)'
    }
  });
});

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Ruta de prueba de base de datos
app.get('/test-db', async (req, res) => {
  try {
    const { sequelize } = require('./config/sequelize');
    await sequelize.authenticate();
    res.json({ 
      success: true,
      message: 'Conexión a la base de datos exitosa',
      database: sequelize.config.database
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Error al conectar con la base de datos',
      detalle: error.message 
    });
  }
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Manejo de errores globales
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Error desconocido'
  });
});

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📝 Endpoints disponibles:`);
  console.log(`   POST /api/auth/registro - Registrar nuevo usuario`);
  console.log(`   POST /api/auth/login - Iniciar sesión`);
  console.log(`   GET  /api/auth/perfil - Obtener perfil (requiere token)`);
  console.log(`   PUT  /api/auth/perfil - Actualizar perfil (requiere token)\n`);
  
  // Probar conexión y sincronizar modelos
  const connected = await testConnection();
  if (connected) {
    // Sincronizar modelos (crear tablas si no existen)
    // force: false = no borra tablas existentes
    await syncDatabase(false);
  }
});
