const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');

// Rutas de repartos

// GET /api/deliveries - Obtener todos los repartos
// Query params: ?activo=true&tipo=pollo_frito&fecha=2024-01-15&fechaDesde=2024-01-01&fechaHasta=2024-01-31&destino=tienda&clienteFrecuente=true
router.get('/', deliveryController.obtenerTodos.bind(deliveryController));

// GET /api/deliveries/estadisticas - Obtener estadísticas
// Query params: ?fechaDesde=2024-01-01&fechaHasta=2024-01-31&tipo=pollo_frito
router.get('/estadisticas', deliveryController.obtenerEstadisticas.bind(deliveryController));

// GET /api/deliveries/destino/:destino - Obtener repartos por destino
// Query params: ?tipo=pollo_frito&activo=true
router.get('/destino/:destino', deliveryController.obtenerPorDestino.bind(deliveryController));

// GET /api/deliveries/:id - Obtener un reparto por ID
router.get('/:id', deliveryController.obtenerPorId.bind(deliveryController));

// POST /api/deliveries - Crear nuevo reparto
router.post('/', deliveryController.crear.bind(deliveryController));

// PUT /api/deliveries/:id - Actualizar reparto
router.put('/:id', deliveryController.actualizar.bind(deliveryController));

// DELETE /api/deliveries/:id - Eliminar reparto
router.delete('/:id', deliveryController.eliminar.bind(deliveryController));

module.exports = router;

