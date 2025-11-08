const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Ubicacion = sequelize.define('Ubicacion', {
  id_ubicacion: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_ubicacion'
  },
  calle: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'La calle es requerida'
      }
    }
  },
  numero: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  colonia: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  cp: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  id_cliente: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'id_cliente',
    references: {
      model: 'clientes',
      key: 'id_cliente'
    }
  }
}, {
  tableName: 'ubicaciones',
  timestamps: false
});

module.exports = Ubicacion;

