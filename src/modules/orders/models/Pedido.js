const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/sequelize');

const Pedido = sequelize.define('Pedido', {
  id_pedido: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_pedido'
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  id_cliente: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_cliente',
    references: {
      model: 'clientes',
      key: 'id_cliente'
    },
    validate: {
      notNull: {
        msg: 'El cliente es requerido'
      }
    }
  },
  id_usuario_reportidor: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'id_usuario_reportidor',
    references: {
      model: 'usuarios',
      key: 'id_usuario'
    }
  },
  id_sucursal: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_sucursal',
    references: {
      model: 'sucursales',
      key: 'id_sucursal'
    },
    validate: {
      notNull: {
        msg: 'La sucursal es requerida'
      }
    }
  },
  pago: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  pendiente: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  }
}, {
  tableName: 'pedidos',
  timestamps: false
});

module.exports = Pedido;

