const { Sequelize } = require('sequelize');

// Solo cargar dotenv en desarrollo local (no en Vercel)
if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Railway puede proporcionar DATABASE_URL o variables individuales
let sequelizeConfig;

if (process.env.DATABASE_URL) {
  // Si Railway proporciona DATABASE_URL (formato: mysql://user:pass@host:port/dbname)
  sequelizeConfig = {
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: false
      } : false,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  };
} else {
  // Variables individuales (DB_HOST, DB_USER, etc.)
  const isRailway = process.env.DB_HOST && process.env.DB_HOST.includes('railway') || process.env.DB_HOST && process.env.DB_HOST.includes('rlwy.net');
  
  sequelizeConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: false,
    protocol: 'tcp',
    dialectOptions: {
      // Railway puede requerir SSL o conexiones específicas
      ssl: (process.env.DB_SSL === 'true' || isRailway) ? {
        rejectUnauthorized: false
      } : false,
      connectTimeout: 60000, // 60 segundos para Railway
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 60000, // Aumentado a 60 segundos para Railway
      idle: 10000
    },
    // Timeout para conexión inicial
    connectTimeout: 60000,
  };
}

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, sequelizeConfig)
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      sequelizeConfig
    );

// Función para probar la conexión
async function testConnection() {
  try {
    console.log('🔌 Intentando conectar a la base de datos...');
    console.log(`   Host: ${sequelize.config.host || 'N/A'}`);
    console.log(`   Database: ${sequelize.config.database || 'N/A'}`);
    
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos exitosa');
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error.message);
    console.error('   Detalles:', {
      host: sequelize.config.host,
      database: sequelize.config.database,
      port: sequelize.config.port,
      errorCode: error.code,
      errorName: error.name
    });
    return false;
  }
}

// Sincronizar modelos con la base de datos
async function syncDatabase(force = false) {
  try {
    await sequelize.sync({ force, alter: !force });
  } catch (error) {
    console.error('Error al sincronizar base de datos:', error.message);
  }
}

module.exports = {
  sequelize,
  testConnection,
  syncDatabase
};