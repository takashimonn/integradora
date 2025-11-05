const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { authenticate } = require('../middleware/auth');

// Rutas públicas
router.post('/registro', usuarioController.registrar.bind(usuarioController));
router.post('/login', usuarioController.login.bind(usuarioController));

// Rutas protegidas (requieren autenticación)
router.get('/perfil', authenticate, usuarioController.obtenerPerfil.bind(usuarioController));
router.put('/perfil', authenticate, usuarioController.actualizarPerfil.bind(usuarioController));

module.exports = router;

