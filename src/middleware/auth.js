const { verifyToken } = require('../utils/jwt');
const Usuario = require('../models/Usuario');

// Middleware para verificar autenticación
async function authenticate(req, res, next) {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No se proporcionó token de autenticación'
      });
    }

    // El formato debe ser: "Bearer <token>"
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: 'Formato de token inválido. Use: Bearer <token>'
      });
    }

    const token = parts[1];

    // Verificar token
    const decoded = verifyToken(token);

    // Buscar usuario en la base de datos
    // Compatibilidad: acepta tanto 'id_usuario' como 'id' en el token
    const usuarioId = decoded.id_usuario || decoded.id;
    const usuario = await Usuario.findByPk(usuarioId);

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    if (!usuario.activo) {
      return res.status(403).json({
        success: false,
        message: 'Tu cuenta ha sido desactivada'
      });
    }

    // Agregar usuario al request
    req.usuario = usuario;

    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado',
      error: error.message
    });
  }
}

module.exports = {
  authenticate
};

