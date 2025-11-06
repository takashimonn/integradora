const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/sequelize');

const Produccion = sequelize.define('Produccion', {
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
  charolasCuartoKilo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: {
        args: [0],
        msg: 'Las charolas de 1/4 kg no pueden ser negativas'
      }
    },
    comment: 'Cantidad de charolas de 0.25 kg (1/4 kg)'
  },
  charolasMedioKilo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: {
        args: [0],
        msg: 'Las charolas de 1/2 kg no pueden ser negativas'
      }
    },
    comment: 'Cantidad de charolas de 0.5 kg (1/2 kg)'
  },
  domosUnKilo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: {
        args: [0],
        msg: 'Los domos de 1 kg no pueden ser negativos'
      }
    },
    comment: 'Cantidad de domos de 1 kg'
  },
  totalKilos: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Total de kilos calculado automáticamente'
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notas adicionales sobre la producción del día'
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
  tableName: 'producciones',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['fecha'],
      name: 'unique_fecha_produccion'
    }
  ],
  hooks: {
    // Calcular total de kilos antes de crear o actualizar
    beforeCreate: async (produccion) => {
      produccion.totalKilos = calcularTotalKilos(
        produccion.charolasCuartoKilo,
        produccion.charolasMedioKilo,
        produccion.domosUnKilo
      );
    },
    beforeUpdate: async (produccion) => {
      if (produccion.changed('charolasCuartoKilo') || 
          produccion.changed('charolasMedioKilo') || 
          produccion.changed('domosUnKilo')) {
        produccion.totalKilos = calcularTotalKilos(
          produccion.charolasCuartoKilo,
          produccion.charolasMedioKilo,
          produccion.domosUnKilo
        );
      }
    }
  }
});

// Función para calcular el total de kilos
function calcularTotalKilos(cuartos, medios, unKilo) {
  const kilosCuartos = (cuartos || 0) * 0.25;
  const kilosMedios = (medios || 0) * 0.5;
  const kilosUnKilo = (unKilo || 0) * 1;
  return parseFloat((kilosCuartos + kilosMedios + kilosUnKilo).toFixed(2));
}

module.exports = Produccion;

