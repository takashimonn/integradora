const orderRepository = require('../repositories/orderRepository');
const notificationService = require('./notificationService');
const { ValidationError } = require('sequelize');

class OrderService {
  /**
   * Obtener todos los pedidos
   * @param {Object} filtros - Filtros opcionales
   * @returns {Promise<Array>}
   */
  async obtenerTodos(filtros = {}) {
    const pedidos = await orderRepository.findAll(filtros);
    return pedidos.map(p => p.toJSON());
  }

  /**
   * Obtener un pedido por ID
   * @param {number} id - ID del pedido
   * @returns {Promise<Object>}
   */
  async obtenerPorId(id) {
    if (!id || isNaN(id)) {
      throw new Error('ID de pedido inválido');
    }

    const pedido = await orderRepository.findById(id);

    if (!pedido) {
      throw new Error('Pedido no encontrado');
    }

    return pedido.toJSON();
  }

  /**
   * Obtener pedido por número de pedido
   * @param {string} numeroPedido - Número de pedido
   * @returns {Promise<Object>}
   */
  async obtenerPorNumeroPedido(numeroPedido) {
    if (!numeroPedido) {
      throw new Error('Número de pedido es requerido');
    }

    const pedido = await orderRepository.findByNumeroPedido(numeroPedido);
    
    if (!pedido) {
      throw new Error('Pedido no encontrado');
    }

    return pedido.toJSON();
  }

  /**
   * Crear un nuevo pedido
   * @param {Object} datos - Datos del pedido
   * @param {boolean} enviarNotificacion - Si debe enviar notificación (default: true)
   * @returns {Promise<Object>}
   */
  async crear(datos, enviarNotificacion = true) {
    const { fecha, hora, clienteNombre, whatsapp, direccion, productos, total, metodoPago, notas } = datos;

    // Validaciones básicas
    if (!clienteNombre) {
      throw new Error('El nombre del cliente es requerido');
    }

    if (!whatsapp) {
      throw new Error('El número de WhatsApp es requerido');
    }

    if (!productos || !Array.isArray(productos) || productos.length === 0) {
      throw new Error('Debe incluir al menos un producto');
    }

    if (total === undefined || total === null) {
      throw new Error('El total es requerido');
    }

    if (total < 0) {
      throw new Error('El total no puede ser negativo');
    }

    // Validar formato de productos
    productos.forEach((producto, index) => {
      if (!producto.nombre && !producto.producto) {
        throw new Error(`El producto ${index + 1} debe tener un nombre`);
      }
    });

    // Preparar datos
    const datosPedido = {
      fecha: fecha || new Date().toISOString().split('T')[0],
      hora: hora || null,
      clienteNombre,
      whatsapp: this.formatearWhatsApp(whatsapp),
      direccion: direccion || null,
      productos,
      total: parseFloat(total),
      metodoPago: metodoPago || null,
      notas: notas || null,
      estado: 'pendiente',
      notificado: false,
      activo: true
    };

    try {
      const pedido = await orderRepository.create(datosPedido);
      const pedidoJSON = pedido.toJSON();

      // Enviar notificación a encargados
      if (enviarNotificacion) {
        const notificado = await notificationService.enviarNotificacionPedido(pedidoJSON);
        
        if (notificado) {
          await orderRepository.update(pedido.id, {
            notificado: true,
            fechaNotificacion: new Date()
          });
          pedidoJSON.notificado = true;
          pedidoJSON.fechaNotificacion = new Date();
        }
      }

      return pedidoJSON;
    } catch (error) {
      this.manejarError(error);
    }
  }

