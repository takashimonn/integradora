const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/sequelize');

const Produccion = sequelize.define('Produccion', {
  id_produccion: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_produccion'
  },
  produccion_kg: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'produccion_kg'
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  devolucion: {
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
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'fecha',
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'produccion',
  timestamps: false
});

module.exports = Produccion;

