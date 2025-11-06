const orderService = require('../services/orderService');

class OrderController {
  /**
   * Obtener todos los pedidos
   * GET /api/orders
   */
  async obtenerTodos(req, res) {
    try {
      const { activo, estado, fecha, fechaDesde, fechaHasta, whatsapp, clienteNombre, numeroPedido, notificado } = req.query;
      const filtros = {};

      if (activo !== undefined) {
        filtros.activo = activo === 'true';
      }

      if (estado) {
        filtros.estado = estado;
      }

      if (fecha) {
        filtros.fecha = fecha;
      }

      if (fechaDesde) {
        filtros.fechaDesde = fechaDesde;
      }

      if (fechaHasta) {
        filtros.fechaHasta = fechaHasta;
      }

      if (whatsapp) {
        filtros.whatsapp = whatsapp;
      }

      if (clienteNombre) {
        filtros.clienteNombre = clienteNombre;
      }

      if (numeroPedido) {
        filtros.numeroPedido = numeroPedido;
      }

      if (notificado !== undefined) {
        filtros.notificado = notificado === 'true';
      }

      const pedidos = await orderService.obtenerTodos(filtros);

      res.json({
        success: true,
        data: pedidos,
        count: pedidos.length
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener pedidos',
        error: error.message
      });
    }
  }

  /**
   * Obtener un pedido por ID
   * GET /api/orders/:id
   */
  async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      const pedido = await orderService.obtenerPorId(id);

      res.json({
        success: true,
        data: pedido
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
   * Obtener pedido por número de pedido
   * GET /api/orders/numero/:numeroPedido
   */
  async obtenerPorNumeroPedido(req, res) {
    try {
      const { numeroPedido } = req.params;
      const pedido = await orderService.obtenerPorNumeroPedido(numeroPedido);

      res.json({
        success: true,
        data: pedido
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
   * Crear un nuevo pedido
   * POST /api/orders
   */
  async crear(req, res) {
    try {
      const datos = req.body;
      const enviarNotificacion = req.body.enviarNotificacion !== false; // Por defecto true
      
      const pedido = await orderService.crear(datos, enviarNotificacion);

      res.status(201).json({
        success: true,
        message: 'Pedido creado exitosamente',
        data: pedido
      });

    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Actualizar un pedido
   * PUT /api/orders/:id
   */
  async actualizar(req, res) {
    try {
      const { id } = req.params;
      const datos = req.body;
      const pedido = await orderService.actualizar(id, datos);

      res.json({
        success: true,
        message: 'Pedido actualizado exitosamente',
        data: pedido
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
   * Actualizar estado de un pedido
   * PUT /api/orders/:id/estado
   */
  async actualizarEstado(req, res) {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      if (!estado) {
        return res.status(400).json({
          success: false,
          message: 'El estado es requerido'
        });
      }

      const pedido = await orderService.actualizarEstado(id, estado);

      res.json({
        success: true,
        message: 'Estado del pedido actualizado exitosamente',
        data: pedido
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
   * Eliminar un pedido
   * DELETE /api/orders/:id
   */
  async eliminar(req, res) {
    try {
      const { id } = req.params;
      await orderService.eliminar(id);

      res.json({
        success: true,
        message: 'Pedido eliminado exitosamente'
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
   * Obtener pedidos pendientes de notificación
   * GET /api/orders/pendientes-notificacion
   */
  async obtenerPendientesNotificacion(req, res) {
    try {
      const pedidos = await orderService.obtenerPendientesNotificacion();

      res.json({
        success: true,
        data: pedidos,
        count: pedidos.length
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener pedidos pendientes',
        error: error.message
      });
    }
  }

  /**
   * Reenviar notificación de un pedido
   * POST /api/orders/:id/reenviar-notificacion
   */
  async reenviarNotificacion(req, res) {
    try {
      const { id } = req.params;
      const notificado = await orderService.reenviarNotificacion(id);

      res.json({
        success: true,
        message: notificado ? 'Notificación reenviada exitosamente' : 'No se pudo enviar la notificación',
        notificado
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
   * Obtener estadísticas de pedidos
   * GET /api/orders/estadisticas
   */
  async obtenerEstadisticas(req, res) {
    try {
      const { fechaDesde, fechaHasta } = req.query;
      const estadisticas = await orderService.obtenerEstadisticas(fechaDesde, fechaHasta);

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

  /**
   * Webhook para recibir pedidos desde WhatsApp
   * POST /api/orders/webhook/whatsapp
   */
  async webhookWhatsApp(req, res) {
    try {
      // Este endpoint está preparado para recibir webhooks de WhatsApp
      // La estructura dependerá del servicio que uses (Meta API, Twilio, etc.)
      
      const { body } = req;
      
      // Ejemplo de estructura esperada (ajustar según tu servicio)
      const mensaje = body.messages?.[0] || body;
      const numero = mensaje.from || mensaje.wa_id;
      const texto = mensaje.text?.body || mensaje.body || '';

      // Aquí implementarías la lógica para parsear el mensaje de WhatsApp
      // y crear el pedido automáticamente
      
      // Por ahora, solo respondemos que recibimos el webhook
      res.json({
        success: true,
        message: 'Webhook recibido',
        data: {
          numero,
          texto
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al procesar webhook',
        error: error.message
      });
    }
  }
}

module.exports = new OrderController();

