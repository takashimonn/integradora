const Produccion = require('../models/Produccion');
const { Op } = require('sequelize');

class ProductionRepository {
  /**
   * Obtener todos los registros de producción
   * @param {Object} filtros - Filtros para la búsqueda
   * @returns {Promise<Array>}
   */
  async findAll(filtros = {}) {
    const where = {};
    
    if (filtros.activo !== undefined) {
      where.activo = filtros.activo;
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

    return await Produccion.findAll({
      where,
      order: [['fecha', 'DESC']]
    });
  }

  /**
   * Obtener un registro de producción por ID
   * @param {number} id - ID del registro
   * @returns {Promise<Produccion|null>}
   */
  async findById(id) {
    return await Produccion.findByPk(id);
  }

  /**
   * Obtener registro por fecha
   * @param {string} fecha - Fecha en formato YYYY-MM-DD
   * @returns {Promise<Produccion|null>}
   */
  async findByFecha(fecha) {
    return await Produccion.findOne({
      where: { fecha }
    });
  }

  /**
   * Crear un nuevo registro de producción
   * @param {Object} datos - Datos del registro
   * @returns {Promise<Produccion>}
   */
  async create(datos) {
    return await Produccion.create(datos);
  }

  /**
   * Actualizar un registro de producción
   * @param {number} id - ID del registro
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Produccion>}
   */
  async update(id, datos) {
    const produccion = await Produccion.findByPk(id);
    
    if (!produccion) {
      throw new Error('Registro de producción no encontrado');
    }

    await produccion.update(datos);
    return produccion.reload();
  }

  /**
   * Eliminar un registro (soft delete - desactivar)
   * @param {number} id - ID del registro
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const produccion = await Produccion.findByPk(id);
    
    if (!produccion) {
      throw new Error('Registro de producción no encontrado');
    }

    // Soft delete: solo desactivamos
    await produccion.update({ activo: false });
    return true;
  }

  /**
   * Obtener estadísticas de producción
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

    const registros = await Produccion.findAll({
      where,
      attributes: [
        [Produccion.sequelize.fn('SUM', Produccion.sequelize.col('charolasCuartoKilo')), 'totalCuartos'],
        [Produccion.sequelize.fn('SUM', Produccion.sequelize.col('charolasMedioKilo')), 'totalMedios'],
        [Produccion.sequelize.fn('SUM', Produccion.sequelize.col('domosUnKilo')), 'totalUnKilo'],
        [Produccion.sequelize.fn('SUM', Produccion.sequelize.col('totalKilos')), 'totalKilos']
      ],
      raw: true
    });

    return registros[0] || {
      totalCuartos: 0,
      totalMedios: 0,
      totalUnKilo: 0,
      totalKilos: 0
    };
  }
}

module.exports = new ProductionRepository();

