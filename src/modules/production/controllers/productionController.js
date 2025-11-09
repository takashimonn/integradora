const productionService = require('../services/productionService');

class ProductionController {
  /**
   * Obtener todos los registros de producción
   * GET /api/production
   */
  async obtenerTodos(req, res) {
    try {
      const { activo, fecha, fechaDesde, fechaHasta, todas } = req.query;
      const filtros = {};

      if (activo !== undefined) {
        filtros.activo = activo === 'true';
      }

      // Si se especifica 'todas=true', mostrar todas las producciones
      // Si no, por defecto mostrar solo las del día de hoy
      if (todas !== 'true') {
        // Si no se especifica una fecha, usar la fecha de hoy
        if (!fecha && !fechaDesde && !fechaHasta) {
          const fechaHoy = new Date().toISOString().split('T')[0];
          filtros.fecha = fechaHoy;
        } else {
          // Si se especifica una fecha, usar esa
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
        // Si todas=true, aplicar filtros de fecha si se especifican
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

  /**
   * Obtener un registro por ID
   * GET /api/production/:id
   */
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

  /**
   * Obtener registro por fecha
   * GET /api/production/fecha/:fecha
   */
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

  /**
   * Crear un nuevo registro de producción
   * POST /api/production
   */
  async crear(req, res) {
    try {
      const datos = req.body;
      const registro = await productionService.crear(datos);

      res.status(201).json({
        success: true,
        message: 'Registro de producción creado exitosamente',
        data: registro
      });

    } catch (error) {
      const statusCode = error.message.includes('Ya existe') ? 409 : 400;
      
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Actualizar un registro de producción
   * PUT /api/production/:id
   */
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

  /**
   * Eliminar un registro de producción
   * DELETE /api/production/:id
   */
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

  /**
   * Obtener estadísticas de producción
   * GET /api/production/estadisticas
   */
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

