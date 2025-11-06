const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/sequelize');

const Producto = sequelize.define('Producto', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El nombre del producto es requerido'
      },
      len: {
        args: [2, 200],
        msg: 'El nombre debe tener entre 2 y 200 caracteres'
      }
    }
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
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
  unidadMedida: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'unidad',
    validate: {
      notEmpty: {
        msg: 'La unidad de medida es requerida'
      },
      isIn: {
        args: [['unidad', 'kg', 'g', 'litro', 'ml', 'm', 'cm', 'caja', 'paquete']],
        msg: 'Unidad de medida no válida'
      }
    }
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: {
        args: [0],
        msg: 'El stock no puede ser negativo'
      }
    }
  },
  foto: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL o ruta de la imagen del producto'
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
  tableName: 'productos',
  timestamps: true
});

module.exports = Producto;

