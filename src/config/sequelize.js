const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuración de Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Función para probar la conexión
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log(' Conexión a MySQL con Sequelize exitosa');
    return true;
  } catch (error) {
    console.error(' Error al conectar con Sequelize:', error.message);
    return false;
  }
}

// Sincronizar modelos con la base de datos (solo en desarrollo)
async function syncDatabase(force = false) {
  try {
    await sequelize.sync({ force });
    console.log(' Base de datos sincronizada');
  } catch (error) {
    console.error(' Error al sincronizar base de datos:', error.message);
  }
}

module.exports = {
  sequelize,
  testConnection,
  syncDatabase
};

