const express = require('express');
const path = require('path');
require('dotenv').config();
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