  /**
   * Actualizar un pedido
   * @param {number} id - ID del pedido
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>}
   */
  async actualizar(id, datos) {
    if (!id || isNaN(id)) {
      throw new Error('ID de pedido inválido');
    }

    const { estado, productos, total, metodoPago, notas, direccion } = datos;

    // Validaciones
    if (estado && !['pendiente', 'confirmado', 'en_preparacion', 'listo', 'en_camino', 'entregado', 'cancelado'].includes(estado)) {
      throw new Error('Estado de pedido inválido');
    }

    if (total !== undefined && total < 0) {
      throw new Error('El total no puede ser negativo');
    }

    // Preparar datos a actualizar
    const datosActualizar = {};
    
    if (estado !== undefined) datosActualizar.estado = estado;
    if (productos !== undefined) datosActualizar.productos = productos;
    if (total !== undefined) datosActualizar.total = parseFloat(total);
    if (metodoPago !== undefined) datosActualizar.metodoPago = metodoPago;
    if (notas !== undefined) datosActualizar.notas = notas;
    if (direccion !== undefined) datosActualizar.direccion = direccion;

    try {
      const pedido = await orderRepository.update(id, datosActualizar);
      return pedido.toJSON();
    } catch (error) {
      if (error.message === 'Pedido no encontrado') {
        throw error;
      }
      this.manejarError(error);
    }
  }

  /**
   * Actualizar estado de un pedido
   * @param {number} id - ID del pedido
   * @param {string} estado - Nuevo estado
   * @returns {Promise<Object>}
   */
  async actualizarEstado(id, estado) {
    return await this.actualizar(id, { estado });
  }

  /**
   * Eliminar un pedido (soft delete)
   * @param {number} id - ID del pedido
   * @returns {Promise<boolean>}
   */
  async eliminar(id) {
    if (!id || isNaN(id)) {
      throw new Error('ID de pedido inválido');
    }

    try {
      await orderRepository.delete(id);
      return true;
    } catch (error) {
      if (error.message === 'Pedido no encontrado') {
        throw error;
      }
      throw new Error('Error al eliminar el pedido');
    }
  }

  /**
   * Obtener pedidos pendientes de notificación
   * @returns {Promise<Array>}
   */
  async obtenerPendientesNotificacion() {
    const pedidos = await orderRepository.findPendientesNotificacion();
    return pedidos.map(p => p.toJSON());
  }

  /**
   * Reenviar notificación de un pedido
   * @param {number} id - ID del pedido
   * @returns {Promise<boolean>}
   */
  async reenviarNotificacion(id) {
    const pedido = await this.obtenerPorId(id);
    const notificado = await notificationService.enviarNotificacionPedido(pedido);
    
    if (notificado) {
      await orderRepository.update(id, {
        notificado: true,
        fechaNotificacion: new Date()
      });
    }
    
    return notificado;
  }

  /**
   * Obtener estadísticas de pedidos
   * @param {string} fechaDesde - Fecha inicio (opcional)
   * @param {string} fechaHasta - Fecha fin (opcional)
   * @returns {Promise<Object>}
   */
  async obtenerEstadisticas(fechaDesde, fechaHasta) {
    const estadisticas = await orderRepository.obtenerEstadisticas(fechaDesde, fechaHasta);
    
    return {
      totalPedidos: parseInt(estadisticas.totalPedidos) || 0,
      totalVentas: parseFloat(estadisticas.totalVentas) || 0,
      pendientes: parseInt(estadisticas.pendientes) || 0,
      entregados: parseInt(estadisticas.entregados) || 0,
      cancelados: parseInt(estadisticas.cancelados) || 0
    };
  }

  /**
   * Formatear número de WhatsApp
   * @param {string} numero - Número de WhatsApp
   * @returns {string}
   */
  formatearWhatsApp(numero) {
    // Remover espacios, guiones, paréntesis, etc.
    let formateado = numero.replace(/[\s\-\(\)]/g, '');
    
    // Si no empieza con código de país, agregar 52 (México) como ejemplo
    // Esto debería ajustarse según el país
    if (!formateado.startsWith('52') && formateado.length === 10) {
      formateado = '52' + formateado;
    }
    
    return formateado;
  }

  /**
   * Manejar errores de Sequelize
   * @param {Error} error - Error de Sequelize
   */
  manejarError(error) {
    if (error instanceof ValidationError) {
      const mensajes = error.errors.map(err => err.message).join(', ');
      throw new Error(`Error de validación: ${mensajes}`);
    }

    throw error;
  }
}

module.exports = new OrderService();

