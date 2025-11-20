const productService = require('../services/productService');
class ProductController {
  async obtenerTodos(req, res) {
    try {
      const filtros = {};
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
  async crear(req, res) {
    try {
      const { descripcion, precio, unidad_medida } = req.body;
      
      if (!precio || precio === '' || precio === null || precio === undefined) {
        return res.status(400).json({
          success: false,
          message: 'El precio es requerido'
        });
      }

      const precioNum = parseFloat(precio);
      if (isNaN(precioNum) || precioNum < 0) {
        return res.status(400).json({
          success: false,
          message: 'El precio debe ser un número válido mayor o igual a 0'
        });
      }

      const datos = {
        descripcion: descripcion || null,
        precio: precioNum,
        unidad_medida: unidad_medida || null
      };

      const imagenPath = req.file ? `/uploads/products/${req.file.filename}` : null;
      
      const producto = await productService.crear(datos, imagenPath);
      res.status(201).json({
        success: true,
        message: 'Producto creado exitosamente',
        data: producto
      });
    } catch (error) {
      console.error('Error al crear producto:', error);
      const statusCode = error.message.includes('requerido') || error.message.includes('inválido') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Datos inválidos. Verifica que todos los campos estén correctos.',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
  async actualizar(req, res) {
    try {
      const { id } = req.params;
      const datos = req.body;
      const imagenPath = req.file ? `/uploads/products/${req.file.filename}` : null;
      const producto = await productService.actualizar(id, datos, imagenPath);
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
