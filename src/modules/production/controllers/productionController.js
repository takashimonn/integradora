const productionService = require('../services/productionService');
class ProductionController {
  async obtenerTodos(req, res) {
    try {
      const { activo, fecha, fechaDesde, fechaHasta, todas } = req.query;
      const filtros = {};
      if (activo !== undefined) {
        filtros.activo = activo === 'true';
      }
      if (todas !== 'true') {
        if (!fecha && !fechaDesde && !fechaHasta) {
          const fechaHoy = new Date().toISOString().split('T')[0];
          filtros.fecha = fechaHoy;
        } else {
          if (fecha) {
            filtros.fecha = fecha;
          }
          if (fechaDesde) {
            filtros.fechaDesde = fechaDesde;
          }
          if (fechaHasta) {
            filtros.fechaHasta = fechaHasta;
          }
        }
      } else {
        if (fecha) {
          filtros.fecha = fecha;
        }
        if (fechaDesde) {
          filtros.fechaDesde = fechaDesde;
        }
        if (fechaHasta) {
          filtros.fechaHasta = fechaHasta;
        }
      }
      const registros = await productionService.obtenerTodos(filtros);
      res.json({
        success: true,
        data: registros,
        count: registros.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener registros de producción',
        error: error.message
      });
    }
  }
  async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      const registro = await productionService.obtenerPorId(id);
      res.json({
        success: true,
        data: registro
      });
    } catch (error) {
      const statusCode = error.message.includes('no encontrado') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }
  async obtenerPorFecha(req, res) {
    try {
      const { fecha } = req.params;
      const registro = await productionService.obtenerPorFecha(fecha);
      if (!registro) {
        return res.status(404).json({
          success: false,
          message: 'No se encontró registro de producción para esta fecha'
        });
      }
      res.json({
        success: true,
        data: registro
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  async crear(req, res) {
    try {
      const { produccion_kg, total, devolucion, id_cliente, fecha } = req.body;
      
      if (!id_cliente) {
        return res.status(400).json({
          success: false,
          message: 'El cliente es requerido'
        });
      }

      const datos = {
        produccion_kg: produccion_kg !== undefined && produccion_kg !== null && produccion_kg !== '' ? parseFloat(produccion_kg) : null,
        total: total !== undefined && total !== null && total !== '' ? parseFloat(total) : null,
        devolucion: devolucion !== undefined && devolucion !== null && devolucion !== '' ? parseFloat(devolucion) : null,
        id_cliente: parseInt(id_cliente),
        fecha: fecha || new Date().toISOString().split('T')[0]
      };

      const registro = await productionService.crear(datos);
      res.status(201).json({
        success: true,
        message: 'Registro de producción creado exitosamente',
        data: registro
      });
    } catch (error) {
      const statusCode = error.message.includes('Ya existe') ? 409 : 
                        error.message.includes('requerido') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
  async actualizar(req, res) {
    try {
      const { id } = req.params;
      const datos = req.body;
      const registro = await productionService.actualizar(id, datos);
      res.json({
        success: true,
        message: 'Registro de producción actualizado exitosamente',
        data: registro
      });
    } catch (error) {
      const statusCode = error.message.includes('no encontrado') ? 404 : 
                        error.message.includes('Ya existe') ? 409 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }
  async eliminar(req, res) {
    try {
      const { id } = req.params;
      await productionService.eliminar(id);
      res.json({
        success: true,
        message: 'Registro de producción eliminado exitosamente'
      });
    } catch (error) {
      const statusCode = error.message.includes('no encontrado') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }
  async obtenerEstadisticas(req, res) {
    try {
      const { fechaDesde, fechaHasta } = req.query;
      const estadisticas = await productionService.obtenerEstadisticas(fechaDesde, fechaHasta);
      res.json({
        success: true,
        data: estadisticas
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas',
        error: error.message
      });
    }
  }
}
module.exports = new ProductionController();
