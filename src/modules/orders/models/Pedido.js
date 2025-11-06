const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/sequelize');

const Pedido = sequelize.define('Pedido', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  numeroPedido: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Número único de pedido (ej: PED-2024-001)'
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    validate: {
      isDate: {
        msg: 'La fecha debe ser una fecha válida'
      }
    }
  },
  hora: {
    type: DataTypes.TIME,
    allowNull: true,
    comment: 'Hora del pedido'
  },
  clienteNombre: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El nombre del cliente es requerido'
      },
      len: {
        args: [2, 200],
        msg: 'El nombre debe tener entre 2 y 200 caracteres'
      }
    }
  },
  whatsapp: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El número de WhatsApp es requerido'
      }
    },
    comment: 'Número de WhatsApp del cliente (formato: 521234567890)'
  },
  direccion: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Dirección de entrega (si aplica)'
  },
  productos: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'JSON con los productos del pedido',
    get() {
      const rawValue = this.getDataValue('productos');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('productos', JSON.stringify(value));
    }
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'El total no puede ser negativo'
      }
    },
    comment: 'Total del pedido'
  },
  estado: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'pendiente',
    validate: {
      isIn: {
        args: [['pendiente', 'confirmado', 'en_preparacion', 'listo', 'en_camino', 'entregado', 'cancelado']],
        msg: 'Estado inválido'
      }
    },
    comment: 'Estados: pendiente, confirmado, en_preparacion, listo, en_camino, entregado, cancelado'
  },
  metodoPago: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      isIn: {
        args: [['efectivo', 'transferencia', 'tarjeta', null]],
        msg: 'Método de pago inválido'
      }
    },
    comment: 'Método de pago: efectivo, transferencia, tarjeta'
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notas adicionales del pedido'
  },
  notificado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Indica si se envió notificación a encargados'
  },
  fechaNotificacion: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha/hora en que se envió la notificación'
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'pedidos',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['numeroPedido'],
      name: 'unique_numero_pedido'
    },
    {
      fields: ['fecha'],
      name: 'idx_pedido_fecha'
    },
    {
      fields: ['estado'],
      name: 'idx_pedido_estado'
    },
    {
      fields: ['whatsapp'],
      name: 'idx_pedido_whatsapp'
    }
  ],
  hooks: {
    beforeCreate: async (pedido) => {
      // Generar número de pedido automático si no se proporciona
      if (!pedido.numeroPedido) {
        const fecha = new Date();
        const año = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const dia = String(fecha.getDate()).padStart(2, '0');
        
        // Contar pedidos del día para generar secuencial
        const count = await Pedido.count({
          where: {
            fecha: pedido.fecha || fecha.toISOString().split('T')[0]
          }
        });
        
        const secuencial = String(count + 1).padStart(4, '0');
        pedido.numeroPedido = `PED-${año}${mes}${dia}-${secuencial}`;
      }

      // Establecer hora actual si no se proporciona
      if (!pedido.hora) {
        const now = new Date();
        pedido.hora = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      }
    }
  }
});

module.exports = Pedido;

