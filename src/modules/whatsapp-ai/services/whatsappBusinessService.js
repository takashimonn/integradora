const axios = require('axios');
const crypto = require('crypto');

class WhatsAppBusinessService {
  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'mi_token_secreto_123';
    this.appSecret = process.env.WHATSAPP_APP_SECRET;
    this.apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';
    
    // URL base de la Graph API
    this.baseURL = `https://graph.facebook.com/${this.apiVersion}`;

    // Verificar configuración
    if (!this.accessToken || !this.phoneNumberId) {
      this.configurado = false;
      console.warn('⚠️ WhatsApp Business API no está configurado. Los mensajes no se enviarán.');
      console.warn('   Variables requeridas: WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID');
      return;
    }

    this.configurado = true;
    console.log('✅ WhatsApp Business API configurado correctamente');
  }

  /**
   * Verificar webhook de Meta (para la configuración inicial)
   * @param {string} mode - Parámetro 'hub.mode' de la petición
   * @param {string} token - Parámetro 'hub.verify_token' de la petición
   * @param {string} challenge - Parámetro 'hub.challenge' de la petición
   * @returns {string|null} - Retorna el challenge si el token es válido
   */
  verificarWebhook(mode, token, challenge) {
    if (mode === 'subscribe' && token === this.verifyToken) {
      console.log('✅ Webhook verificado correctamente');
      return challenge;
    }
    console.warn('❌ Verificación de webhook fallida');
    return null;
  }

  /**
   * Validar firma del webhook (recomendado para producción)
   * @param {string} signature - Firma del webhook (X-Hub-Signature-256)
   * @param {string} payload - Cuerpo del webhook (JSON string)
   * @returns {boolean}
   */
  validarFirma(signature, payload) {
    if (!this.appSecret) {
      console.warn('⚠️ WHATSAPP_APP_SECRET no configurado. No se puede validar la firma.');
      return true; // En desarrollo, permitir sin validación
    }

    if (!signature) {
      return false;
    }

    // Meta envía la firma como: sha256=HASH
    const hash = crypto
      .createHmac('sha256', this.appSecret)
      .update(payload)
      .digest('hex');

    const expectedSignature = `sha256=${hash}`;
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Enviar mensaje de WhatsApp
   * @param {string} to - Número de destino (formato: 521234567890, sin +)
   * @param {string} mensaje - Mensaje a enviar
   * @returns {Promise<Object>}
   */
  async enviarMensaje(to, mensaje) {
    if (!this.configurado) {
      console.warn('WhatsApp Business API no está configurado. Mensaje no enviado.');
      return {
        success: false,
        message: 'WhatsApp Business API no configurado'
      };
    }

    try {
      // Formatear número (debe estar sin + y sin espacios)
      const numeroDestino = this.formatearNumero(to);

      const url = `${this.baseURL}/${this.phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: 'whatsapp',
        to: numeroDestino,
        type: 'text',
        text: {
          body: mensaje
        }
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        messageId: response.data.messages[0]?.id,
        status: 'sent'
      };
    } catch (error) {
      console.error('Error al enviar mensaje de WhatsApp:', error.response?.data || error.message);
      throw new Error(`Error al enviar mensaje: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Formatear número de teléfono para WhatsApp Business API
   * @param {string} numero - Número de teléfono
   * @returns {string} - Número formateado (sin +, sin espacios)
   */
  formatearNumero(numero) {
    // Remover espacios, guiones, paréntesis, y el prefijo whatsapp:
    let numeroLimpio = numero.replace(/[\s\-\(\)]/g, '').replace('whatsapp:', '');

    // Remover el + si existe
    if (numeroLimpio.startsWith('+')) {
      numeroLimpio = numeroLimpio.substring(1);
    }

    // Si no tiene código de país, asumir México (52)
    if (!numeroLimpio.startsWith('52') && numeroLimpio.length === 10) {
      numeroLimpio = '52' + numeroLimpio;
    }

    return numeroLimpio;
  }

  /**
   * Extraer número de teléfono del payload de Meta
   * @param {string} from - Campo 'from' del webhook
   * @returns {string} - Número limpio (con código de país)
   */
  extraerNumero(from) {
    // Meta envía el número sin formato especial, solo el número
    // Ejemplo: "521234567890"
    return from;
  }

  /**
   * Procesar entrada del webhook de Meta
   * @param {Object} webhookData - Datos del webhook
   * @returns {Object|null} - { telefono, mensaje } o null si no es un mensaje válido
   */
  procesarWebhook(webhookData) {
    try {
      // Meta envía los datos en esta estructura:
      // {
      //   object: 'whatsapp_business_account',
      //   entry: [{
      //     changes: [{
      //       value: {
      //         messages: [{
      //           from: '521234567890',
      //           text: { body: 'mensaje' }
      //         }]
      //       }
      //     }]
      //   }]
      // }

      if (webhookData.object !== 'whatsapp_business_account') {
        return null;
      }

      const entry = webhookData.entry?.[0];
      if (!entry) {
        return null;
      }

      const change = entry.changes?.[0];
      if (!change || change.field !== 'messages') {
        return null;
      }

      const message = change.value?.messages?.[0];
      if (!message || message.type !== 'text') {
        return null;
      }

      const telefono = this.extraerNumero(message.from);
      const mensaje = message.text?.body;

      if (!telefono || !mensaje) {
        return null;
      }

      return {
        telefono,
        mensaje: mensaje.trim(),
        messageId: message.id,
        timestamp: message.timestamp
      };
    } catch (error) {
      console.error('Error al procesar webhook:', error);
      return null;
    }
  }
}

module.exports = new WhatsAppBusinessService();

