const clientRepository = require('../repositories/clientRepository');
const { ValidationError } = require('sequelize');

class ClientService {
  /**
   * Obtener todos los clientes
   * @param {Object} filtros - Filtros opcionales
   * @returns {Promise<Array>}
   */
  async obtenerTodos(filtros = {}) {
    const clientes = await clientRepository.findAll(filtros);
    return clientes.map(c => c.toJSON());
  }

  /**
   * Obtener un cliente por ID
   * @param {number} id - ID del cliente
   * @returns {Promise<Object>}
   */
  async obtenerPorId(id) {
    if (!id || isNaN(id)) {
      throw new Error('ID de cliente inválido');
    }

    const cliente = await clientRepository.findById(id);

    if (!cliente) {
      throw new Error('Cliente no encontrado');
    }

    return cliente.toJSON();
  }

  /**
   * Crear un nuevo cliente
   * @param {Object} datos - Datos del cliente
   * @returns {Promise<Object>}
   */
  async crear(datos) {
    const { nombre, nombre_tienda, telefono } = datos;

    // Validaciones básicas
    if (!nombre) {
      throw new Error('El nombre es requerido');
    }

    // Preparar datos
    const datosCliente = {
      nombre,
      nombre_tienda: nombre_tienda || null,
      telefono: telefono || null
    };

    try {
      const cliente = await clientRepository.create(datosCliente);
      return cliente.toJSON();
    } catch (error) {
      this.manejarError(error);
    }
  }

  /**
   * Actualizar un cliente
   * @param {number} id - ID del cliente
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>}
   */
  async actualizar(id, datos) {
    if (!id || isNaN(id)) {
      throw new Error('ID de cliente inválido');
    }

    const { nombre, nombre_tienda, telefono } = datos;

    // Preparar datos a actualizar
    const datosActualizar = {};
    
    if (nombre !== undefined) datosActualizar.nombre = nombre;
    if (nombre_tienda !== undefined) datosActualizar.nombre_tienda = nombre_tienda;
    if (telefono !== undefined) datosActualizar.telefono = telefono;

    try {
      const cliente = await clientRepository.update(id, datosActualizar);
      return cliente.toJSON();
    } catch (error) {
      if (error.message === 'Cliente no encontrado') {
        throw error;
      }
      this.manejarError(error);
    }
  }

  /**
   * Eliminar un cliente
   * @param {number} id - ID del cliente
   * @returns {Promise<boolean>}
   */
  async eliminar(id) {
    if (!id || isNaN(id)) {
      throw new Error('ID de cliente inválido');
    }

    try {
      await clientRepository.delete(id);
      return true;
    } catch (error) {
      if (error.message === 'Cliente no encontrado') {
        throw error;
      }
      throw new Error('Error al eliminar el cliente');
    }
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

module.exports = new ClientService();

