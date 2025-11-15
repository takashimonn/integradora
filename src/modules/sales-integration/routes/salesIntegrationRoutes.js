const express = require('express');
const router = express.Router();
const salesIntegrationController = require('../controllers/salesIntegrationController');

// POST /api/sales-integration/upload - Subir y procesar archivo Excel de eleventa
router.post(
  '/upload',
  salesIntegrationController.upload.single('file'),
  salesIntegrationController.manejarErrorMulter.bind(salesIntegrationController),
  salesIntegrationController.subirExcel.bind(salesIntegrationController)
);

// GET /api/sales-integration/reporte/:idSucursal/:fecha - Obtener reporte por sucursal y fecha
router.get(
  '/reporte/:idSucursal/:fecha',
  salesIntegrationController.obtenerReporte.bind(salesIntegrationController)
);

// GET /api/sales-integration/reportes/:idSucursal - Obtener todos los reportes de una sucursal
router.get(
  '/reportes/:idSucursal',
  salesIntegrationController.obtenerReportes.bind(salesIntegrationController)
);

// GET /api/sales-integration/should-sync/:idSucursal - Verificar si hay sincronización pendiente (para script local)
router.get(
  '/should-sync/:idSucursal',
  salesIntegrationController.verificarSincronizacion.bind(salesIntegrationController)
);

// POST /api/sales-integration/request-sync/:idSucursal - Solicitar sincronización desde la app
router.post(
  '/request-sync/:idSucursal',
  salesIntegrationController.solicitarSincronizacion.bind(salesIntegrationController)
);

// POST /api/sales-integration/receive-data - Recibir datos de ventas desde el script local
router.post(
  '/receive-data',
  salesIntegrationController.recibirDatosVentas.bind(salesIntegrationController)
);

module.exports = router;

