const Usuario = require('../models/Usuario');
const Sucursal = require('../models/Sucursal');
const { generateToken } = require('../utils/jwt');
const { ValidationError, UniqueConstraintError } = require('sequelize');
const fs = require('fs');
const path = require('path');

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
      id_usuario: usuario.id_usuario,
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
      id_usuario: usuario.id_usuario,
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

  // Obtener sucursal del usuario autenticado
  async obtenerSucursalUsuario(idUsuario) {
    const usuario = await Usuario.findByPk(idUsuario, {
      include: [{
        model: Sucursal,
        as: 'sucursal',
        attributes: ['id_sucursal', 'gerente', 'ubicacion', 'imagen']
      }]
    });

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    if (!usuario.id_sucursal) {
      throw new Error('El usuario no tiene una sucursal asignada');
    }

    if (!usuario.sucursal) {
      throw new Error('Sucursal no encontrada');
    }

    return usuario.sucursal.toJSON();
  }

  // Actualizar imagen de la sucursal del usuario autenticado
  async actualizarImagenSucursal(idUsuario, imagenPath) {
    // Obtener usuario con su sucursal
    const usuario = await Usuario.findByPk(idUsuario, {
      include: [{
        model: Sucursal,
        as: 'sucursal'
      }]
    });

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    if (!usuario.id_sucursal) {
      throw new Error('El usuario no tiene una sucursal asignada');
    }

    if (!usuario.sucursal) {
      throw new Error('Sucursal no encontrada');
    }

    // Guardar ruta de imagen anterior para eliminarla después
    const imagenAnterior = usuario.sucursal.imagen;

    // Actualizar la imagen de la sucursal
    await usuario.sucursal.update({ imagen: imagenPath });

    // Eliminar imagen anterior si existe
    if (imagenAnterior) {
      this.eliminarImagen(imagenAnterior);
    }

    // Recargar la sucursal para obtener los datos actualizados
    await usuario.sucursal.reload();

    return usuario.sucursal.toJSON();
  }

  // Eliminar imagen de sucursal
  eliminarImagen(imagenPath) {
    if (!imagenPath) return;

    try {
      // Si la imagen está en el sistema de archivos, eliminarla
      if (imagenPath.startsWith('/uploads') || imagenPath.startsWith('uploads')) {
        const rutaCompleta = path.join(__dirname, '../', imagenPath);
        if (fs.existsSync(rutaCompleta)) {
          fs.unlinkSync(rutaCompleta);
        }
      }
    } catch (error) {
      console.error('Error al eliminar imagen de sucursal:', error);
      // No lanzamos error, solo logueamos
    }
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


