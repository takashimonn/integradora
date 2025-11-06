const usuarioService = require('../services/usuarioService');

class UsuarioController {
  // Registrar nuevo usuario
  async registrar(req, res) {
    try {
      const resultado = await usuarioService.registrarUsuario(req.body);

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: resultado
      });

    } catch (error) {
      const errorInfo = usuarioService.manejarError(error);
      
      let statusCode = 500;
      if (errorInfo.tipo === 'VALIDACION') statusCode = 400;
      if (errorInfo.tipo === 'DUPLICADO') statusCode = 409;

      res.status(statusCode).json({
        success: false,
        message: errorInfo.mensaje,
        ...(errorInfo.errores && { errors: errorInfo.errores })
      });
    }
  }

  // Login de usuario
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const resultado = await usuarioService.loginUsuario(email, password);

      res.json({
        success: true,
        message: 'Login exitoso',
        data: resultado
      });

    } catch (error) {
      const statusCode = error.message.includes('Credenciales') ? 401 : 
                        error.message.includes('desactivada') ? 403 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Obtener perfil del usuario autenticado
  async obtenerPerfil(req, res) {
    try {
      const usuario = await usuarioService.obtenerUsuarioPorId(req.usuario.id);

      res.json({
        success: true,
        data: { usuario }
      });

    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  // Actualizar perfil
  async actualizarPerfil(req, res) {
    try {
      const usuario = await usuarioService.actualizarUsuario(req.usuario.id, req.body);

      res.json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: { usuario }
      });

    } catch (error) {
      const errorInfo = usuarioService.manejarError(error);
      
      let statusCode = 500;
      if (errorInfo.tipo === 'VALIDACION') statusCode = 400;
      if (errorInfo.tipo === 'DUPLICADO') statusCode = 409;
      if (error.message.includes('no encontrado')) statusCode = 404;

      res.status(statusCode).json({
        success: false,
        message: errorInfo.mensaje || error.message,
        ...(errorInfo.errores && { errors: errorInfo.errores })
      });
    }
  }
}

module.exports = new UsuarioController();

