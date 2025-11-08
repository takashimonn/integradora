const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const PedidoProducto = sequelize.define('PedidoProducto', {
  id_pedido_producto: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_pedido_producto'
  },
  id_pedido: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_pedido',
    references: {
      model: 'pedidos',
      key: 'id_pedido'
    },
    validate: {
      notNull: {
        msg: 'El pedido es requerido'
      }
    }
  },
  id_producto: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_producto',
    references: {
      model: 'productos',
      key: 'id_producto'
    },
    validate: {
      notNull: {
        msg: 'El producto es requerido'
      }
    }
  }
}, {
  tableName: 'pedidos_productos',
  timestamps: false
});

module.exports = PedidoProducto;

