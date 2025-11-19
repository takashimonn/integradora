const express = require('express');
const path = require('path');
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
require('./models/associations');
const app = express();
const PORT = process.env.PORT || 4000;
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
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
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/sales-integration', salesIntegrationRoutes);
const whatsappRoutes = require('./modules/whatsapp-ai/routes/whatsappRoutes');
app.use('/api/whatsapp/webhook', (req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
});
app.use('/api/whatsapp', whatsappRoutes);
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
    try {
      await sequelize.authenticate();
      diagnostico.conexion = true;
      diagnostico.database = sequelize.config.database;
      diagnostico.host = sequelize.config.host;
      diagnostico.port = sequelize.config.port;
      diagnostico.username = sequelize.config.username;
      const [dbInfo] = await sequelize.query(`SELECT DATABASE() as current_db`);
      diagnostico.currentDatabase = dbInfo[0]?.current_db || null;
      const [databases] = await sequelize.query(`SHOW DATABASES`);
      diagnostico.availableDatabases = databases.map(db => Object.values(db)[0]);
    } catch (error) {
      diagnostico.errores.push(`Error de conexión: ${error.message}`);
      return res.status(500).json({ success: false, diagnostico });
    }
    try {
      const [tablas] = await sequelize.query(`
        SELECT TABLE_NAME, TABLE_SCHEMA
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = DATABASE()
        ORDER BY TABLE_NAME
      `);
      diagnostico.tablas = tablas.map(t => t.TABLE_NAME);
      diagnostico.tablasConSchema = tablas;
      const [tablasDirectas] = await sequelize.query(`SHOW TABLES`);
      diagnostico.tablasDirectas = tablasDirectas.map(t => Object.values(t)[0]);
      if (diagnostico.tablas.length !== diagnostico.tablasDirectas.length) {
        diagnostico.advertencias.push(
          `Diferencia entre tablas: INFORMATION_SCHEMA muestra ${diagnostico.tablas.length}, SHOW TABLES muestra ${diagnostico.tablasDirectas.length}`
        );
      }
    } catch (error) {
      diagnostico.errores.push(`Error al listar tablas: ${error.message}`);
    }
    const tablasPrincipales = ['usuarios', 'clientes', 'productos', 'pedidos', 'sucursales'];
    const currentDb = diagnostico.currentDatabase || diagnostico.database;
    for (const tabla of tablasPrincipales) {
      try {
        const [resultadoSQL] = await sequelize.query(
          `SELECT COUNT(*) as total FROM \`${currentDb}\`.\`${tabla}\``
        );
        const totalSQL = resultadoSQL[0]?.total || 0;
        const [registros] = await sequelize.query(
          `SELECT * FROM \`${currentDb}\`.\`${tabla}\` LIMIT 5`
        );
        const tieneRegistros = registros.length > 0;
        const [resultadoDetallado] = await sequelize.query(`
          SELECT COUNT(*) as total 
          FROM \`${tabla}\`
        `);
        const [infoSchema] = await sequelize.query(`
          SELECT TABLE_ROWS 
          FROM INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_SCHEMA = '${currentDb}' 
          AND TABLE_NAME = '${tabla}'
        `);
        diagnostico.datos[tabla] = {
          existe: diagnostico.tablas.includes(tabla) || diagnostico.tablasDirectas?.includes(tabla),
          total: Number(totalSQL), 
          totalDetallado: Number(resultadoDetallado[0]?.total || 0),
          totalInfoSchema: infoSchema[0] ? Number(infoSchema[0].TABLE_ROWS) : null,
          tieneRegistros: tieneRegistros,
          muestraRegistro: registros[0] || null, 
          totalRegistrosEncontrados: registros.length,
          rawCount: resultadoSQL[0], 
          database: currentDb
        };
      } catch (error) {
        diagnostico.datos[tabla] = {
          existe: diagnostico.tablas.includes(tabla) || diagnostico.tablasDirectas?.includes(tabla),
          error: error.message,
          database: currentDb,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        };
        diagnostico.advertencias.push(`Tabla ${tabla}: ${error.message}`);
      }
    }
    const tablasDetalladas = ['usuarios', 'productos', 'clientes', 'sucursales'];
    for (const tabla of tablasDetalladas) {
      if (diagnostico.tablas.includes(tabla) || diagnostico.tablasDirectas?.includes(tabla)) {
        try {
          const [columnas] = await sequelize.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = '${currentDb}' AND TABLE_NAME = '${tabla}'
            ORDER BY ORDINAL_POSITION
          `);
          const [ejemplos] = await sequelize.query(
            `SELECT * FROM \`${currentDb}\`.\`${tabla}\` LIMIT 5`
          );
          if (!diagnostico.datos[tabla]) {
            diagnostico.datos[tabla] = {};
          }
          diagnostico.datos[tabla].columnas = columnas;
          diagnostico.datos[tabla].ejemplos = ejemplos;
          diagnostico.datos[tabla].totalEjemplos = ejemplos.length;
          diagnostico.datos[tabla].database = currentDb;
        } catch (error) {
          if (!diagnostico.datos[tabla]) {
            diagnostico.datos[tabla] = {};
          }
          diagnostico.datos[tabla].errorEstructura = error.message;
          diagnostico.datos[tabla].database = currentDb;
          diagnostico.advertencias.push(`Error al verificar estructura de ${tabla}: ${error.message}`);
        }
      }
    }
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
app.use((err, req, res, next) => {
  console.error('❌ Error en:', req.method, req.url);
  console.error('Error completo:', err);
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
if (!process.env.VERCEL) {
  app.listen(PORT, async () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}\n`);
    const connected = await testConnection();
    if (connected) {
      await syncDatabase(false);
    }
  });
}
module.exports = app;
