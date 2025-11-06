const express = require('express');
const path = require('path');
require('dotenv').config();
const { testConnection, syncDatabase } = require('./config/sequelize');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./modules/products/routes/productRoutes');
const productionRoutes = require('./modules/production/routes/productionRoutes');
const deliveryRoutes = require('./modules/deliveries/routes/deliveryRoutes');

// Importar modelos para que Sequelize los registre
require('./models/Usuario');
require('./modules/products/models/Producto');
require('./modules/production/models/Produccion');
require('./modules/deliveries/models/Reparto');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware para leer JSON
app.use(express.json());

// Servir archivos estáticos (imágenes subidas)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
      perfil: 'GET /api/auth/perfil (requiere token)',
      products: '/api/products',
      productos: 'GET, POST, PUT, DELETE /api/products',
      production: '/api/production',
      produccion: 'GET, POST, PUT, DELETE /api/production',
      deliveries: '/api/deliveries',
      repartos: 'GET, POST, PUT, DELETE /api/deliveries'
    }
  });
});

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Rutas de productos
app.use('/api/products', productRoutes);

// Rutas de producción
app.use('/api/production', productionRoutes);

// Rutas de repartos
app.use('/api/deliveries', deliveryRoutes);

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
  console.log(`\n🔐 Autenticación:`);
  console.log(`   POST /api/auth/registro - Registrar nuevo usuario`);
  console.log(`   POST /api/auth/login - Iniciar sesión`);
  console.log(`   GET  /api/auth/perfil - Obtener perfil (requiere token)`);
  console.log(`   PUT  /api/auth/perfil - Actualizar perfil (requiere token)`);
  console.log(`\n📦 Productos:`);
  console.log(`   GET    /api/products - Obtener todos los productos`);
  console.log(`   GET    /api/products/:id - Obtener producto por ID`);
  console.log(`   POST   /api/products - Crear producto (con foto opcional)`);
  console.log(`   PUT    /api/products/:id - Actualizar producto (con foto opcional)`);
  console.log(`   DELETE /api/products/:id - Eliminar producto`);
  console.log(`\n🏭 Producción:`);
  console.log(`   GET    /api/production - Obtener todos los registros`);
  console.log(`   GET    /api/production/:id - Obtener registro por ID`);
  console.log(`   GET    /api/production/fecha/:fecha - Obtener registro por fecha`);
  console.log(`   GET    /api/production/estadisticas - Obtener estadísticas`);
  console.log(`   POST   /api/production - Crear registro de producción del día`);
  console.log(`   PUT    /api/production/:id - Actualizar registro`);
  console.log(`   DELETE /api/production/:id - Eliminar registro`);
  console.log(`\n🚚 Repartos:`);
  console.log(`   GET    /api/deliveries - Obtener todos los repartos`);
  console.log(`   GET    /api/deliveries/:id - Obtener reparto por ID`);
  console.log(`   GET    /api/deliveries/destino/:destino - Obtener repartos por destino`);
  console.log(`   GET    /api/deliveries/estadisticas - Obtener estadísticas`);
  console.log(`   POST   /api/deliveries - Crear nuevo reparto`);
  console.log(`   PUT    /api/deliveries/:id - Actualizar reparto`);
  console.log(`   DELETE /api/deliveries/:id - Eliminar reparto\n`);
  
  // Probar conexión y sincronizar modelos
  const connected = await testConnection();
  if (connected) {
    // Sincronizar modelos (crear tablas si no existen)
    // force: false = no borra tablas existentes
    await syncDatabase(false);
  }
});
