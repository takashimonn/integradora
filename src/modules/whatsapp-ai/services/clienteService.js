const clientRepository = require('../../clients/repositories/clientRepository');
const clientService = require('../../clients/services/clientService');

class ClienteWhatsAppService {
  /**
   * Buscar o crear cliente por número de teléfono
   * @param {string} telefono - Número de teléfono
   * @param {string} nombre - Nombre del cliente (opcional, solo si es nuevo)
   * @returns {Promise<Object>} - Cliente encontrado o creado
   */
  async buscarOCrearCliente(telefono, nombre = null) {
    try {
      // Limpiar número de teléfono
      const telefonoLimpio = this.limpiarTelefono(telefono);

      // Buscar cliente por teléfono
      const clientes = await clientRepository.findAll({ telefono: telefonoLimpio });

      if (clientes.length > 0) {
        // Cliente existe, retornarlo
        return clientes[0].toJSON();
      }

      // Cliente no existe, crear uno nuevo
      const nombreCliente = nombre || `Cliente ${telefonoLimpio.slice(-4)}`;
      
      const nuevoCliente = await clientService.crear({
        nombre: nombreCliente,
        telefono: telefonoLimpio,
        nombre_tienda: null
      });

      console.log(`Cliente creado automáticamente: ${nombreCliente} (${telefonoLimpio})`);
      return nuevoCliente;
    } catch (error) {
      console.error('Error al buscar/crear cliente:', error);
      throw new Error(`Error al procesar cliente: ${error.message}`);
    }
  }

  /**
   * Limpiar número de teléfono
   * @param {string} telefono - Número de teléfono
   * @returns {string} - Número limpio
   */
  limpiarTelefono(telefono) {
    // Remover whatsapp: si existe
    let numero = telefono.replace('whatsapp:', '');
    
    // Remover espacios, guiones, paréntesis
    numero = numero.replace(/[\s\-\(\)]/g, '');

    // Si tiene código de país (+52), mantenerlo
    // Si no tiene, asumir que es número local y agregar +52
    if (!numero.startsWith('+')) {
      if (numero.startsWith('52')) {
        numero = '+' + numero;
      } else if (numero.length === 10) {
        // Número mexicano de 10 dígitos
        numero = '+52' + numero;
      }
    }

    return numero;
  }

  /**
   * Obtener cliente por teléfono
   * @param {string} telefono - Número de teléfono
   * @returns {Promise<Object|null>}
   */
  async obtenerClientePorTelefono(telefono) {
    try {
      const telefonoLimpio = this.limpiarTelefono(telefono);
      const clientes = await clientRepository.findAll({ telefono: telefonoLimpio });

      if (clientes.length > 0) {
        return clientes[0].toJSON();
      }

      return null;
    } catch (error) {
      console.error('Error al obtener cliente por teléfono:', error);
      return null;
    }
  }
}

module.exports = new ClienteWhatsAppService();

