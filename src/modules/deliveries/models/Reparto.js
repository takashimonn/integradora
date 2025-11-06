const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/sequelize');

const Reparto = sequelize.define('Reparto', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'La fecha es requerida'
      },
      isDate: {
        msg: 'La fecha debe ser una fecha válida'
      }
    }
  },
  tipo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El tipo de reparto es requerido'
      },
      isIn: {
        args: [['pollo_frito', 'pollo_fresco']],
        msg: 'El tipo debe ser: pollo_frito o pollo_fresco'
      }
    },
    comment: 'pollo_frito: reparto a tiendas/tortillerías | pollo_fresco: entrega a domicilio'
  },
  destino: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El destino es requerido'
      },
      len: {
        args: [2, 200],
        msg: 'El destino debe tener entre 2 y 200 caracteres'
      }
    },
    comment: 'Nombre de tienda, tortillería, cliente o dirección'
  },
  cantidad: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      notNull: {
        msg: 'La cantidad es requerida'
      },
      min: {
        args: [0],
        msg: 'La cantidad no puede ser negativa'
      }
    },
    comment: 'Cantidad en kilos'
  },
  unidadMedida: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'kg',
    validate: {
      isIn: {
        args: [['kg', 'unidad', 'caja', 'paquete']],
        msg: 'Unidad de medida no válida'
      }
    },
    comment: 'Unidad de medida: kg, unidad, caja, paquete'
  },
  clienteFrecuente: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Indica si es un cliente frecuente (solo para pollo_fresco)'
  },
  direccion: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Dirección de entrega (para entregas a domicilio)'
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Teléfono de contacto del destino'
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notas adicionales sobre el reparto'
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
  tableName: 'repartos',
  timestamps: true,
  indexes: [
    {
      fields: ['fecha'],
      name: 'idx_reparto_fecha'
    },
    {
      fields: ['tipo'],
      name: 'idx_reparto_tipo'
    },
    {
      fields: ['destino'],
      name: 'idx_reparto_destino'
    }
  ]
});

module.exports = Reparto;

