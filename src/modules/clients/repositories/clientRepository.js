const Cliente = require('../../../models/Cliente');
const { Op } = require('sequelize');

class ClientRepository {
  /**
   * Obtener todos los clientes
   * @param {Object} filtros - Filtros para la búsqueda
   * @returns {Promise<Array>}
   */
  async findAll(filtros = {}) {
    const where = {};

    // Búsqueda por nombre (LIKE)
    if (filtros.nombre) {
      where.nombre = {
        [Op.like]: `%${filtros.nombre}%`
      };
    }

    // Búsqueda por nombre_tienda (LIKE)
    if (filtros.nombre_tienda) {
      where.nombre_tienda = {
        [Op.like]: `%${filtros.nombre_tienda}%`
      };
    }

    // Búsqueda por teléfono
    if (filtros.telefono) {
      where.telefono = {
        [Op.like]: `%${filtros.telefono}%`
      };
    }

    return await Cliente.findAll({
      where,
      order: [['nombre', 'ASC']]
    });
  }

  /**
   * Obtener un cliente por ID
   * @param {number} id - ID del cliente
   * @returns {Promise<Cliente|null>}
   */
  async findById(id) {
    return await Cliente.findByPk(id);
  }

  /**
   * Crear un nuevo cliente
   * @param {Object} datos - Datos del cliente
   * @returns {Promise<Cliente>}
   */
  async create(datos) {
    return await Cliente.create(datos);
  }

  /**
   * Actualizar un cliente
   * @param {number} id - ID del cliente
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Cliente>}
   */
  async update(id, datos) {
    const cliente = await Cliente.findByPk(id);
    
    if (!cliente) {
      throw new Error('Cliente no encontrado');
    }

    await cliente.update(datos);
    return cliente.reload();
  }

  /**
   * Eliminar un cliente
   * @param {number} id - ID del cliente
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const cliente = await Cliente.findByPk(id);
    
    if (!cliente) {
      throw new Error('Cliente no encontrado');
    }

    await cliente.destroy();
    return true;
  }
}

module.exports = new ClientRepository();

