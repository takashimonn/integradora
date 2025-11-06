const Usuario = require('../models/Usuario');
const { generateToken } = require('../utils/jwt');
const { ValidationError, UniqueConstraintError } = require('sequelize');

class UsuarioService {
  // Registrar nuevo usuario
  async registrarUsuario(datos) {
    const { nombre, email, password } = datos;

    // Validaciones básicas
    if (!nombre || !email || !password) {
      throw new Error('Todos los campos son requeridos: nombre, email, password');
    }

    // Crear usuario (el modelo tiene validaciones y hash automático)
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

    return {
      usuario: usuario.toJSON(),
      token
    };
  }

  // Login de usuario
  async loginUsuario(email, password) {
    if (!email || !password) {
      throw new Error('Email y contraseña son requeridos');
    }

    // Buscar usuario
    const usuario = await Usuario.findOne({
      where: { email }
    });

    if (!usuario) {
      throw new Error('Credenciales inválidas');
    }

    // Verificar si está activo
    if (!usuario.activo) {
      throw new Error('Tu cuenta ha sido desactivada');
    }

    // Verificar contraseña
    const isPasswordValid = await usuario.comparePassword(password);

    if (!isPasswordValid) {
      throw new Error('Credenciales inválidas');
    }

    // Generar token
    const token = generateToken({
      id: usuario.id,
      email: usuario.email
    });

    return {
      usuario: usuario.toJSON(),
      token
    };
  }

  // Obtener usuario por ID
  async obtenerUsuarioPorId(id) {
    const usuario = await Usuario.findByPk(id);

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    return usuario.toJSON();
  }

  // Actualizar usuario
  async actualizarUsuario(id, datos) {
    const { nombre, email } = datos;

    const usuario = await Usuario.findByPk(id);

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // Actualizar campos
    if (nombre) usuario.nombre = nombre;
    if (email) usuario.email = email;

    await usuario.save();

    return usuario.toJSON();
  }

  // Manejar errores de Sequelize y convertirlos en errores amigables
  manejarError(error) {
    if (error instanceof ValidationError) {
      return {
        tipo: 'VALIDACION',
        mensaje: 'Error de validación',
        errores: error.errors.map(err => ({
          campo: err.path,
          mensaje: err.message
        }))
      };
    }

    if (error instanceof UniqueConstraintError) {
      return {
        tipo: 'DUPLICADO',
        mensaje: 'Este email ya está registrado'
      };
    }

    return {
      tipo: 'ERROR',
      mensaje: error.message || 'Error desconocido'
    };
  }
}

module.exports = new UsuarioService();


