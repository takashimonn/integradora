const geminiService = require('./geminiService');
const clienteService = require('./clienteService');
const whatsappBusinessService = require('./whatsappBusinessService');
const orderService = require('../../orders/services/orderService');
const productRepository = require('../../products/repositories/productRepository');
const Usuario = require('../../../models/Usuario');
const Sucursal = require('../../../models/Sucursal');

class PedidoWhatsAppService {
  /**
   * Procesar mensaje de WhatsApp y crear pedido automáticamente
   * @param {string} mensaje - Mensaje del cliente
   * @param {string} telefono - Número de teléfono del cliente
   * @param {number} idSucursal - ID de la sucursal (opcional, se puede obtener del usuario)
   * @returns {Promise<Object>} - Pedido creado
   */
  async procesarYCrearPedido(mensaje, telefono, idSucursal = null) {
    try {
      // 1. Obtener productos disponibles primero
      const productosDisponibles = await productRepository.findAll();
      const productosJSON = productosDisponibles.map(p => ({
        id_producto: p.id_producto,
        nombre: p.descripcion || 'Producto',
        precio: parseFloat(p.precio)
      }));

      // 2. Verificar si el cliente existe
      const clienteExistente = await clienteService.obtenerClientePorTelefono(telefono);

      // 3. Procesar mensaje con IA (esto identifica si es un pedido válido)
      let datosPedido;
      try {
        datosPedido = await geminiService.procesarMensajePedido(
          mensaje,
          telefono,
          productosJSON
        );
      } catch (error) {
        // Si el mensaje no es un pedido válido, enviar mensaje amable y terminar
        if (error.message.includes('producto') || error.message.includes('pedido')) {
          console.log('Mensaje no es un pedido válido, ignorando...');
          try {
            await whatsappBusinessService.enviarMensaje(
              telefono,
              'Hola! 👋 Para hacer un pedido, por favor menciona los productos que deseas. Por ejemplo: "Quiero 2 pollos fritos"'
            );
          } catch (err) {
            console.warn('No se pudo enviar mensaje de respuesta:', err.message);
          }
          return {
            success: false,
            message: 'Mensaje no es un pedido válido',
            ignorado: true
          };
        }
        // Si es otro error, relanzarlo
        throw error;
      }

      // 4. Si es cliente nuevo, intentar extraer datos del mensaje y pedir los faltantes
      if (!clienteExistente) {
        const datosCliente = await geminiService.extraerDatosCliente(mensaje);
        const camposFaltantes = [];
        
        if (!datosCliente.nombre || datosCliente.nombre.trim() === '') {
          camposFaltantes.push('nombre');
        }
        
        if (!datosCliente.direccion || datosCliente.direccion.trim() === '') {
          camposFaltantes.push('direccion');
        }

        // Si faltan datos, preguntar pero NO bloquear el pedido
        if (camposFaltantes.length > 0) {
          let mensajePregunta = '👋 ¡Hola! Veo que es tu primer pedido. Necesito algunos datos:\n\n';
          if (camposFaltantes.includes('nombre')) {
            mensajePregunta += '• ¿Cuál es tu nombre?\n';
          }
          if (camposFaltantes.includes('direccion')) {
            mensajePregunta += '• ¿Cuál es tu dirección de entrega?\n';
          }
          mensajePregunta += '\nPuedes enviar esta información en tu siguiente mensaje. Por ahora, procesaré tu pedido.';
          
          try {
            await whatsappBusinessService.enviarMensaje(telefono, mensajePregunta);
          } catch (error) {
            console.warn('⚠️ No se pudo enviar mensaje de solicitud de datos:', error.message);
          }
        }

        // Crear cliente con los datos que tenemos (o con nombre temporal)
        const nombreCliente = datosCliente.nombre || `Cliente ${telefono.slice(-4)}`;
        await clienteService.buscarOCrearCliente(telefono, nombreCliente);
      }

      // 5. Validar método de pago
      if (!datosPedido.metodo_pago) {
        try {
          await whatsappBusinessService.enviarMensaje(
            telefono,
            '💰 Por favor, indica tu método de pago:\n\n• Efectivo\n• Tarjeta\n• Transferencia\n\nEjemplo: "Pago en efectivo"\n\nPuedes enviarlo en tu siguiente mensaje. Por ahora, procesaré tu pedido.'
          );
        } catch (error) {
          console.warn('⚠️ No se pudo enviar mensaje de solicitud de método de pago:', error.message);
        }
        // NO bloquear el pedido, usar efectivo por defecto
        datosPedido.metodo_pago = 'efectivo';
      }

      // 6. Buscar o crear cliente
      const cliente = await clienteService.buscarOCrearCliente(telefono);

      // 7. Mapear productos del pedido a IDs de productos reales
      const productosMapeados = await this.mapearProductos(
        datosPedido.productos,
        productosJSON
      );

      // 8. Determinar sucursal según tipo de productos
      let sucursalId = idSucursal;
      if (!sucursalId) {
        sucursalId = await this.determinarSucursalPorProductos(productosMapeados, mensaje);
      }

      // 9. Calcular total si no está correcto
      let total = datosPedido.total;
      if (!total || total === 0) {
        total = productosMapeados.reduce((sum, p) => {
          return sum + (p.precio * p.cantidad);
        }, 0);
      }

      // 10. Preparar datos del pedido según el modelo actual
      // El modelo Pedido tiene: id_cliente, id_sucursal, total, pago, pendiente
      const datosPedidoFinal = {
        id_cliente: cliente.id_cliente,
        id_sucursal: sucursalId,
        id_usuario_reportidor: null, // Pedido automático, sin usuario
        total: total,
        pago: datosPedido.metodo_pago === 'efectivo' ? total : 0,
        pendiente: datosPedido.metodo_pago === 'efectivo' ? 0 : total
        // Nota: Las notas, dirección, etc. se pueden guardar en una tabla separada o en logs
      };

      // 11. Crear pedido usando el repositorio directamente
      const Pedido = require('../../orders/models/Pedido');
      const PedidoProducto = require('../../../models/PedidoProducto');

      const pedido = await Pedido.create(datosPedidoFinal);

      // 12. Crear relaciones con productos
      for (const producto of productosMapeados) {
        await PedidoProducto.create({
          id_pedido: pedido.id_pedido,
          id_producto: producto.id_producto
        });
      }

      // 13. Enviar confirmación al cliente (opcional, no falla si WhatsApp Business API no está configurado)
      let mensajeEnviado = false;
      try {
        const mensajeConfirmacion = this.crearMensajeConfirmacion(pedido, cliente, productosMapeados, datosPedido);
        await whatsappBusinessService.enviarMensaje(telefono, mensajeConfirmacion);
        mensajeEnviado = true;
      } catch (error) {
        console.warn('No se pudo enviar mensaje de confirmación (WhatsApp Business API no configurado o error):', error.message);
        // No lanzamos el error, el pedido se creó exitosamente
      }

      return {
        pedido: pedido.toJSON(),
        cliente,
        productos: productosMapeados,
        mensaje_enviado: mensajeEnviado
      };
    } catch (error) {
      console.error('Error al procesar pedido:', error);
      
      // Enviar mensaje de error al cliente
      try {
        await whatsappBusinessService.enviarMensaje(
          telefono,
          'Lo sentimos, hubo un error al procesar tu pedido. Por favor, intenta de nuevo o contacta directamente.'
        );
      } catch (err) {
        console.error('Error al enviar mensaje de error:', err);
      }

      throw error;
    }
  }

