const deliveryRepository = require('../repositories/deliveryRepository');
const { ValidationError } = require('sequelize');

class DeliveryService {
  /**
   * Obtener todos los repartos
   * @param {Object} filtros - Filtros opcionales
   * @returns {Promise<Array>}
   */
  async obtenerTodos(filtros = {}) {
    const repartos = await deliveryRepository.findAll(filtros);
    return repartos.map(r => r.toJSON());
  }

  /**
   * Obtener un reparto por ID
   * @param {number} id - ID del reparto
   * @returns {Promise<Object>}
   */
  async obtenerPorId(id) {
    if (!id || isNaN(id)) {
      throw new Error('ID de reparto inválido');
    }

    const reparto = await deliveryRepository.findById(id);

    if (!reparto) {
      throw new Error('Reparto no encontrado');
    }

    return reparto.toJSON();
  }

  /**
   * Crear un nuevo reparto
   * @param {Object} datos - Datos del reparto
   * @returns {Promise<Object>}
   */
  async crear(datos) {
    const { fecha, tipo, destino, cantidad, unidadMedida, clienteFrecuente, direccion, telefono, notas } = datos;

    // Validaciones básicas
    if (!fecha) {
      throw new Error('La fecha es requerida');
    }

    if (!tipo) {
      throw new Error('El tipo de reparto es requerido');
    }

    if (!destino) {
      throw new Error('El destino es requerido');
    }

    if (cantidad === undefined || cantidad === null) {
      throw new Error('La cantidad es requerida');
    }

    if (cantidad < 0) {
      throw new Error('La cantidad no puede ser negativa');
    }

    // Validaciones específicas por tipo
    if (tipo === 'pollo_fresco') {
      // Para pollo fresco, validar que tenga dirección si es entrega a domicilio
      if (clienteFrecuente && !direccion) {
        throw new Error('La dirección es requerida para entregas a domicilio de clientes frecuentes');
      }
    }

    // Preparar datos
    const datosReparto = {
      fecha,
      tipo,
      destino,
      cantidad: parseFloat(cantidad),
      unidadMedida: unidadMedida || 'kg',
      clienteFrecuente: tipo === 'pollo_fresco' ? (clienteFrecuente || false) : false,
      direccion: direccion || null,
      telefono: telefono || null,
      notas: notas || null,
      activo: true
    };

    try {
      const reparto = await deliveryRepository.create(datosReparto);
      return reparto.toJSON();
    } catch (error) {
      this.manejarError(error);
    }
  }

  /**
   * Actualizar un reparto
   * @param {number} id - ID del reparto
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>}
   */
  async actualizar(id, datos) {
    if (!id || isNaN(id)) {
      throw new Error('ID de reparto inválido');
    }

    const { fecha, tipo, destino, cantidad, unidadMedida, clienteFrecuente, direccion, telefono, notas, activo } = datos;

    // Validaciones
    if (cantidad !== undefined && cantidad < 0) {
      throw new Error('La cantidad no puede ser negativa');
    }

    if (tipo && !['pollo_frito', 'pollo_fresco'].includes(tipo)) {
      throw new Error('Tipo de reparto inválido');
    }

    // Preparar datos a actualizar
    const datosActualizar = {};
    
    if (fecha !== undefined) datosActualizar.fecha = fecha;
    if (tipo !== undefined) datosActualizar.tipo = tipo;
    if (destino !== undefined) datosActualizar.destino = destino;
    if (cantidad !== undefined) datosActualizar.cantidad = parseFloat(cantidad);
    if (unidadMedida !== undefined) datosActualizar.unidadMedida = unidadMedida;
    if (clienteFrecuente !== undefined) datosActualizar.clienteFrecuente = clienteFrecuente;
    if (direccion !== undefined) datosActualizar.direccion = direccion;
    if (telefono !== undefined) datosActualizar.telefono = telefono;
    if (notas !== undefined) datosActualizar.notas = notas;
    if (activo !== undefined) datosActualizar.activo = activo;

    try {
      const reparto = await deliveryRepository.update(id, datosActualizar);
      return reparto.toJSON();
    } catch (error) {
      if (error.message === 'Reparto no encontrado') {
        throw error;
      }
      this.manejarError(error);
    }
  }

  /**
   * Eliminar un reparto (soft delete)
   * @param {number} id - ID del reparto
   * @returns {Promise<boolean>}
   */
  async eliminar(id) {
    if (!id || isNaN(id)) {
      throw new Error('ID de reparto inválido');
    }

    try {
      await deliveryRepository.delete(id);
      return true;
    } catch (error) {
      if (error.message === 'Reparto no encontrado') {
        throw error;
      }
      throw new Error('Error al eliminar el reparto');
    }
  }

  /**
   * Obtener repartos por destino
   * @param {string} destino - Nombre del destino
   * @param {Object} filtros - Filtros adicionales
   * @returns {Promise<Array>}
   */
  async obtenerPorDestino(destino, filtros = {}) {
    if (!destino) {
      throw new Error('El destino es requerido');
    }

    const repartos = await deliveryRepository.findByDestino(destino, filtros);
    return repartos.map(r => r.toJSON());
  }

  /**
   * Obtener estadísticas de repartos
   * @param {string} fechaDesde - Fecha inicio (opcional)
   * @param {string} fechaHasta - Fecha fin (opcional)
   * @param {string} tipo - Tipo de reparto (opcional)
   * @returns {Promise<Object>}
   */
  async obtenerEstadisticas(fechaDesde, fechaHasta, tipo = null) {
    const estadisticas = await deliveryRepository.obtenerEstadisticas(fechaDesde, fechaHasta, tipo);
    
    return {
      totalRepartos: parseInt(estadisticas.totalRepartos) || 0,
      totalCantidad: parseFloat(estadisticas.totalCantidad) || 0,
      totalPolloFrito: parseFloat(estadisticas.totalPolloFrito) || 0,
      totalPolloFresco: parseFloat(estadisticas.totalPolloFresco) || 0
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

module.exports = new DeliveryService();

