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
    const { fecha, charolasCuartoKilo, charolasMedioKilo, domosUnKilo, notas } = datos;

    // Validaciones básicas
    if (!fecha) {
      throw new Error('La fecha es requerida');
    }

    // Validar que no exista un registro para esa fecha
    const existe = await productionRepository.findByFecha(fecha);
    if (existe) {
      throw new Error('Ya existe un registro de producción para esta fecha');
    }

    // Validar que al menos una cantidad sea mayor a 0
    const total = (charolasCuartoKilo || 0) + (charolasMedioKilo || 0) + (domosUnKilo || 0);
    if (total === 0) {
      throw new Error('Debe registrar al menos una charola o domo');
    }

    // Validaciones de valores negativos
    if (charolasCuartoKilo < 0 || charolasMedioKilo < 0 || domosUnKilo < 0) {
      throw new Error('Las cantidades no pueden ser negativas');
    }

    // Preparar datos
    const datosRegistro = {
      fecha,
      charolasCuartoKilo: parseInt(charolasCuartoKilo) || 0,
      charolasMedioKilo: parseInt(charolasMedioKilo) || 0,
      domosUnKilo: parseInt(domosUnKilo) || 0,
      notas: notas || null,
      activo: true
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

    const { fecha, charolasCuartoKilo, charolasMedioKilo, domosUnKilo, notas, activo } = datos;

    // Si se actualiza la fecha, verificar que no exista otro registro con esa fecha
    if (fecha) {
      const registroExistente = await productionRepository.findByFecha(fecha);
      if (registroExistente && registroExistente.id !== parseInt(id)) {
        throw new Error('Ya existe un registro de producción para esta fecha');
      }
    }

    // Validaciones de valores negativos
    if (charolasCuartoKilo !== undefined && charolasCuartoKilo < 0) {
      throw new Error('Las charolas de 1/4 kg no pueden ser negativas');
    }
    if (charolasMedioKilo !== undefined && charolasMedioKilo < 0) {
      throw new Error('Las charolas de 1/2 kg no pueden ser negativas');
    }
    if (domosUnKilo !== undefined && domosUnKilo < 0) {
      throw new Error('Los domos de 1 kg no pueden ser negativos');
    }

    // Preparar datos a actualizar
    const datosActualizar = {};
    
    if (fecha !== undefined) datosActualizar.fecha = fecha;
    if (charolasCuartoKilo !== undefined) datosActualizar.charolasCuartoKilo = parseInt(charolasCuartoKilo);
    if (charolasMedioKilo !== undefined) datosActualizar.charolasMedioKilo = parseInt(charolasMedioKilo);
    if (domosUnKilo !== undefined) datosActualizar.domosUnKilo = parseInt(domosUnKilo);
    if (notas !== undefined) datosActualizar.notas = notas;
    if (activo !== undefined) datosActualizar.activo = activo;

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

