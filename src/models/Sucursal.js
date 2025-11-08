const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Sucursal = sequelize.define('Sucursal', {
  id_sucursal: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_sucursal'
  },
  gerente: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El gerente es requerido'
      }
    }
  },
  ubicacion: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'sucursales',
  timestamps: false
});

module.exports = Sucursal;

