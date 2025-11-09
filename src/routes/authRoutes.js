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

// Rutas protegidas (requieren autenticación)
router.get('/perfil', authenticate, usuarioController.obtenerPerfil.bind(usuarioController));
router.put('/perfil', authenticate, usuarioController.actualizarPerfil.bind(usuarioController));
router.get('/sucursal', authenticate, usuarioController.obtenerSucursal.bind(usuarioController));
router.put('/sucursal/imagen', authenticate, upload.single('imagen'), usuarioController.actualizarImagenSucursal.bind(usuarioController));

module.exports = router;

