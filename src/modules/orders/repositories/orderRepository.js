const Pedido = require('../models/Pedido');
const { Op } = require('sequelize');

class OrderRepository {
  /**
   * Obtener todos los pedidos
   * @param {Object} filtros - Filtros para la búsqueda
   * @returns {Promise<Array>}
   */
  async findAll(filtros = {}) {
    const where = {};
    
    if (filtros.activo !== undefined) {
      where.activo = filtros.activo;
    }

    if (filtros.estado) {
      where.estado = filtros.estado;
    }

    if (filtros.whatsapp) {
      where.whatsapp = filtros.whatsapp;
    }

    if (filtros.notificado !== undefined) {
      where.notificado = filtros.notificado;
    }

    // Filtro por rango de fechas
    if (filtros.fechaDesde || filtros.fechaHasta) {
      where.fecha = {};
      if (filtros.fechaDesde) {
        where.fecha[Op.gte] = filtros.fechaDesde;
      }
      if (filtros.fechaHasta) {
        where.fecha[Op.lte] = filtros.fechaHasta;
      }
    }

    // Filtro por fecha específica
    if (filtros.fecha) {
      where.fecha = filtros.fecha;
    }

    // Búsqueda por nombre de cliente (LIKE)
    if (filtros.clienteNombre) {
      where.clienteNombre = {
        [Op.like]: `%${filtros.clienteNombre}%`
      };
    }

    // Búsqueda por número de pedido
    if (filtros.numeroPedido) {
      where.numeroPedido = {
        [Op.like]: `%${filtros.numeroPedido}%`
      };
    }

    return await Pedido.findAll({
      where,
      order: [['fecha', 'DESC'], ['hora', 'DESC']]
    });
  }

  /**
   * Obtener un pedido por ID
   * @param {number} id - ID del pedido
   * @returns {Promise<Pedido|null>}
   */
  async findById(id) {
    return await Pedido.findByPk(id);
  }

  /**
   * Obtener pedido por número de pedido
   * @param {string} numeroPedido - Número de pedido
   * @returns {Promise<Pedido|null>}
   */
  async findByNumeroPedido(numeroPedido) {
    return await Pedido.findOne({
      where: { numeroPedido }
    });
  }

  /**
   * Crear un nuevo pedido
   * @param {Object} datos - Datos del pedido
   * @returns {Promise<Pedido>}
   */
  async create(datos) {
    return await Pedido.create(datos);
  }

  /**
   * Actualizar un pedido
   * @param {number} id - ID del pedido
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Pedido>}
   */
  async update(id, datos) {
    const pedido = await Pedido.findByPk(id);
    
    if (!pedido) {
      throw new Error('Pedido no encontrado');
    }

    await pedido.update(datos);
    return pedido.reload();
  }

  /**
   * Eliminar un pedido (soft delete - desactivar)
   * @param {number} id - ID del pedido
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const pedido = await Pedido.findByPk(id);
    
    if (!pedido) {
      throw new Error('Pedido no encontrado');
    }

    // Soft delete: solo desactivamos
    await pedido.update({ activo: false });
    return true;
  }

  /**
   * Obtener pedidos pendientes de notificación
   * @returns {Promise<Array>}
   */
  async findPendientesNotificacion() {
    return await Pedido.findAll({
      where: {
        activo: true,
        notificado: false,
        estado: {
          [Op.in]: ['pendiente', 'confirmado']
        }
      },
      order: [['createdAt', 'ASC']]
    });
  }

  /**
   * Obtener estadísticas de pedidos
   * @param {string} fechaDesde - Fecha inicio
   * @param {string} fechaHasta - Fecha fin
   * @returns {Promise<Object>}
   */
  async obtenerEstadisticas(fechaDesde, fechaHasta) {
    const where = {
      activo: true
    };

    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) {
        where.fecha[Op.gte] = fechaDesde;
      }
      if (fechaHasta) {
        where.fecha[Op.lte] = fechaHasta;
      }
    }

    const estadisticas = await Pedido.findAll({
      where,
      attributes: [
        [Pedido.sequelize.fn('COUNT', Pedido.sequelize.col('id')), 'totalPedidos'],
        [Pedido.sequelize.fn('SUM', Pedido.sequelize.col('total')), 'totalVentas'],
        [Pedido.sequelize.fn('SUM', Pedido.sequelize.literal("CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END")), 'pendientes'],
        [Pedido.sequelize.fn('SUM', Pedido.sequelize.literal("CASE WHEN estado = 'entregado' THEN 1 ELSE 0 END")), 'entregados'],
        [Pedido.sequelize.fn('SUM', Pedido.sequelize.literal("CASE WHEN estado = 'cancelado' THEN 1 ELSE 0 END")), 'cancelados']
      ],
      raw: true
    });

    return estadisticas[0] || {
      totalPedidos: 0,
      totalVentas: 0,
      pendientes: 0,
      entregados: 0,
      cancelados: 0
    };
  }
}

module.exports = new OrderRepository();

