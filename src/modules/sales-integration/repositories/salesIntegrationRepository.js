const Reporte = require('../../../models/Reporte');
const Sucursal = require('../../../models/Sucursal');
const Sincronizacion = require('../models/Sincronizacion');
const { Op } = require('sequelize');
const { sequelize } = require('../../../config/sequelize');

class SalesIntegrationRepository {
  /**
   * Buscar o crear un reporte diario para una sucursal y fecha
   * @param {number} idSucursal - ID de la sucursal
   * @param {string} fecha - Fecha en formato YYYY-MM-DD
   * @param {number} totalVentas - Total de ventas del día
   * @returns {Promise<Object>}
   */
  async crearOActualizarReporte(idSucursal, fecha, totalVentas) {
    try {
      // Buscar si ya existe un reporte para esta sucursal y fecha
      const reporteExistente = await Reporte.findOne({
        where: {
          id_sucursal: idSucursal,
          fecha: fecha
        }
      });

      if (reporteExistente) {
        // Actualizar el reporte existente
        reporteExistente.total_ventas = parseFloat(totalVentas);
        await reporteExistente.save();
        return reporteExistente;
      } else {
        // Crear nuevo reporte
        const nuevoReporte = await Reporte.create({
          id_sucursal: idSucursal,
          fecha: fecha,
          total_ventas: parseFloat(totalVentas)
        });
        return nuevoReporte;
      }
    } catch (error) {
      throw new Error(`Error al crear/actualizar reporte: ${error.message}`);
    }
  }

  /**
   * Obtener reporte por sucursal y fecha
   * @param {number} idSucursal - ID de la sucursal
   * @param {string} fecha - Fecha en formato YYYY-MM-DD
   * @returns {Promise<Object|null>}
   */
  async obtenerReportePorFecha(idSucursal, fecha) {
    try {
      const reporte = await Reporte.findOne({
        where: {
          id_sucursal: idSucursal,
          fecha: fecha
        },
        include: [{
          model: Sucursal,
          as: 'sucursal'
        }]
      });

      return reporte;
    } catch (error) {
      throw new Error(`Error al obtener reporte: ${error.message}`);
    }
  }

  /**
   * Obtener todos los reportes de una sucursal
   * @param {number} idSucursal - ID de la sucursal
   * @param {string} fechaDesde - Fecha inicio (opcional)
   * @param {string} fechaHasta - Fecha fin (opcional)
   * @returns {Promise<Array>}
   */
  async obtenerReportesPorSucursal(idSucursal, fechaDesde = null, fechaHasta = null) {
    try {
      const where = {
        id_sucursal: idSucursal
      };

      if (fechaDesde && fechaHasta) {
        where.fecha = {
          [Op.between]: [fechaDesde, fechaHasta]
        };
      } else if (fechaDesde) {
        where.fecha = {
          [Op.gte]: fechaDesde
        };
      } else if (fechaHasta) {
        where.fecha = {
          [Op.lte]: fechaHasta
        };
      }

      const reportes = await Reporte.findAll({
        where,
        include: [{
          model: Sucursal,
          as: 'sucursal'
        }],
        order: [['fecha', 'DESC']]
      });

      return reportes;
    } catch (error) {
      throw new Error(`Error al obtener reportes: ${error.message}`);
    }
  }

  /**
   * Verificar si existe una sucursal
   * @param {number} idSucursal - ID de la sucursal
   * @returns {Promise<boolean>}
   */
  async verificarSucursal(idSucursal) {
    try {
      const sucursal = await Sucursal.findByPk(idSucursal);
      return !!sucursal;
    } catch (error) {
      return false;
    }
  }

  /**
   * Verificar si hay sincronización pendiente para una sucursal
   * @param {number} idSucursal - ID de la sucursal
   * @returns {Promise<boolean>}
   */
  async verificarSincronizacionPendiente(idSucursal) {
    try {
      const sincronizacion = await Sincronizacion.findOne({
        where: { id_sucursal: idSucursal }
      });

      if (!sincronizacion) {
        return false;
      }

      return sincronizacion.pendiente === true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Marcar sincronización como pendiente
   * @param {number} idSucursal - ID de la sucursal
   * @returns {Promise<Object>}
   */
  async marcarSincronizacionPendiente(idSucursal) {
    try {
      const [sincronizacion, created] = await Sincronizacion.findOrCreate({
        where: { id_sucursal: idSucursal },
        defaults: {
          id_sucursal: idSucursal,
          pendiente: true
        }
      });

      if (!created) {
        sincronizacion.pendiente = true;
        await sincronizacion.save();
      }

      return sincronizacion;
    } catch (error) {
      throw new Error(`Error al marcar sincronización pendiente: ${error.message}`);
    }
  }

  /**
   * Marcar sincronización como completada
   * @param {number} idSucursal - ID de la sucursal
   * @returns {Promise<Object>}
   */
  async marcarSincronizacionCompletada(idSucursal) {
    try {
      const sincronizacion = await Sincronizacion.findOne({
        where: { id_sucursal: idSucursal }
      });

      if (!sincronizacion) {
        // Si no existe, crear el registro
        return await Sincronizacion.create({
          id_sucursal: idSucursal,
          pendiente: false,
          ultima_sincronizacion: new Date()
        });
      }

      sincronizacion.pendiente = false;
      sincronizacion.ultima_sincronizacion = new Date();
      await sincronizacion.save();

      return sincronizacion;
    } catch (error) {
      throw new Error(`Error al marcar sincronización completada: ${error.message}`);
    }
  }

  /**
   * Recibir datos de ventas desde el script local
   * @param {number} idSucursal - ID de la sucursal
   * @param {string} fecha - Fecha en formato YYYY-MM-DD
   * @param {number} totalVentas - Total de ventas
   * @returns {Promise<Object>}
   */
  async recibirDatosVentas(idSucursal, fecha, totalVentas) {
    try {
      // Crear o actualizar el reporte
      const reporte = await this.crearOActualizarReporte(idSucursal, fecha, totalVentas);
      
      // Marcar sincronización como completada
      await this.marcarSincronizacionCompletada(idSucursal);

      return reporte;
    } catch (error) {
      throw new Error(`Error al recibir datos de ventas: ${error.message}`);
    }
  }
}

module.exports = new SalesIntegrationRepository();