  /**
   * Validar datos de cliente nuevo y preguntar información faltante
   * @param {string} mensaje - Mensaje del cliente
   * @param {string} telefono - Número de teléfono
   * @returns {Promise<Object>} - Objeto con información de datos faltantes
   */
  async validarDatosClienteNuevo(mensaje, telefono) {
    // Usar IA para extraer nombre y dirección del mensaje
    const datosExtraidos = await geminiService.extraerDatosCliente(mensaje);
    
    const camposFaltantes = [];
    let mensajePregunta = '👋 ¡Hola! Veo que es tu primer pedido. Necesito algunos datos:\n\n';

    // Validar nombre
    if (!datosExtraidos.nombre || datosExtraidos.nombre.trim() === '') {
      camposFaltantes.push('nombre');
      mensajePregunta += '• ¿Cuál es tu nombre?\n';
    }

    // Validar dirección (importante para entregas)
    if (!datosExtraidos.direccion || datosExtraidos.direccion.trim() === '') {
      camposFaltantes.push('direccion');
      mensajePregunta += '• ¿Cuál es tu dirección de entrega?\n';
    }

    if (camposFaltantes.length > 0) {
      mensajePregunta += '\nPor favor, envía un mensaje con esta información. Ejemplo:\n"Mi nombre es Juan Pérez, mi dirección es Calle Principal 123"';
      
      try {
        await whatsappBusinessService.enviarMensaje(telefono, mensajePregunta);
      } catch (error) {
        console.warn('⚠️ No se pudo enviar mensaje de solicitud de datos (token expirado o no configurado):', error.message);
        // No lanzamos el error, el proceso puede continuar
      }

      return {
        faltanDatos: true,
        campos: camposFaltantes
      };
    }

    // Si tenemos todos los datos, crear el cliente
    if (datosExtraidos.nombre) {
      await clienteService.buscarOCrearCliente(telefono, datosExtraidos.nombre);
    }

    return {
      faltanDatos: false,
      datos: datosExtraidos
    };
  }

