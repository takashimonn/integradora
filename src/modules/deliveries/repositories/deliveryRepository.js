const Reparto = require('../models/Reparto');
const { Op } = require('sequelize');

class DeliveryRepository {
  /**
   * Obtener todos los repartos
   * @param {Object} filtros - Filtros para la búsqueda
   * @returns {Promise<Array>}
   */
  async findAll(filtros = {}) {
    const where = {};
    
    if (filtros.activo !== undefined) {
      where.activo = filtros.activo;
    }

    if (filtros.tipo) {
      where.tipo = filtros.tipo;
    }

    if (filtros.clienteFrecuente !== undefined) {
      where.clienteFrecuente = filtros.clienteFrecuente;
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

    // Búsqueda por destino (LIKE)
    if (filtros.destino) {
      where.destino = {
        [Op.like]: `%${filtros.destino}%`
      };
    }

    return await Reparto.findAll({
      where,
      order: [['fecha', 'DESC'], ['createdAt', 'DESC']]
    });
  }

  /**
   * Obtener un reparto por ID
   * @param {number} id - ID del reparto
   * @returns {Promise<Reparto|null>}
   */
  async findById(id) {
    return await Reparto.findByPk(id);
  }

  /**
   * Crear un nuevo reparto
   * @param {Object} datos - Datos del reparto
   * @returns {Promise<Reparto>}
   */
  async create(datos) {
    return await Reparto.create(datos);
  }

  /**
   * Actualizar un reparto
   * @param {number} id - ID del reparto
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Reparto>}
   */
  async update(id, datos) {
    const reparto = await Reparto.findByPk(id);
    
    if (!reparto) {
      throw new Error('Reparto no encontrado');
    }

    await reparto.update(datos);
    return reparto.reload();
  }

  /**
   * Eliminar un reparto (soft delete - desactivar)
   * @param {number} id - ID del reparto
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const reparto = await Reparto.findByPk(id);
    
    if (!reparto) {
      throw new Error('Reparto no encontrado');
    }

    // Soft delete: solo desactivamos
    await reparto.update({ activo: false });
    return true;
  }

  /**
   * Obtener estadísticas de repartos
   * @param {string} fechaDesde - Fecha inicio
   * @param {string} fechaHasta - Fecha fin
   * @param {string} tipo - Tipo de reparto (opcional)
   * @returns {Promise<Object>}
   */
  async obtenerEstadisticas(fechaDesde, fechaHasta, tipo = null) {
    const where = {
      activo: true
    };

    if (tipo) {
      where.tipo = tipo;
    }

    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) {
        where.fecha[Op.gte] = fechaDesde;
      }
      if (fechaHasta) {
        where.fecha[Op.lte] = fechaHasta;
      }
    }

    const estadisticas = await Reparto.findAll({
      where,
      attributes: [
        [Reparto.sequelize.fn('COUNT', Reparto.sequelize.col('id')), 'totalRepartos'],
        [Reparto.sequelize.fn('SUM', Reparto.sequelize.col('cantidad')), 'totalCantidad'],
        [Reparto.sequelize.fn('SUM', Reparto.sequelize.literal("CASE WHEN tipo = 'pollo_frito' THEN cantidad ELSE 0 END")), 'totalPolloFrito'],
        [Reparto.sequelize.fn('SUM', Reparto.sequelize.literal("CASE WHEN tipo = 'pollo_fresco' THEN cantidad ELSE 0 END")), 'totalPolloFresco']
      ],
      raw: true
    });

    return estadisticas[0] || {
      totalRepartos: 0,
      totalCantidad: 0,
      totalPolloFrito: 0,
      totalPolloFresco: 0
    };
  }

  /**
   * Obtener repartos por destino (para ver historial de un cliente/tienda)
   * @param {string} destino - Nombre del destino
   * @param {Object} filtros - Filtros adicionales
   * @returns {Promise<Array>}
   */
  async findByDestino(destino, filtros = {}) {
    const where = {
      destino: {
        [Op.like]: `%${destino}%`
      }
    };

    if (filtros.activo !== undefined) {
      where.activo = filtros.activo;
    }

    if (filtros.tipo) {
      where.tipo = filtros.tipo;
    }

    return await Reparto.findAll({
      where,
      order: [['fecha', 'DESC']]
    });
  }
}

module.exports = new DeliveryRepository();

