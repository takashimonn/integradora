const salesIntegrationRepository = require('../repositories/salesIntegrationRepository');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

class SalesIntegrationService {
  /**
   * Procesar archivo Excel de eleventa y registrar ventas
   * @param {string} filePath - Ruta del archivo Excel
   * @param {number} idSucursal - ID de la sucursal
   * @param {string} fecha - Fecha del reporte (opcional, se puede extraer del Excel)
   * @returns {Promise<Object>}
   */
  async procesarExcelEleventa(filePath, idSucursal, fecha = null) {
    try {
      // Verificar que la sucursal existe
      const sucursalExiste = await salesIntegrationRepository.verificarSucursal(idSucursal);
      if (!sucursalExiste) {
        throw new Error(`La sucursal con ID ${idSucursal} no existe`);
      }

      // Leer el archivo Excel
      const workbook = XLSX.readFile(filePath);
      
      // Obtener el nombre de la primera hoja
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convertir a JSON
      const datos = XLSX.utils.sheet_to_json(worksheet, { 
        raw: false, // Para obtener valores como strings
        defval: null // Valores por defecto
      });

      if (!datos || datos.length === 0) {
        throw new Error('El archivo Excel está vacío o no contiene datos válidos');
      }

      // Procesar los datos según el formato de eleventa
      // Nota: El formato exacto dependerá de cómo eleventa exporta los datos
      // Este es un ejemplo genérico que deberás ajustar según el formato real
      const resultado = this.procesarDatosVentas(datos, fecha);

      // Crear o actualizar el reporte diario
      const reporte = await salesIntegrationRepository.crearOActualizarReporte(
        idSucursal,
        resultado.fecha,
        resultado.totalVentas
      );

      // Eliminar el archivo temporal después de procesarlo
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.warn('No se pudo eliminar el archivo temporal:', error.message);
      }

      return {
        reporte: reporte.toJSON(),
        resumen: {
          fecha: resultado.fecha,
          totalVentas: resultado.totalVentas,
          totalRegistros: resultado.totalRegistros,
          registrosProcesados: resultado.registrosProcesados
        }
      };

    } catch (error) {
      // Intentar eliminar el archivo en caso de error
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.warn('No se pudo eliminar el archivo temporal:', err.message);
      }

