const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { authenticate } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configurar multer para subir imágenes de sucursales
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads/sucursales');
    
    // Crear directorio si no existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Nombre único: timestamp + nombre original
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'sucursal-' + uniqueSuffix + ext);
  }
});

// Filtrar solo archivos de imagen
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen (jpeg, jpg, png, gif, webp)'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  },
  fileFilter: fileFilter
});

// Rutas públicas
router.post('/registro', usuarioController.registrar.bind(usuarioController));
router.post('/login', usuarioController.login.bind(usuarioController));

// Ruta temporal de utilidad: verificar si existe un usuario (solo para debugging)
router.get('/check-user/:email', async (req, res) => {
  try {
    const Usuario = require('../models/Usuario');
    const usuario = await Usuario.findOne({
      where: { email: req.params.email },
      attributes: ['id_usuario', 'nombre', 'email', 'activo', 'id_sucursal']
    });
    
    if (usuario) {
      res.json({
        success: true,
        exists: true,
        usuario: usuario.toJSON()
      });
    } else {
      res.json({
        success: true,
        exists: false,
        message: 'Usuario no encontrado'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Ruta temporal: resetear contraseña de un usuario (solo para desarrollo/debugging)
// ⚠️ ELIMINAR ESTE ENDPOINT EN PRODUCCIÓN o protegerlo con autenticación
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email y nueva contraseña son requeridos'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }
    
    const Usuario = require('../models/Usuario');
    const usuario = await Usuario.findOne({ where: { email } });
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Actualizar contraseña (el hook beforeUpdate la hasheará automáticamente)
    usuario.password = newPassword;
    await usuario.save();
    
    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente',
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        email: usuario.email
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Rutas protegidas (requieren autenticación)
router.get('/perfil', authenticate, usuarioController.obtenerPerfil.bind(usuarioController));
router.put('/perfil', authenticate, usuarioController.actualizarPerfil.bind(usuarioController));
router.get('/sucursal', authenticate, usuarioController.obtenerSucursal.bind(usuarioController));
router.put('/sucursal/imagen', authenticate, upload.single('imagen'), usuarioController.actualizarImagenSucursal.bind(usuarioController));

module.exports = router;

