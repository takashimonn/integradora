const productRepository = require('../repositories/productRepository');
const { ValidationError, UniqueConstraintError } = require('sequelize');
const fs = require('fs');
const path = require('path');

class ProductService {
  /**
   * Obtener todos los productos
   * @param {Object} filtros - Filtros opcionales
   * @returns {Promise<Array>}
   */
  async obtenerTodos(filtros = {}) {
    const productos = await productRepository.findAll(filtros);
    return productos.map(p => p.toJSON());
  }

  /**
   * Obtener un producto por ID
   * @param {number} id - ID del producto
   * @returns {Promise<Object>}
   */
  async obtenerPorId(id) {
    if (!id || isNaN(id)) {
      throw new Error('ID de producto inválido');
    }

    const producto = await productRepository.findById(id);

    if (!producto) {
      throw new Error('Producto no encontrado');
    }

    return producto.toJSON();
  }

  /**
   * Crear un nuevo producto
   * @param {Object} datos - Datos del producto
   * @param {string} fotoPath - Ruta de la foto (opcional)
   * @returns {Promise<Object>}
   */
  async crear(datos, fotoPath = null) {
    const { descripcion, precio, unidad_medida } = datos;

    // Validaciones básicas
    if (!precio) {
      throw new Error('El precio es requerido');
    }

    if (precio < 0) {
      throw new Error('El precio no puede ser negativo');
    }

    // Preparar datos según el esquema de la BD
    const datosProducto = {
      descripcion: descripcion || null,
      precio: parseFloat(precio),
      unidad_medida: unidad_medida || null
    };

    // Si hay imagen, agregar la ruta
    if (fotoPath) {
      datosProducto.imagen = fotoPath;
    }

    try {
      const producto = await productRepository.create(datosProducto);
      return producto.toJSON();
    } catch (error) {
      this.manejarError(error);
    }
  }

  /**
   * Actualizar un producto
   * @param {number} id - ID del producto
   * @param {Object} datos - Datos a actualizar
   * @param {string} fotoPath - Nueva ruta de foto (opcional)
   * @returns {Promise<Object>}
   */
  async actualizar(id, datos, fotoPath = null) {
    if (!id || isNaN(id)) {
      throw new Error('ID de producto inválido');
    }

    const { descripcion, precio, unidad_medida } = datos;

    // Validaciones
    if (precio !== undefined && precio < 0) {
      throw new Error('El precio no puede ser negativo');
    }

    // Preparar datos a actualizar según el esquema de la BD
    const datosActualizar = {};
    
    if (descripcion !== undefined) datosActualizar.descripcion = descripcion;
    if (precio !== undefined) datosActualizar.precio = parseFloat(precio);
    if (unidad_medida !== undefined) datosActualizar.unidad_medida = unidad_medida;

    // Si hay nueva imagen
    if (fotoPath) {
      // Obtener producto actual para eliminar imagen anterior si existe
      const productoActual = await productRepository.findById(id);
      if (productoActual && productoActual.imagen) {
        this.eliminarFoto(productoActual.imagen);
      }
      datosActualizar.imagen = fotoPath;
    }

    try {
      const producto = await productRepository.update(id, datosActualizar);
      return producto.toJSON();
    } catch (error) {
      if (error.message === 'Producto no encontrado') {
        throw error;
      }
      this.manejarError(error);
    }
  }

  /**
   * Eliminar un producto (soft delete)
   * @param {number} id - ID del producto
   * @returns {Promise<boolean>}
   */
  async eliminar(id) {
    if (!id || isNaN(id)) {
      throw new Error('ID de producto inválido');
    }

    try {
      await productRepository.delete(id);
      return true;
    } catch (error) {
      if (error.message === 'Producto no encontrado') {
        throw error;
      }
      throw new Error('Error al eliminar el producto');
    }
  }

  /**
   * Eliminar foto de un producto
   * @param {string} fotoPath - Ruta de la foto
   */
  eliminarFoto(fotoPath) {
    if (!fotoPath) return;

    try {
      // Si la imagen está en el sistema de archivos, eliminarla
      if (fotoPath.startsWith('/uploads') || fotoPath.startsWith('uploads')) {
        const rutaCompleta = path.join(__dirname, '../../../', fotoPath);
        if (fs.existsSync(rutaCompleta)) {
          fs.unlinkSync(rutaCompleta);
        }
      }
    } catch (error) {
      console.error('Error al eliminar imagen:', error);
      // No lanzamos error, solo logueamos
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

    if (error instanceof UniqueConstraintError) {
      throw new Error('Ya existe un producto con estos datos');
    }

    throw error;
  }
}

module.exports = new ProductService();