  /**
   * Determinar sucursal según el tipo de productos del pedido
   * @param {Array} productosMapeados - Productos del pedido
   * @param {string} mensajeOriginal - Mensaje original del cliente
   * @returns {Promise<number>} - ID de la sucursal
   */
  async determinarSucursalPorProductos(productosMapeados, mensajeOriginal) {
    const mensajeLower = mensajeOriginal.toLowerCase();
    const nombresProductos = productosMapeados.map(p => p.nombre.toLowerCase()).join(' ');

    // Palabras clave para identificar tipo de producto
    const palabrasPolloFrito = ['pollo frito', 'pollo frito entero', 'pollo frito por piezas'];
    const palabrasPolloGranel = ['alitas', 'alita', 'pollo a granel', 'pollo normal', 'muslo', 'pierna', 'pechuga', 'mollejas', 'molleja'];

    // Verificar si hay productos de pollo frito
    const tienePolloFrito = palabrasPolloFrito.some(palabra => 
      mensajeLower.includes(palabra) || nombresProductos.includes(palabra)
    );

    // Verificar si hay productos a granel
    const tienePolloGranel = palabrasPolloGranel.some(palabra => 
      mensajeLower.includes(palabra) || nombresProductos.includes(palabra)
    );

    let nombreSucursal;
    if (tienePolloFrito) {
      nombreSucursal = 'Pollo Frito';
    } else if (tienePolloGranel) {
      nombreSucursal = 'Pollo a Granel';
    } else {
      // Por defecto, usar Pollo a Granel si no se puede determinar
      nombreSucursal = 'Pollo a Granel';
    }

    // Buscar sucursal por nombre
    const sucursal = await Sucursal.findOne({
      where: { nombre: nombreSucursal }
    });

    if (!sucursal) {
      console.warn(`⚠️ No se encontró sucursal con nombre "${nombreSucursal}", usando sucursal por defecto (ID: 1)`);
      return 1; // Fallback a sucursal 1
    }

    console.log(`✅ Sucursal asignada: ${sucursal.nombre} (ID: ${sucursal.id_sucursal})`);
    return sucursal.id_sucursal;
  }

  /**
   * Mapear productos mencionados a productos de la BD
   */
  async mapearProductos(productosMencionados, productosDisponibles) {
    const productosMapeados = [];

    for (const productoMencionado of productosMencionados) {
      // Si ya tiene ID, usarlo
      if (productoMencionado.id_producto) {
        const producto = productosDisponibles.find(p => p.id_producto === productoMencionado.id_producto);
        if (producto) {
          productosMapeados.push({
            id_producto: producto.id_producto,
            nombre: producto.nombre,
            cantidad: productoMencionado.cantidad || 1,
            precio: producto.precio
          });
          continue;
        }
      }

      // Buscar por nombre (búsqueda aproximada)
      const nombreBuscar = productoMencionado.nombre.toLowerCase();
      const productoEncontrado = productosDisponibles.find(p => {
        const nombreProducto = (p.descripcion || p.nombre || '').toLowerCase();
        return nombreProducto.includes(nombreBuscar) || nombreBuscar.includes(nombreProducto);
      });

      if (productoEncontrado) {
        productosMapeados.push({
          id_producto: productoEncontrado.id_producto,
          nombre: productoEncontrado.descripcion || productoEncontrado.nombre,
          cantidad: productoMencionado.cantidad || 1,
          precio: productoEncontrado.precio
        });
      } else {
        // Producto no encontrado, pero lo agregamos igual (sin ID)
        console.warn(`Producto no encontrado en BD: ${productoMencionado.nombre}`);
        productosMapeados.push({
          id_producto: null,
          nombre: productoMencionado.nombre,
          cantidad: productoMencionado.cantidad || 1,
          precio: 0 // Precio desconocido
        });
      }
    }

    return productosMapeados;
  }

  /**
   * Formatear notas del pedido
   */
  formatearNotas(datosPedido) {
    const notas = [];
    
    if (datosPedido.notas) {
      notas.push(datosPedido.notas);
    }
    
    if (datosPedido.direccion) {
      notas.push(`Dirección: ${datosPedido.direccion}`);
    }
    
    if (datosPedido.metodo_pago) {
      notas.push(`Método de pago: ${datosPedido.metodo_pago}`);
    }

    return notas.length > 0 ? notas.join(' | ') : null;
  }

  /**
   * Crear mensaje de confirmación para el cliente
   */
  crearMensajeConfirmacion(pedido, cliente, productos, datosPedido = {}) {
    const listaProductos = productos
      .map(p => `• ${p.nombre} x${p.cantidad} - $${(p.precio * p.cantidad).toFixed(2)}`)
      .join('\n');

    const metodoPago = datosPedido.metodo_pago || 'No especificado';
    const direccion = datosPedido.direccion ? `\n📍 *Dirección:* ${datosPedido.direccion}` : '';

    return `✅ *Pedido Confirmado*

Hola ${cliente.nombre}!

Tu pedido #${pedido.id_pedido} ha sido registrado:

${listaProductos}

*Total: $${parseFloat(pedido.total).toFixed(2)}*
💰 *Método de pago:* ${metodoPago}${direccion}

📢 *Tu pedido ha sido notificado a la tienda.*

Te contactaremos pronto para confirmar la entrega. ¡Gracias por tu preferencia! 🐔`;
  }
}

module.exports = new PedidoWhatsAppService();

