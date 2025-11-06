/**
 * Servicio de notificaciones para WhatsApp
 * 
 * Este servicio está preparado para integrarse con:
 * - WhatsApp Business API
 * - WhatsApp Web.js
 * - Twilio WhatsApp API
 * - O cualquier otro servicio de WhatsApp
 */

class NotificationService {
  /**
   * Enviar notificación a encargados sobre un nuevo pedido
   * @param {Object} pedido - Datos del pedido
   * @returns {Promise<boolean>}
   */
  async enviarNotificacionPedido(pedido) {
    try {
      // Obtener números de WhatsApp de encargados desde variables de entorno
      const numerosEncargados = this.obtenerNumerosEncargados();
      
      if (!numerosEncargados || numerosEncargados.length === 0) {
        console.warn('⚠️ No hay números de encargados configurados');
        return false;
      }

      // Formatear mensaje de notificación
      const mensaje = this.formatearMensajePedido(pedido);

      // Enviar notificación a cada encargado
      const resultados = await Promise.all(
        numerosEncargados.map(numero => this.enviarWhatsApp(numero, mensaje))
      );

      // Retornar true si al menos una notificación se envió
      return resultados.some(resultado => resultado === true);

    } catch (error) {
      console.error('❌ Error al enviar notificación:', error);
      return false;
    }
  }

  /**
   * Obtener números de WhatsApp de encargados desde variables de entorno
   * @returns {Array<string>}
   */
  obtenerNumerosEncargados() {
    const numeros = process.env.WHATSAPP_ENCARGADOS;
    
    if (!numeros) {
      return [];
    }

    // Formato esperado: "521234567890,529876543210" (separados por comas)
    return numeros.split(',').map(num => num.trim()).filter(num => num.length > 0);
  }

  /**
   * Formatear mensaje de notificación del pedido
   * @param {Object} pedido - Datos del pedido
   * @returns {string}
   */
  formatearMensajePedido(pedido) {
    const productos = Array.isArray(pedido.productos) ? pedido.productos : JSON.parse(pedido.productos || '[]');
    
    let mensaje = `🔔 *NUEVO PEDIDO*\n\n`;
    mensaje += `📋 *Pedido:* ${pedido.numeroPedido}\n`;
    mensaje += `👤 *Cliente:* ${pedido.clienteNombre}\n`;
    mensaje += `📱 *WhatsApp:* ${pedido.whatsapp}\n`;
    
    if (pedido.direccion) {
      mensaje += `📍 *Dirección:* ${pedido.direccion}\n`;
    }
    
    mensaje += `📅 *Fecha:* ${pedido.fecha} ${pedido.hora || ''}\n`;
    mensaje += `💰 *Total:* $${parseFloat(pedido.total).toFixed(2)}\n`;
    mensaje += `📦 *Estado:* ${pedido.estado.toUpperCase()}\n\n`;
    
    mensaje += `*Productos:*\n`;
    productos.forEach((producto, index) => {
      mensaje += `${index + 1}. ${producto.nombre || producto.producto || 'Producto'}`;
      if (producto.cantidad) {
        mensaje += ` x${producto.cantidad}`;
      }
      if (producto.precio) {
        mensaje += ` - $${parseFloat(producto.precio || 0).toFixed(2)}`;
      }
      mensaje += `\n`;
    });
    
    if (pedido.notas) {
      mensaje += `\n📝 *Notas:* ${pedido.notas}`;
    }

    return mensaje;
  }

  /**
   * Enviar mensaje de WhatsApp
   * TODO: Integrar con servicio real de WhatsApp
   * 
   * Opciones de integración:
   * 1. WhatsApp Business API (Meta)
   * 2. whatsapp-web.js (biblioteca Node.js)
   * 3. Twilio WhatsApp API
   * 4. Baileys (biblioteca Node.js)
   * 
   * @param {string} numero - Número de WhatsApp (formato: 521234567890)
   * @param {string} mensaje - Mensaje a enviar
   * @returns {Promise<boolean>}
   */
  async enviarWhatsApp(numero, mensaje) {
    try {
      // PLACEHOLDER: Aquí se integraría el servicio real de WhatsApp
      // Por ahora, solo logueamos el mensaje
      
      console.log(`📤 Enviando WhatsApp a ${numero}:`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(mensaje);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      // Ejemplo de integración con WhatsApp Business API:
      /*
      const axios = require('axios');
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
        {
          messaging_product: 'whatsapp',
          to: numero,
          type: 'text',
          text: { body: mensaje }
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.status === 200;
      */

      // Ejemplo con whatsapp-web.js:
      /*
      const { Client } = require('whatsapp-web.js');
      // Necesitarías tener el cliente ya inicializado
      const client = getWhatsAppClient(); // función helper
      await client.sendMessage(`${numero}@c.us`, mensaje);
      return true;
      */

      // Por ahora retornamos true para simular éxito
      // En producción, esto debe retornar el resultado real
      return true;

    } catch (error) {
      console.error(`❌ Error al enviar WhatsApp a ${numero}:`, error.message);
      return false;
    }
  }

  /**
   * Enviar confirmación de pedido al cliente
   * @param {Object} pedido - Datos del pedido
   * @returns {Promise<boolean>}
   */
  async enviarConfirmacionCliente(pedido) {
    try {
      const mensaje = this.formatearMensajeConfirmacion(pedido);
      return await this.enviarWhatsApp(pedido.whatsapp, mensaje);
    } catch (error) {
      console.error('❌ Error al enviar confirmación al cliente:', error);
      return false;
    }
  }

  /**
   * Formatear mensaje de confirmación para el cliente
   * @param {Object} pedido - Datos del pedido
   * @returns {string}
   */
  formatearMensajeConfirmacion(pedido) {
    let mensaje = `✅ *¡Pedido Confirmado!*\n\n`;
    mensaje += `📋 *Pedido:* ${pedido.numeroPedido}\n`;
    mensaje += `📅 *Fecha:* ${pedido.fecha} ${pedido.hora || ''}\n`;
    mensaje += `💰 *Total:* $${parseFloat(pedido.total).toFixed(2)}\n`;
    mensaje += `📦 *Estado:* ${pedido.estado.toUpperCase()}\n\n`;
    mensaje += `Gracias por tu pedido. Te mantendremos informado sobre el estado.`;
    
    return mensaje;
  }
}

module.exports = new NotificationService();

