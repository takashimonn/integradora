const productionRepository = require('../repositories/productionRepository');
const { ValidationError } = require('sequelize');

class ProductionService {
  /**
   * Obtener todos los registros de producción
   * @param {Object} filtros - Filtros opcionales
   * @returns {Promise<Array>}
   */
  async obtenerTodos(filtros = {}) {
    const registros = await productionRepository.findAll(filtros);
    return registros.map(r => r.toJSON());
  }

  /**
   * Obtener un registro por ID
   * @param {number} id - ID del registro
   * @returns {Promise<Object>}
   */
  async obtenerPorId(id) {
    if (!id || isNaN(id)) {
      throw new Error('ID de registro inválido');
    }

    const registro = await productionRepository.findById(id);

    if (!registro) {
      throw new Error('Registro de producción no encontrado');
    }

    return registro.toJSON();
  }

  /**
   * Obtener registro por fecha
   * @param {string} fecha - Fecha en formato YYYY-MM-DD
   * @returns {Promise<Object|null>}
   */
  async obtenerPorFecha(fecha) {
    if (!fecha) {
      throw new Error('La fecha es requerida');
    }

    const registro = await productionRepository.findByFecha(fecha);
    return registro ? registro.toJSON() : null;
  }

  /**
   * Crear un nuevo registro de producción
   * @param {Object} datos - Datos del registro
   * @returns {Promise<Object>}
   */
  async crear(datos) {
    const { produccion_kg, total, devolucion, id_cliente } = datos;

    // Validaciones básicas
    if (!id_cliente) {
      throw new Error('El cliente es requerido');
    }

    // Validaciones de valores negativos
    if (produccion_kg !== undefined && produccion_kg < 0) {
      throw new Error('La producción en kg no puede ser negativa');
    }

    if (total !== undefined && total < 0) {
      throw new Error('El total no puede ser negativo');
    }

    if (devolucion !== undefined && devolucion < 0) {
      throw new Error('La devolución no puede ser negativa');
    }

    // Obtener fecha de hoy en formato YYYY-MM-DD
    const fechaHoy = new Date().toISOString().split('T')[0];

    // Preparar datos según el esquema de la BD
    const datosRegistro = {
      produccion_kg: produccion_kg !== undefined ? parseFloat(produccion_kg) : null,
      total: total !== undefined ? parseFloat(total) : null,
      devolucion: devolucion !== undefined ? parseFloat(devolucion) : null,
      id_cliente: parseInt(id_cliente),
      fecha: fechaHoy
    };

    try {
      const registro = await productionRepository.create(datosRegistro);
      return registro.toJSON();
    } catch (error) {
      this.manejarError(error);
    }
  }

  /**
   * Actualizar un registro de producción
   * @param {number} id - ID del registro
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>}
   */
  async actualizar(id, datos) {
    if (!id || isNaN(id)) {
      throw new Error('ID de registro inválido');
    }

    const { produccion_kg, total, devolucion, id_cliente } = datos;

    // Validaciones de valores negativos
    if (produccion_kg !== undefined && produccion_kg < 0) {
      throw new Error('La producción en kg no puede ser negativa');
    }

    if (total !== undefined && total < 0) {
      throw new Error('El total no puede ser negativo');
    }

    if (devolucion !== undefined && devolucion < 0) {
      throw new Error('La devolución no puede ser negativa');
    }

    // Preparar datos a actualizar según el esquema de la BD
    const datosActualizar = {};
    
    if (produccion_kg !== undefined) datosActualizar.produccion_kg = parseFloat(produccion_kg);
    if (total !== undefined) datosActualizar.total = parseFloat(total);
    if (devolucion !== undefined) datosActualizar.devolucion = parseFloat(devolucion);
    if (id_cliente !== undefined) datosActualizar.id_cliente = parseInt(id_cliente);

    try {
      const registro = await productionRepository.update(id, datosActualizar);
      return registro.toJSON();
    } catch (error) {
      if (error.message === 'Registro de producción no encontrado') {
        throw error;
      }
      this.manejarError(error);
    }
  }

  /**
   * Eliminar un registro (soft delete)
   * @param {number} id - ID del registro
   * @returns {Promise<boolean>}
   */
  async eliminar(id) {
    if (!id || isNaN(id)) {
      throw new Error('ID de registro inválido');
    }

    try {
      await productionRepository.delete(id);
      return true;
    } catch (error) {
      if (error.message === 'Registro de producción no encontrado') {
        throw error;
      }
      throw new Error('Error al eliminar el registro');
    }
  }

  /**
   * Obtener estadísticas de producción
   * @param {string} fechaDesde - Fecha inicio (opcional)
   * @param {string} fechaHasta - Fecha fin (opcional)
   * @returns {Promise<Object>}
   */
  async obtenerEstadisticas(fechaDesde, fechaHasta) {
    const estadisticas = await productionRepository.obtenerEstadisticas(fechaDesde, fechaHasta);
    
    return {
      totalCharolasCuartoKilo: parseInt(estadisticas.totalCuartos) || 0,
      totalCharolasMedioKilo: parseInt(estadisticas.totalMedios) || 0,
      totalDomosUnKilo: parseInt(estadisticas.totalUnKilo) || 0,
      totalKilos: parseFloat(estadisticas.totalKilos) || 0
    };
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

module.exports = new ProductionService();

