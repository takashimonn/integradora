const pedidoWhatsAppService = require('../services/pedidoWhatsAppService');
const whatsappBusinessService = require('../services/whatsappBusinessService');

class WhatsAppController {
  /**
   * Verificación del webhook de Meta (GET)
   * Meta envía un GET para verificar el webhook durante la configuración
   * GET /api/whatsapp/webhook
   */
  async verificarWebhook(req, res) {
    try {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      console.log('=== VERIFICACIÓN DE WEBHOOK ===');
      console.log('Mode:', mode);
      console.log('Token recibido:', token);
      console.log('Challenge:', challenge);

      const challengeResponse = whatsappBusinessService.verificarWebhook(mode, token, challenge);

      if (challengeResponse) {
        console.log('Enviando challenge:', challengeResponse);
        // Agregar header para saltar la página de advertencia de ngrok-free
        res.setHeader('ngrok-skip-browser-warning', 'true');
        // Meta espera la respuesta como texto plano
        res.status(200).type('text/plain').send(challengeResponse);
        return;
      } else {
        console.warn('Verificación fallida - token o mode incorrecto');
        return res.status(403).send('Forbidden');
      }
    } catch (error) {
      console.error('Error en verificación de webhook:', error);
      return res.status(500).send('Error');
    }
  }

  /**
   * Webhook para recibir mensajes de WhatsApp Business API (Meta)
   * POST /api/whatsapp/webhook
   */
  async webhook(req, res) {
    try {
      // Log para debugging - ANTES de responder
      console.log('=== WEBHOOK RECIBIDO ===');
      console.log('Method:', req.method);
      console.log('URL:', req.url);
      console.log('Headers:', JSON.stringify(req.headers, null, 2));
      console.log('Body completo:', JSON.stringify(req.body, null, 2));
      console.log('Content-Type:', req.headers['content-type']);

      // Primero responder 200 OK a Meta (importante para evitar reintentos)
      res.status(200).send('OK');

      // Validar firma del webhook (opcional pero recomendado)
      const signature = req.headers['x-hub-signature-256'];
      if (signature) {
        const payload = JSON.stringify(req.body);
        const isValid = whatsappBusinessService.validarFirma(signature, payload);
        if (!isValid) {
          console.warn('⚠️ Firma del webhook inválida. Ignorando petición.');
          return;
        }
      }

      // Procesar webhook de Meta
      const datosMensaje = whatsappBusinessService.procesarWebhook(req.body);

      if (!datosMensaje) {
        console.log('No es un mensaje de texto válido o no hay datos para procesar');
        return;
      }

      const { telefono, mensaje, messageId } = datosMensaje;

      console.log(`Mensaje recibido de ${telefono}: ${mensaje}`);
      console.log(`Message ID: ${messageId}`);

      // Ignorar mensajes vacíos
      if (!mensaje || mensaje.length === 0) {
        console.log('Mensaje vacío ignorado');
        return;
      }

      // Procesar y crear pedido (en background para no bloquear la respuesta)
      pedidoWhatsAppService.procesarYCrearPedido(mensaje, telefono)
        .then(resultado => {
          if (resultado.success === false) {
            if (resultado.requiereRespuesta) {
              console.log(`ℹ️ Esperando respuesta del cliente: ${resultado.message}`);
            } else if (resultado.ignorado) {
              console.log(`ℹ️ Mensaje ignorado: ${resultado.message}`);
            } else {
              console.warn(`⚠️ Pedido no procesado: ${resultado.message}`);
            }
          } else if (resultado.pedido) {
            console.log(`✅ Pedido creado exitosamente: ID ${resultado.pedido.id_pedido}`);
          } else {
            console.log(`✅ Proceso completado: ${resultado.message || 'Sin detalles'}`);
          }
        })
        .catch(error => {
          console.error('Error al procesar pedido:', error.message || error);
        });

    } catch (error) {
      console.error('Error en webhook de WhatsApp:', error);
      // Ya respondimos 200, así que solo logueamos el error
    }
  }

  /**
   * Endpoint de prueba (para testing sin webhook real)
   * POST /api/whatsapp/test
   */
  async test(req, res) {
    try {
      const { mensaje, telefono } = req.body;

      if (!mensaje || !telefono) {
        return res.status(400).json({
          success: false,
          message: 'mensaje y telefono son requeridos'
        });
      }

      const resultado = await pedidoWhatsAppService.procesarYCrearPedido(
        mensaje,
        telefono
      );

      res.json({
        success: true,
        message: 'Pedido procesado exitosamente',
        data: resultado
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
        error: error.stack
      });
    }
  }

  /**
   * Obtener información del número configurado
   * GET /api/whatsapp/info
   */
  async obtenerInfo(req, res) {
    try {
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const configurado = whatsappBusinessService.configurado;

      res.json({
        success: true,
        configurado: configurado,
        phoneNumberId: phoneNumberId || 'No configurado',
        instrucciones: {
          numeroPrueba: '+1 555 643 5970',
          numeroEmpresa: '+52 16183270324',
          mensaje: 'Envía un mensaje desde tu WhatsApp personal al número configurado. El sistema procesará automáticamente tu pedido.'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new WhatsAppController();

