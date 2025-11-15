const salesIntegrationService = require('../services/salesIntegrationService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configurar multer para subir archivos Excel
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../../uploads/excel');
    
    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generar nombre único para el archivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `eleventa-${uniqueSuffix}${ext}`);
  }
});

// Filtrar solo archivos Excel
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.xlsx', '.xls'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB máximo
  }
});

class SalesIntegrationController {
  /**
   * Subir y procesar archivo Excel de eleventa
   * POST /api/sales-integration/upload
   * Body form-data:
   *   - file: archivo Excel
   *   - idSucursal: ID de la sucursal
   *   - fecha: Fecha del reporte (opcional, formato YYYY-MM-DD)
   */
  async subirExcel(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionó ningún archivo'
        });
      }

      const { idSucursal, fecha } = req.body;

      if (!idSucursal) {
        // Eliminar archivo si falta información requerida
        if (req.file.path) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (err) {
            console.warn('No se pudo eliminar el archivo:', err.message);
          }
        }

        return res.status(400).json({
          success: false,
          message: 'El ID de sucursal es requerido'
        });
      }

      const resultado = await salesIntegrationService.procesarExcelEleventa(
        req.file.path,
        parseInt(idSucursal),
        fecha || null
      );

      res.status(200).json({
        success: true,
        message: 'Archivo procesado exitosamente',
        data: resultado
      });

    } catch (error) {
      // Eliminar archivo en caso de error
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (err) {
          console.warn('No se pudo eliminar el archivo:', err.message);
        }
      }

      const statusCode = error.message.includes('no existe') || 
                        error.message.includes('no encontrado') ? 404 : 400;

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Obtener reporte por sucursal y fecha
   * GET /api/sales-integration/reporte/:idSucursal/:fecha
   */
  async obtenerReporte(req, res) {
    try {
      const { idSucursal, fecha } = req.params;

      if (!idSucursal || !fecha) {
        return res.status(400).json({
          success: false,
          message: 'ID de sucursal y fecha son requeridos'
        });
      }

      const reporte = await salesIntegrationService.obtenerReporte(
        parseInt(idSucursal),
        fecha
      );

      res.json({
        success: true,
        data: reporte
      });

    } catch (error) {
      const statusCode = error.message.includes('no encontrado') ? 404 : 400;
      
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Obtener todos los reportes de una sucursal
   * GET /api/sales-integration/reportes/:idSucursal
   * Query params: ?fechaDesde=YYYY-MM-DD&fechaHasta=YYYY-MM-DD
   */
  async obtenerReportes(req, res) {
    try {
      const { idSucursal } = req.params;
      const { fechaDesde, fechaHasta } = req.query;

      if (!idSucursal) {
        return res.status(400).json({
          success: false,
          message: 'ID de sucursal es requerido'
        });
      }

      const reportes = await salesIntegrationService.obtenerReportes(
        parseInt(idSucursal),
        fechaDesde || null,
        fechaHasta || null
      );

      res.json({
        success: true,
        data: reportes,
        count: reportes.length
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener reportes',
        error: error.message
      });
    }
  }

  /**
   * Verificar si hay sincronización pendiente (para el script local)
   * GET /api/sales-integration/should-sync/:idSucursal
   */
  async verificarSincronizacion(req, res) {
    try {
      const { idSucursal } = req.params;

      if (!idSucursal) {
        return res.status(400).json({
          success: false,
          message: 'ID de sucursal es requerido'
        });
      }

      const pendiente = await salesIntegrationService.verificarSincronizacionPendiente(
        parseInt(idSucursal)
      );

      res.json({
        success: true,
        sync: pendiente
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al verificar sincronización',
        error: error.message
      });
    }
  }

  /**
   * Solicitar sincronización desde la app
   * POST /api/sales-integration/request-sync/:idSucursal
   */
  async solicitarSincronizacion(req, res) {
    try {
      const { idSucursal } = req.params;

      if (!idSucursal) {
        return res.status(400).json({
          success: false,
          message: 'ID de sucursal es requerido'
        });
      }

      const sincronizacion = await salesIntegrationService.solicitarSincronizacion(
        parseInt(idSucursal)
      );

      res.json({
        success: true,
        message: 'Sincronización solicitada. El script local la procesará en breve.',
        data: sincronizacion
      });

    } catch (error) {
      const statusCode = error.message.includes('no existe') ? 404 : 400;
      
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Recibir datos de ventas desde el script local
   * POST /api/sales-integration/receive-data
   */
  async recibirDatosVentas(req, res) {
    try {
      const { idSucursal, fecha, totalVentas } = req.body;

      if (!idSucursal || !fecha || totalVentas === undefined) {
        return res.status(400).json({
          success: false,
          message: 'idSucursal, fecha y totalVentas son requeridos'
        });
      }

      const reporte = await salesIntegrationService.recibirDatosVentas(
        parseInt(idSucursal),
        fecha,
        parseFloat(totalVentas)
      );

      res.json({
        success: true,
        message: 'Datos recibidos y procesados exitosamente',
        data: reporte
      });

    } catch (error) {
      const statusCode = error.message.includes('no existe') ? 404 : 400;
      
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Middleware para manejar errores de multer
   */
  manejarErrorMulter(error, req, res, next) {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'El archivo es demasiado grande. Tamaño máximo: 10MB'
        });
      }
      return res.status(400).json({
        success: false,
        message: `Error al subir archivo: ${error.message}`
      });
    }

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    next();
  }
}

// Exportar el controlador y el middleware de multer
const controller = new SalesIntegrationController();
controller.upload = upload;

module.exports = controller;

