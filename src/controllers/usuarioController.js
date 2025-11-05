const Usuario = require('../models/Usuario');
const { generateToken } = require('../utils/jwt');
const { ValidationError, UniqueConstraintError } = require('sequelize');

class UsuarioController {
  // Registrar nuevo usuario
  async registrar(req, res) {
    try {
      const { nombre, email, password } = req.body;

      // Validar que todos los campos estén presentes
      if (!nombre || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos son requeridos: nombre, email, password'
        });
      }

      // Crear usuario
      const usuario = await Usuario.create({
        nombre,
        email,
        password
      });

      // Generar token
      const token = generateToken({
        id: usuario.id,
        email: usuario.email
      });

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          usuario: usuario.toJSON(),
          token
        }
      });

    } catch (error) {
      // Manejar errores de validación de Sequelize
      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          message: 'Error de validación',
          errors: error.errors.map(err => ({
            campo: err.path,
            mensaje: err.message
          }))
        });
      }

      // Manejar error de email duplicado
      if (error instanceof UniqueConstraintError) {
        return res.status(409).json({
          success: false,
          message: 'Este email ya está registrado'
        });
      }

      console.error('Error en registro:', error);
      res.status(500).json({
        success: false,
        message: 'Error al registrar usuario',
        error: error.message
      });
    }
  }

  // Login de usuario
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validar que ambos campos estén presentes
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email y contraseña son requeridos'
        });
      }

      // Buscar usuario por email
      const usuario = await Usuario.findOne({
        where: { email }
      });

      // Verificar si el usuario existe
      if (!usuario) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Verificar si el usuario está activo
      if (!usuario.activo) {
        return res.status(403).json({
          success: false,
          message: 'Tu cuenta ha sido desactivada'
        });
      }

      // Verificar contraseña
      const isPasswordValid = await usuario.comparePassword(password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Generar token
      const token = generateToken({
        id: usuario.id,
        email: usuario.email
      });

      res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          usuario: usuario.toJSON(),
          token
        }
      });

    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        message: 'Error al iniciar sesión',
        error: error.message
      });
    }
  }

  // Obtener perfil del usuario autenticado
  async obtenerPerfil(req, res) {
    try {
      const usuarioId = req.usuario.id;

      const usuario = await Usuario.findByPk(usuarioId);

      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        data: {
          usuario: usuario.toJSON()
        }
      });

    } catch (error) {
      console.error('Error al obtener perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener perfil',
        error: error.message
      });
    }
  }

  // Actualizar perfil
  async actualizarPerfil(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const { nombre, email } = req.body;

      const usuario = await Usuario.findByPk(usuarioId);

      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Actualizar campos
      if (nombre) usuario.nombre = nombre;
      if (email) usuario.email = email;

      await usuario.save();

      res.json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: {
          usuario: usuario.toJSON()
        }
      });

    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          message: 'Error de validación',
          errors: error.errors.map(err => ({
            campo: err.path,
            mensaje: err.message
          }))
        });
      }

      if (error instanceof UniqueConstraintError) {
        return res.status(409).json({
          success: false,
          message: 'Este email ya está en uso'
        });
      }

      console.error('Error al actualizar perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar perfil',
        error: error.message
      });
    }
  }
}

module.exports = new UsuarioController();

