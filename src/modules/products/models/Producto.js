const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/sequelize');

const Producto = sequelize.define('Producto', {
  id_producto: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_producto'
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  unidad_medida: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'unidad_medida'
  },
  precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      notNull: {
        msg: 'El precio es requerido'
      },
      min: {
        args: [0],
        msg: 'El precio no puede ser negativo'
      }
    }
  },
  imagen: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL o ruta de la imagen del producto'
  }
}, {
  tableName: 'productos',
  timestamps: false
});

module.exports = Producto;

