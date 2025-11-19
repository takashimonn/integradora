const express = require('express');
const path = require('path');
// Solo cargar dotenv en desarrollo local (no en Vercel)
if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const { testConnection, syncDatabase } = require('./config/sequelize');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./modules/products/routes/productRoutes');
const productionRoutes = require('./modules/production/routes/productionRoutes');
const deliveryRoutes = require('./modules/deliveries/routes/deliveryRoutes');
const orderRoutes = require('./modules/orders/routes/orderRoutes');
const clientRoutes = require('./modules/clients/routes/clientRoutes');
const salesIntegrationRoutes = require('./modules/sales-integration/routes/salesIntegrationRoutes');

// Importar modelos para que Sequelize los registre
require('./models/Cliente');
require('./models/Ubicacion');
require('./models/Sucursal');
require('./models/Usuario');
require('./models/PedidoProducto');
require('./models/Reporte');
require('./modules/products/models/Producto');
require('./modules/production/models/Produccion');
require('./modules/deliveries/models/Reparto');
require('./modules/orders/models/Pedido');
require('./modules/sales-integration/models/Sincronizacion');

// Configurar relaciones entre modelos
require('./models/associations');

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
      repartos: 'GET, POST, PUT, DELETE /api/deliveries',
      orders: '/api/orders',
      pedidos: 'GET, POST, PUT, DELETE /api/orders',
      clients: '/api/clients',
      clientes: 'GET, POST, PUT, DELETE /api/clients',
      salesIntegration: '/api/sales-integration',
      integracionVentas: 'POST /api/sales-integration/upload (subir Excel de eleventa)'
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

// Rutas de pedidos
app.use('/api/orders', orderRoutes);

// Rutas de clientes
app.use('/api/clients', clientRoutes);

// Rutas de integración de ventas (eleventa)
app.use('/api/sales-integration', salesIntegrationRoutes);

// Rutas de WhatsApp/IA
const whatsappRoutes = require('./modules/whatsapp-ai/routes/whatsappRoutes');
// Middleware para ngrok-free: agregar header que evita la página de advertencia
app.use('/api/whatsapp/webhook', (req, res, next) => {
  // Agregar header para que ngrok no muestre la página de advertencia
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
});
app.use('/api/whatsapp', whatsappRoutes);

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

// Endpoint de diagnóstico completo (para debugging después de dump/restore)
app.get('/api/diagnostico', async (req, res) => {
  try {
    const { sequelize } = require('./config/sequelize');
    const diagnostico = {
      conexion: false,
      tablas: [],
      datos: {},
      errores: [],
      advertencias: []
    };

    // 1. Probar conexión
    try {
      await sequelize.authenticate();
      diagnostico.conexion = true;
      diagnostico.database = sequelize.config.database;
      diagnostico.host = sequelize.config.host;
    } catch (error) {
      diagnostico.errores.push(`Error de conexión: ${error.message}`);
      return res.status(500).json({ success: false, diagnostico });
    }

    // 2. Listar todas las tablas
    try {
      const [tablas] = await sequelize.query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = DATABASE()
        ORDER BY TABLE_NAME
      `);
      diagnostico.tablas = tablas.map(t => t.TABLE_NAME);
    } catch (error) {
      diagnostico.errores.push(`Error al listar tablas: ${error.message}`);
    }

    // 3. Verificar tablas principales y contar registros
    const tablasPrincipales = ['usuarios', 'clientes', 'productos', 'pedidos', 'sucursales'];
    
    for (const tabla of tablasPrincipales) {
      try {
        const [resultado] = await sequelize.query(`SELECT COUNT(*) as total FROM \`${tabla}\``);
        diagnostico.datos[tabla] = {
          existe: diagnostico.tablas.includes(tabla),
          total: resultado[0]?.total || 0
        };
      } catch (error) {
        diagnostico.datos[tabla] = {
          existe: diagnostico.tablas.includes(tabla),
          error: error.message
        };
        diagnostico.advertencias.push(`Tabla ${tabla}: ${error.message}`);
      }
    }

    // 4. Verificar estructura de tabla usuarios (la más crítica)
    if (diagnostico.tablas.includes('usuarios')) {
      try {
        const [columnas] = await sequelize.query(`
          SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios'
          ORDER BY ORDINAL_POSITION
        `);
        diagnostico.datos.usuarios.columnas = columnas;
        
        // Verificar si hay usuarios
        const [usuarios] = await sequelize.query(`SELECT id_usuario, nombre, email, activo FROM usuarios LIMIT 5`);
        diagnostico.datos.usuarios.ejemplos = usuarios;
      } catch (error) {
        diagnostico.errores.push(`Error al verificar estructura de usuarios: ${error.message}`);
      }
    }

    // 5. Verificar claves foráneas
    try {
      const [foreignKeys] = await sequelize.query(`
        SELECT 
          TABLE_NAME,
          COLUMN_NAME,
          CONSTRAINT_NAME,
          REFERENCED_TABLE_NAME,
          REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
        AND REFERENCED_TABLE_NAME IS NOT NULL
        ORDER BY TABLE_NAME
      `);
      diagnostico.foreignKeys = foreignKeys;
    } catch (error) {
      diagnostico.advertencias.push(`Error al verificar claves foráneas: ${error.message}`);
    }

    res.json({
      success: true,
      diagnostico,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error en diagnóstico',
      detalle: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Manejo de errores 404 (debe ir ANTES del manejo de errores globales)
app.use((req, res) => {
  console.log(`❌ Ruta no encontrada: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    method: req.method,
    url: req.url,
    availableEndpoints: {
      root: 'GET /',
      testDb: 'GET /test-db',
      diagnostico: 'GET /api/diagnostico',
      auth: {
        registro: 'POST /api/auth/registro',
        login: 'POST /api/auth/login',
        checkUser: 'GET /api/auth/check-user/:email',
        resetPassword: 'POST /api/auth/reset-password'
      },
      products: 'GET, POST, PUT, DELETE /api/products',
      clients: 'GET, POST, PUT, DELETE /api/clients',
      orders: 'GET, POST, PUT, DELETE /api/orders'
    }
  });
});

// Manejo de errores globales
app.use((err, req, res, next) => {
  console.error('❌ Error en:', req.method, req.url);
  console.error('Error completo:', err);
  
  // Si el error tiene un status code, usarlo
  const statusCode = err.statusCode || err.status || 500;
  
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' || process.env.VERCEL ? {
      message: err.message,
      stack: err.stack,
      name: err.name
    } : 'Error desconocido',
    path: req.url,
    method: req.method
  });
});

// Iniciar servidor solo si no está en Vercel
if (!process.env.VERCEL) {
  app.listen(PORT, async () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}\n`);
    
    // Probar conexión y sincronizar modelos
    const connected = await testConnection();
    if (connected) {
      // Sincronizar modelos (crear tablas si no existen)
      // force: false = no borra tablas existentes
      await syncDatabase(false);
    }
  });
}

// Exportar app para Vercel
module.exports = app;
