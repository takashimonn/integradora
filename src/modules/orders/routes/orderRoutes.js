const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Rutas de pedidos

// GET /api/orders - Obtener todos los pedidos
// Query params: ?estado=pendiente&fecha=2024-01-15&whatsapp=521234567890&clienteNombre=Juan
router.get('/', orderController.obtenerTodos.bind(orderController));

// GET /api/orders/estadisticas - Obtener estadísticas
// Query params: ?fechaDesde=2024-01-01&fechaHasta=2024-01-31
router.get('/estadisticas', orderController.obtenerEstadisticas.bind(orderController));

// GET /api/orders/pendientes-notificacion - Obtener pedidos pendientes de notificación
router.get('/pendientes-notificacion', orderController.obtenerPendientesNotificacion.bind(orderController));

// GET /api/orders/numero/:numeroPedido - Obtener pedido por número
router.get('/numero/:numeroPedido', orderController.obtenerPorNumeroPedido.bind(orderController));

// GET /api/orders/:id - Obtener un pedido por ID
router.get('/:id', orderController.obtenerPorId.bind(orderController));

// POST /api/orders - Crear nuevo pedido
router.post('/', orderController.crear.bind(orderController));

// POST /api/orders/webhook/whatsapp - Webhook para recibir pedidos desde WhatsApp
router.post('/webhook/whatsapp', orderController.webhookWhatsApp.bind(orderController));

// PUT /api/orders/:id - Actualizar pedido
router.put('/:id', orderController.actualizar.bind(orderController));

// PUT /api/orders/:id/estado - Actualizar solo el estado del pedido
router.put('/:id/estado', orderController.actualizarEstado.bind(orderController));

// POST /api/orders/:id/reenviar-notificacion - Reenviar notificación
router.post('/:id/reenviar-notificacion', orderController.reenviarNotificacion.bind(orderController));

// DELETE /api/orders/:id - Eliminar pedido
router.delete('/:id', orderController.eliminar.bind(orderController));

module.exports = router;

