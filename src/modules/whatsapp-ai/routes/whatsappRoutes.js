const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');

// Webhook de WhatsApp Business API (Meta)
// GET: Verificación del webhook (Meta envía GET durante la configuración)
// POST: Recibir mensajes (Meta envía POST con los mensajes)
router.get('/webhook', whatsappController.verificarWebhook.bind(whatsappController));
router.post('/webhook', express.json(), whatsappController.webhook.bind(whatsappController));

// Endpoint de prueba (para testing sin webhook real)
router.post('/test', express.json(), whatsappController.test.bind(whatsappController));

// Endpoint para obtener información del número configurado
router.get('/info', whatsappController.obtenerInfo.bind(whatsappController));

module.exports = router;

