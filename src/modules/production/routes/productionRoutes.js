const express = require('express');
const router = express.Router();
const productionController = require('../controllers/productionController');

// Rutas de producción

// GET /api/production - Obtener todos los registros
// Query params: ?activo=true&fecha=2024-01-15&fechaDesde=2024-01-01&fechaHasta=2024-01-31
router.get('/', productionController.obtenerTodos.bind(productionController));

// GET /api/production/estadisticas - Obtener estadísticas
// Query params: ?fechaDesde=2024-01-01&fechaHasta=2024-01-31
router.get('/estadisticas', productionController.obtenerEstadisticas.bind(productionController));

// GET /api/production/fecha/:fecha - Obtener registro por fecha específica
router.get('/fecha/:fecha', productionController.obtenerPorFecha.bind(productionController));

// GET /api/production/:id - Obtener un registro por ID
router.get('/:id', productionController.obtenerPorId.bind(productionController));

// POST /api/production - Crear nuevo registro
router.post('/', productionController.crear.bind(productionController));

// PUT /api/production/:id - Actualizar registro
router.put('/:id', productionController.actualizar.bind(productionController));

// DELETE /api/production/:id - Eliminar registro
router.delete('/:id', productionController.eliminar.bind(productionController));

module.exports = router;

