const Producto = require('../models/Producto');

class ProductRepository {
  /**
   * Obtener todos los productos
   * @param {Object} filtros - Filtros para la búsqueda (activo, etc.)
   * @returns {Promise<Array>}
   */
  async findAll(filtros = {}) {
    const where = {};
    
    if (filtros.activo !== undefined) {
      where.activo = filtros.activo;
    }

    return await Producto.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Obtener un producto por ID
   * @param {number} id - ID del producto
   * @returns {Promise<Producto|null>}
   */
  async findById(id) {
    return await Producto.findByPk(id);
  }

  /**
   * Crear un nuevo producto
   * @param {Object} datos - Datos del producto
   * @returns {Promise<Producto>}
   */
  async create(datos) {
    return await Producto.create(datos);
  }

  /**
   * Actualizar un producto
   * @param {number} id - ID del producto
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Producto>}
   */
  async update(id, datos) {
    const producto = await Producto.findByPk(id);
    
    if (!producto) {
      throw new Error('Producto no encontrado');
    }

    await producto.update(datos);
    return producto.reload();
  }

  /**
   * Eliminar un producto (soft delete - desactivar)
   * @param {number} id - ID del producto
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const producto = await Producto.findByPk(id);
    
    if (!producto) {
      throw new Error('Producto no encontrado');
    }

    // Soft delete: solo desactivamos
    await producto.update({ activo: false });
    return true;
  }

  /**
   * Eliminar un producto físicamente de la BD
   * @param {number} id - ID del producto
   * @returns {Promise<boolean>}
   */
  async hardDelete(id) {
    const producto = await Producto.findByPk(id);
    
    if (!producto) {
      throw new Error('Producto no encontrado');
    }

    await producto.destroy();
    return true;
  }
}

module.exports = new ProductRepository();