      throw error;
    }
  }

  /**
   * Procesar datos de ventas del Excel de Eleventa
   * Formato esperado: Código | Descripción | Cantidad | Precio Usado | Precio Costo | Importe | Departamento
   * @param {Array} datos - Datos del Excel convertidos a JSON
   * @param {string} fecha - Fecha proporcionada manualmente (opcional)
   * @returns {Object}
   */
  procesarDatosVentas(datos, fecha = null) {
    let totalVentas = 0;
    let fechaReporte = fecha;
    let totalRegistros = datos.length;
    let registrosProcesados = 0;

    // Procesar cada fila del Excel
    for (const fila of datos) {
      try {
        // Eleventa exporta con la columna "Importe" que contiene el total por producto
        // Formato: "$1,520.00000" (con símbolo $, comas para miles, punto decimal)
        let monto = null;
        
        // Prioridad 1: Columna "Importe" (formato estándar de Eleventa)
        if (fila['Importe'] !== undefined && fila['Importe'] !== null && fila['Importe'] !== '') {
          monto = this.parsearNumero(fila['Importe']);
        }
        // Prioridad 2: Otras columnas comunes como fallback
        else if (fila['Total'] !== undefined && fila['Total'] !== null && fila['Total'] !== '') {
          monto = this.parsearNumero(fila['Total']);
        } else if (fila['Venta'] !== undefined && fila['Venta'] !== null && fila['Venta'] !== '') {
          monto = this.parsearNumero(fila['Venta']);
        } else if (fila['Monto'] !== undefined && fila['Monto'] !== null && fila['Monto'] !== '') {
          monto = this.parsearNumero(fila['Monto']);
        }

        // Solo sumar si el monto es válido y mayor a 0
        if (monto !== null && !isNaN(monto) && monto > 0) {
          totalVentas += monto;
          registrosProcesados++;
        }

        // Intentar extraer la fecha si no se proporcionó
        // Nota: El formato de Eleventa "Ventas por periodo" generalmente no incluye fecha en cada fila
        // ya que se exporta por un periodo específico (hoy, esta semana, etc.)
        if (!fechaReporte) {
          if (fila['Fecha'] !== undefined && fila['Fecha'] !== null && fila['Fecha'] !== '') {
            fechaReporte = this.parsearFecha(fila['Fecha']);
          } else if (fila['Date'] !== undefined && fila['Date'] !== null && fila['Date'] !== '') {
            fechaReporte = this.parsearFecha(fila['Date']);
          } else if (fila['Día'] !== undefined && fila['Día'] !== null && fila['Día'] !== '') {
            fechaReporte = this.parsearFecha(fila['Día']);
          }
        }

      } catch (error) {
        console.warn('Error al procesar fila:', error.message, fila);
        // Continuar con la siguiente fila
      }
    }

    // Si no se encontró fecha, usar la fecha actual
    if (!fechaReporte) {
      fechaReporte = new Date().toISOString().split('T')[0];
    }

    return {
      fecha: fechaReporte,
      totalVentas: totalVentas.toFixed(2),
      totalRegistros,
      registrosProcesados
    };
  }

  /**
   * Parsear un valor a número
   * Maneja el formato de Eleventa: "$1,520.00000" (con $, comas, punto decimal)
   * @param {any} valor - Valor a parsear
   * @returns {number|null}
   */
  parsearNumero(valor) {
    if (valor === null || valor === undefined || valor === '') {
      return null;
    }

    if (typeof valor === 'number') {
      return valor;
    }

    if (typeof valor === 'string') {
      // Remover símbolos de moneda ($), comas (separadores de miles) y espacios
      // Ejemplo: "$1,520.00000" -> "1520.00000"
      let limpio = valor.trim();
      
      // Remover símbolo de dólar
      limpio = limpio.replace(/\$/g, '');
      
      // Remover comas (separadores de miles)
      limpio = limpio.replace(/,/g, '');
      
      // Remover espacios adicionales
      limpio = limpio.trim();
      
      // Convertir a número
      const numero = parseFloat(limpio);
      
      // Retornar null si no es un número válido
      if (isNaN(numero)) {
        return null;
      }
      
      return numero;
    }

    return null;
  }

  /**
   * Parsear una fecha a formato YYYY-MM-DD
   * @param {any} valor - Valor a parsear
   * @returns {string|null}
   */
  parsearFecha(valor) {
    if (!valor) {
      return null;
    }

    // Si ya es una fecha en formato YYYY-MM-DD
    if (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
      return valor;
    }

    // Intentar parsear como fecha
    const fecha = new Date(valor);
    if (!isNaN(fecha.getTime())) {
      return fecha.toISOString().split('T')[0];
    }

    // Si es un número (días desde 1900, formato Excel)
    if (typeof valor === 'number') {
      const fechaExcel = this.fechaDesdeNumeroExcel(valor);
      return fechaExcel ? fechaExcel.toISOString().split('T')[0] : null;
    }

    return null;
  }

  /**
   * Convertir número de Excel a fecha
   * Excel almacena fechas como días desde el 1 de enero de 1900
   * @param {number} numero - Número de Excel
   * @returns {Date|null}
   */
  fechaDesdeNumeroExcel(numero) {
    try {
      // Excel cuenta desde el 1 de enero de 1900, pero tiene un bug:
      // considera 1900 como año bisiesto cuando no lo es
      const fechaBase = new Date(1900, 0, 1);
      const dias = Math.floor(numero) - 2; // -2 para corregir el bug de Excel
      fechaBase.setDate(fechaBase.getDate() + dias);
      return fechaBase;
    } catch (error) {
      return null;
    }
  }

  /**
   * Obtener reporte por sucursal y fecha
   * @param {number} idSucursal - ID de la sucursal
   * @param {string} fecha - Fecha en formato YYYY-MM-DD
   * @returns {Promise<Object>}
   */
  async obtenerReporte(idSucursal, fecha) {
    const reporte = await salesIntegrationRepository.obtenerReportePorFecha(idSucursal, fecha);
    
    if (!reporte) {
      throw new Error('Reporte no encontrado');
    }

    return reporte.toJSON();
  }

  /**
   * Obtener todos los reportes de una sucursal
   * @param {number} idSucursal - ID de la sucursal
   * @param {string} fechaDesde - Fecha inicio (opcional)
   * @param {string} fechaHasta - Fecha fin (opcional)
   * @returns {Promise<Array>}
   */
  async obtenerReportes(idSucursal, fechaDesde = null, fechaHasta = null) {
    const reportes = await salesIntegrationRepository.obtenerReportesPorSucursal(
      idSucursal,
      fechaDesde,
      fechaHasta
    );

    return reportes.map(r => r.toJSON());
  }

  /**
   * Verificar si hay sincronización pendiente (para el script local)
   * @param {number} idSucursal - ID de la sucursal
   * @returns {Promise<boolean>}
   */
  async verificarSincronizacionPendiente(idSucursal) {
    return await salesIntegrationRepository.verificarSincronizacionPendiente(idSucursal);
  }

  /**
   * Solicitar sincronización desde la app (marca flag como pendiente)
   * @param {number} idSucursal - ID de la sucursal
   * @returns {Promise<Object>}
   */
  async solicitarSincronizacion(idSucursal) {
    // Verificar que la sucursal existe
    const sucursalExiste = await salesIntegrationRepository.verificarSucursal(idSucursal);
    if (!sucursalExiste) {
      throw new Error(`La sucursal con ID ${idSucursal} no existe`);
    }

    const sincronizacion = await salesIntegrationRepository.marcarSincronizacionPendiente(idSucursal);
    return sincronizacion.toJSON();
  }

  /**
   * Recibir datos de ventas desde el script local
   * @param {number} idSucursal - ID de la sucursal
   * @param {string} fecha - Fecha en formato YYYY-MM-DD
   * @param {number} totalVentas - Total de ventas
   * @returns {Promise<Object>}
   */
  async recibirDatosVentas(idSucursal, fecha, totalVentas) {
    // Validaciones
    if (!idSucursal) {
      throw new Error('ID de sucursal es requerido');
    }

    if (!fecha) {
      throw new Error('Fecha es requerida');
    }

    if (totalVentas === undefined || totalVentas === null) {
      throw new Error('Total de ventas es requerido');
    }

    if (totalVentas < 0) {
      throw new Error('Total de ventas no puede ser negativo');
    }

    // Verificar que la sucursal existe
    const sucursalExiste = await salesIntegrationRepository.verificarSucursal(idSucursal);
    if (!sucursalExiste) {
      throw new Error(`La sucursal con ID ${idSucursal} no existe`);
    }

    const reporte = await salesIntegrationRepository.recibirDatosVentas(
      idSucursal,
      fecha,
      totalVentas
    );

    return reporte.toJSON();
  }
}

module.exports = new SalesIntegrationService();

