const axios = require('axios');
const crypto = require('crypto');
class WhatsAppBusinessService {
  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'mi_token_secreto_123';
    this.appSecret = process.env.WHATSAPP_APP_SECRET;
    this.apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';
    this.baseURL = `https://graph.facebook.com/${this.apiVersion}`;
    if (!this.accessToken || !this.phoneNumberId) {
      this.configurado = false;
      console.warn('⚠️ WhatsApp Business API no está configurado. Los mensajes no se enviarán.');
      console.warn('   Variables requeridas: WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID');
      return;
    }
    this.configurado = true;
    console.log('✅ WhatsApp Business API configurado correctamente');
  }
  verificarWebhook(mode, token, challenge) {
    if (mode === 'subscribe' && token === this.verifyToken) {
      console.log('✅ Webhook verificado correctamente');
      return challenge;
    }
    console.warn('❌ Verificación de webhook fallida');
    return null;
  }
  validarFirma(signature, payload) {
    if (!this.appSecret) {
      console.warn('⚠️ WHATSAPP_APP_SECRET no configurado. No se puede validar la firma.');
      return true; 
    }
    if (!signature) {
      return false;
    }
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
  async enviarMensaje(to, mensaje) {
    if (!this.configurado) {
      console.warn('WhatsApp Business API no está configurado. Mensaje no enviado.');
      return {
        success: false,
        message: 'WhatsApp Business API no configurado'
      };
    }
    try {
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
  formatearNumero(numero) {
    let numeroLimpio = numero.replace(/[\s\-\(\)]/g, '').replace('whatsapp:', '');
    if (numeroLimpio.startsWith('+')) {
      numeroLimpio = numeroLimpio.substring(1);
    }
    if (!numeroLimpio.startsWith('52') && numeroLimpio.length === 10) {
      numeroLimpio = '52' + numeroLimpio;
    }
    return numeroLimpio;
  }
  extraerNumero(from) {
    return from;
  }
  procesarWebhook(webhookData) {
    try {
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
