const productService = require('../services/productService');

class ProductController {
  /**
   * Obtener todos los productos
   * GET /api/products
   */
  async obtenerTodos(req, res) {
    try {
      const { activo } = req.query;
      const filtros = {};

      if (activo !== undefined) {
        filtros.activo = activo === 'true';
      }

      const productos = await productService.obtenerTodos(filtros);

      res.json({
        success: true,
        data: productos,
        count: productos.length
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener productos',
        error: error.message
      });
    }
  }

  /**
   * Obtener un producto por ID
   * GET /api/products/:id
   */
  async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      const producto = await productService.obtenerPorId(id);

      res.json({
        success: true,
        data: producto
      });

    } catch (error) {
      const statusCode = error.message.includes('no encontrado') ? 404 : 400;
      
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Crear un nuevo producto
   * POST /api/products
   */
  async crear(req, res) {
    try {
      const datos = req.body;
      const fotoPath = req.file ? `/uploads/products/${req.file.filename}` : null;

      const producto = await productService.crear(datos, fotoPath);

      res.status(201).json({
        success: true,
        message: 'Producto creado exitosamente',
        data: producto
      });

    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Actualizar un producto
   * PUT /api/products/:id
   */
  async actualizar(req, res) {
    try {
      const { id } = req.params;
      const datos = req.body;
      const fotoPath = req.file ? `/uploads/products/${req.file.filename}` : null;

      const producto = await productService.actualizar(id, datos, fotoPath);

      res.json({
        success: true,
        message: 'Producto actualizado exitosamente',
        data: producto
      });

    } catch (error) {
      const statusCode = error.message.includes('no encontrado') ? 404 : 400;
      
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Eliminar un producto
   * DELETE /api/products/:id
   */
  async eliminar(req, res) {
    try {
      const { id } = req.params;
      await productService.eliminar(id);

      res.json({
        success: true,
        message: 'Producto eliminado exitosamente'
      });

    } catch (error) {
      const statusCode = error.message.includes('no encontrado') ? 404 : 400;
      
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new ProductController();

