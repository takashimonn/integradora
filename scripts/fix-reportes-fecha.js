/**
 * Script para agregar la columna 'fecha' a la tabla 'reportes'
 * Ejecutar: node scripts/fix-reportes-fecha.js
 */

require('dotenv').config();
const { sequelize } = require('../src/config/sequelize');

async function agregarColumnaFecha() {
  try {
    console.log('🔄 Agregando columna "fecha" a la tabla "reportes"...');
    
    // Verificar si la columna ya existe
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'reportes' 
      AND COLUMN_NAME = 'fecha'
    `);

    if (results.length > 0) {
      console.log('✅ La columna "fecha" ya existe en la tabla "reportes"');
      return;
    }

    // Agregar la columna
    await sequelize.query(`
      ALTER TABLE \`reportes\` 
      ADD COLUMN \`fecha\` DATE NULL 
      COMMENT 'Fecha del reporte diario de ventas' 
      AFTER \`total_ventas\`
    `);

    console.log('✅ Columna "fecha" agregada exitosamente a la tabla "reportes"');
    
  } catch (error) {
    console.error('❌ Error al agregar columna:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Ejecutar
agregarColumnaFecha();

