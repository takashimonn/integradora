const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { authenticate } = require('../../../middleware/auth');

// Rutas de clientes (todas requieren autenticación)

// GET /api/clients - Obtener todos los clientes
// Query params: ?nombre=Juan&nombre_tienda=Tienda&telefono=123
router.get('/', authenticate, clientController.obtenerTodos.bind(clientController));

// GET /api/clients/:id - Obtener un cliente por ID
router.get('/:id', authenticate, clientController.obtenerPorId.bind(clientController));

// POST /api/clients - Crear nuevo cliente
router.post('/', authenticate, clientController.crear.bind(clientController));

// PUT /api/clients/:id - Actualizar cliente
router.put('/:id', authenticate, clientController.actualizar.bind(clientController));

// DELETE /api/clients/:id - Eliminar cliente
router.delete('/:id', authenticate, clientController.eliminar.bind(clientController));

module.exports = router;

