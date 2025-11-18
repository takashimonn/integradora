const { Sequelize } = require('sequelize');

// Cargar dotenv solo en desarrollo local
if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Determinar configuración según el entorno
let sequelizeConfig;

// Si Railway proporciona DATABASE_URL (mysql://user:pass@host:port/db)
if (process.env.DATABASE_URL) {
  sequelizeConfig = {
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true'
        ? { rejectUnauthorized: false }
        : false,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    }
  };
} else {
  // Variables individuales (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)
  const isRailway = process.env.DB_HOST &&
    (process.env.DB_HOST.includes('railway') || process.env.DB_HOST.includes('rlwy.net'));

  sequelizeConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: false,
    protocol: 'tcp',
    dialectOptions: {
      ssl: (process.env.DB_SSL === 'true' || isRailway)
        ? { rejectUnauthorized: false }
        : false,
      connectTimeout: 60000, // para Railway
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 60000,
      idle: 10000
    },
    connectTimeout: 60000,
  };
}

// Advertencia si faltan variables
if (!process.env.DATABASE_URL &&
    (!process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_PASSWORD)) {

  console.warn('⚠️  Advertencia: Variables de entorno para la base de datos incompletas.');
  console.warn('    Requiere DATABASE_URL ó (DB_NAME, DB_USER, DB_PASSWORD).');
}

// Crear instancia de Sequelize
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, sequelizeConfig)
  : new Sequelize(
      process.env.DB_NAME || 'integradora_db',
      process.env.DB_USER || 'root',
      process.env.DB_PASSWORD || '',
      sequelizeConfig
    );

// ░░░ FUNCIONES DE APOYO ░░░

// Probar conexión
async function testConnection() {
  try {
    console.log('\n🔌 Intentando conectar a la base de datos...');
    console.log(`   Host: ${sequelize.config.host || 'N/A'}`);
    console.log(`   DB:   ${sequelize.config.database || 'N/A'}`);

    await sequelize.authenticate();
    console.log('✅ Conectado correctamente\n');
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

// Sincronizar modelos
async function syncDatabase(force = false) {
  try {
    await sequelize.sync({ force, alter: !force });
    console.log('📦 Modelos sincronizados correctamente.');
  } catch (error) {
    console.error('❌ Error al sincronizar base de datos:', error.message);
  }
}

module.exports = {
  sequelize,
  testConnection,
  syncDatabase
};
