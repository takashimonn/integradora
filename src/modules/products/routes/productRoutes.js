const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configurar multer para subir imágenes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../../uploads/products');
    
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
    cb(null, 'product-' + uniqueSuffix + ext);
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

// Rutas de productos
// GET /api/products - Obtener todos los productos
router.get('/', productController.obtenerTodos.bind(productController));

// GET /api/products/:id - Obtener un producto por ID
router.get('/:id', productController.obtenerPorId.bind(productController));

// POST /api/products - Crear nuevo producto (con imagen opcional)
// El campo del formulario debe llamarse 'imagen' o 'foto'
router.post('/', upload.single('imagen'), productController.crear.bind(productController));

// PUT /api/products/:id - Actualizar producto (con imagen opcional)
// El campo del formulario debe llamarse 'imagen' o 'foto'
router.put('/:id', upload.single('imagen'), productController.actualizar.bind(productController));

// DELETE /api/products/:id - Eliminar producto
router.delete('/:id', productController.eliminar.bind(productController));

module.exports = router;

