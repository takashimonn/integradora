const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Reporte = sequelize.define('Reporte', {
  id_report: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_report'
  },
  id_sucursal: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'id_sucursal',
    references: {
      model: 'sucursales',
      key: 'id_sucursal'
    }
  },
  total_ventas: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'total_ventas'
  }
}, {
  tableName: 'reportes',
  timestamps: false
});

module.exports = Reporte;

