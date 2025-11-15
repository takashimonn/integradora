/**
 * Script de sincronización automática con Eleventa
 * Este script se ejecuta en la PC de la sucursal donde está instalado Eleventa
 * 
 * Requisitos:
 * - Node.js instalado
 * - Firebird instalado y accesible
 * - npm install node-firebird axios
 * 
 * Configuración:
 * 1. Editar las variables de configuración al inicio del archivo
 * 2. Ejecutar: node eleventa-sync.js
 * 3. O configurar como tarea programada en Windows
 */

const fb = require('node-firebird');
const axios = require('axios');
const path = require('path');

// ============================================
// CONFIGURACIÓN - EDITAR ESTOS VALORES
// ============================================
const CONFIG = {
  // ID de la sucursal en tu sistema
  ID_SUCURSAL: 1,
  
  // URL de tu API (cambiar por la URL real de tu servidor)
  // IMPORTANTE: NO usar localhost si el servidor está en otra computadora
  // Opciones:
  // - Si el servidor está en la misma red: http://192.168.1.100:4000/api/sales-integration
  // - Si el servidor está en internet: https://tu-dominio.com/api/sales-integration
  // - Si el servidor está en esta misma PC: http://localhost:4000/api/sales-integration
  API_URL: 'http://localhost:4000/api/sales-integration',
  
  // Ruta a la base de datos de Eleventa (Firebird)
  // IMPORTANTE: Usar doble barra invertida \\ en la ruta
  // Basado en tu instalación, probablemente está en:
  // C:\Archivos de programa (x86)\AbarrotesPDV\db\PDVDATA.FDB
  // 
  // Si el archivo tiene otro nombre o está en otra ubicación, ajustar aquí
  FIREBIRD_DB_PATH: 'C:\\Archivos de programa (x86)\\AbarrotesPDV\\db\\PDVDATA.FDB',
  
  // Credenciales de Firebird (generalmente por defecto)
  FIREBIRD_USER: 'SYSDBA',
  FIREBIRD_PASSWORD: 'masterkey',
  
  // Intervalo de consulta en milisegundos (cada 2 minutos = 120000)
  CHECK_INTERVAL: 120000, // 2 minutos
  
  // Modo debug (muestra más información en consola)
  DEBUG: true
};

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

function logError(message, error) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR: ${message}`, error?.message || error);
}

/**
 * Conectar a la base de datos Firebird de Eleventa
 */
function conectarFirebird() {
  return new Promise((resolve, reject) => {
    const options = {
      host: '127.0.0.1',
      port: 3050,
      database: CONFIG.FIREBIRD_DB_PATH,
      user: CONFIG.FIREBIRD_USER,
      password: CONFIG.FIREBIRD_PASSWORD,
      lowercase_keys: false,
      role: null,
      pageSize: 4096
    };

    fb.attach(options, (err, db) => {
      if (err) {
        reject(err);
      } else {
        resolve(db);
      }
    });
  });
}

/**
 * Extraer datos de ventas del día desde Firebird
 */
async function extraerVentasDelDia() {
  const db = await conectarFirebird();

  return new Promise((resolve, reject) => {
    // Query para obtener ventas del día actual
    // NOTA: Ajustar según la estructura real de las tablas de Eleventa
    const query = `
      SELECT 
        SUM(IMPORTE) as TOTAL_VENTAS
      FROM VENTAS_DETALLE
      WHERE FECHA = CURRENT_DATE
    `;

    // Si la tabla tiene otro nombre o estructura, ajustar aquí
    // Ejemplo alternativo:
    // const query = `
    //   SELECT 
    //     SUM(IMPORTE) as TOTAL_VENTAS
    //   FROM VENTAS
    //   WHERE DATE(FECHA) = CURRENT_DATE
    // `;

    db.query(query, (err, result) => {
      db.detach();

      if (err) {
        reject(err);
      } else {
        // Obtener el primer resultado
        const totalVentas = result.length > 0 ? parseFloat(result[0].TOTAL_VENTAS || 0) : 0;
        const fecha = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        resolve({
          fecha,
          totalVentas
        });
      }
    });
  });
}

/**
 * Consultar si hay sincronización pendiente
 */
async function verificarSincronizacionPendiente() {
  try {
    const response = await axios.get(
      `${CONFIG.API_URL}/should-sync/${CONFIG.ID_SUCURSAL}`,
      {
        timeout: 5000 // 5 segundos de timeout
      }
    );

    if (response.data.success && response.data.sync) {
      return true;
    }

    return false;
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      logError('No se puede conectar al servidor. Verifica la URL de la API y que el servidor esté corriendo.', error);
    } else if (error.code === 'ETIMEDOUT') {
      logError('Timeout al conectar con el servidor. Verifica la conexión a internet.', error);
    } else {
      logError('Error al verificar sincronización pendiente', error);
    }
    return false;
  }
}

/**
 * Enviar datos de ventas a la API
 */
async function enviarDatosVentas(fecha, totalVentas) {
  try {
    const response = await axios.post(
      `${CONFIG.API_URL}/receive-data`,
      {
        idSucursal: CONFIG.ID_SUCURSAL,
        fecha: fecha,
        totalVentas: totalVentas
      }
    );

    if (response.data.success) {
      log(`✅ Datos enviados exitosamente: $${totalVentas.toFixed(2)} para ${fecha}`);
      return true;
    } else {
      logError('Error al enviar datos', response.data.message);
      return false;
    }
  } catch (error) {
    logError('Error al enviar datos a la API', error);
    return false;
  }
}

/**
 * Proceso principal de sincronización
 */
async function sincronizar() {
  try {
    log('🔄 Iniciando proceso de sincronización...');

    // Verificar si hay sincronización pendiente
    const pendiente = await verificarSincronizacionPendiente();

    if (!pendiente) {
      if (CONFIG.DEBUG) {
        log('⏸️  No hay sincronización pendiente');
      }
      return;
    }

    log('📊 Sincronización pendiente detectada, extrayendo datos...');

    // Extraer datos de ventas del día
    const datosVentas = await extraerVentasDelDia();

    if (CONFIG.DEBUG) {
      log(`📈 Datos extraídos: $${datosVentas.totalVentas.toFixed(2)} para ${datosVentas.fecha}`);
    }

    // Enviar datos a la API
    await enviarDatosVentas(datosVentas.fecha, datosVentas.totalVentas);

    log('✅ Sincronización completada');

  } catch (error) {
    logError('Error en el proceso de sincronización', error);
  }
}

// ============================================
// EJECUCIÓN PRINCIPAL
// ============================================

log('🚀 Script de sincronización Eleventa iniciado');
log(`📍 Sucursal ID: ${CONFIG.ID_SUCURSAL}`);
log(`🌐 API URL: ${CONFIG.API_URL}`);
log(`💾 Base de datos: ${CONFIG.FIREBIRD_DB_PATH}`);
log(`⏱️  Intervalo de consulta: ${CONFIG.CHECK_INTERVAL / 1000} segundos`);

// Ejecutar sincronización inmediatamente al iniciar
sincronizar();

// Ejecutar sincronización periódicamente
setInterval(() => {
  sincronizar();
}, CONFIG.CHECK_INTERVAL);

// Manejar cierre del script
process.on('SIGINT', () => {
  log('👋 Script detenido');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('👋 Script detenido');
  process.exit(0);
});

