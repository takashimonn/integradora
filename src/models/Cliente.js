const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Cliente = sequelize.define('Cliente', {
  id_cliente: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_cliente'
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El nombre es requerido'
      }
    }
  },
  nombre_tienda: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'nombre_tienda'
  },
  telefono: {
    type: DataTypes.STRING(15),
    allowNull: true
  }
}, {
  tableName: 'clientes',
  timestamps: false
});

module.exports = Cliente;

