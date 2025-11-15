const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/sequelize');

const Sincronizacion = sequelize.define('Sincronizacion', {
  id_sincronizacion: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_sincronizacion'
  },
  id_sucursal: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_sucursal',
    references: {
      model: 'sucursales',
      key: 'id_sucursal'
    },
    unique: true, // Una sucursal solo puede tener un flag a la vez
    comment: 'ID de la sucursal que necesita sincronización'
  },
  pendiente: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si hay una sincronización pendiente'
  },
  ultima_sincronizacion: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'ultima_sincronizacion',
    comment: 'Fecha y hora de la última sincronización exitosa'
  }
}, {
  tableName: 'sincronizaciones',
  timestamps: false
});

module.exports = Sincronizacion;

