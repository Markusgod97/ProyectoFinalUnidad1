const express = require('express');
const jwt     = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// express.Router() crea un mini-router independiente.
// ¿Por qué no poner todo en server.js?
// Para organizar el código. Cada archivo de rutas maneja UN recurso.
const router = express.Router();

// =============================================
// POST /api/auth/register
// Registra un nuevo usuario en la base de datos
// =============================================
router.post('/register', async (req, res) => {
  try {
    // Destructuring: extraemos solo los campos que necesitamos del body.
    // Esto evita que el usuario inyecte campos no deseados (ej: rol: 'admin').
    const { nombre, email, password } = req.body;

    // Validación manual (además de la de Mongoose)
    if (!nombre || !email || !password) {
      return res.status(400).json({
        error: 'Nombre, email y password son obligatorios'
      });
    }

    // Verificar si el email ya existe antes de intentar crear
    // Esto da un mensaje más claro que el error de índice único de MongoDB
    const existeUsuario = await Usuario.findOne({ email });
    if (existeUsuario) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Creamos el usuario. El hash de password se hace en el pre-save del modelo.
    const nuevoUsuario = new Usuario({ nombre, email, password });
    await nuevoUsuario.save();

    // Nunca devolvemos el password, ni siquiera el hash
    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      usuario: {
        id:     nuevoUsuario._id,
        nombre: nuevoUsuario.nombre,
        email:  nuevoUsuario.email,
        rol:    nuevoUsuario.rol
      }
    });

  } catch (error) {
    // Los errores de validación de Mongoose tienen código 11000 (duplicado)
    // y error.name === 'ValidationError' para campos inválidos
    if (error.name === 'ValidationError') {
      const mensajes = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: mensajes.join(', ') });
    }
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// =============================================
// POST /api/auth/login
// Verifica credenciales y devuelve un JWT
// =============================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password son obligatorios' });
    }

    // .select('+password') es necesario porque en el esquema pusimos select: false
    // Esto trae el campo password SOLO en esta consulta específica
    const usuario = await Usuario.findOne({ email }).select('+password');

    // Mensaje genérico intencionalmente: no revelar si el email existe o no
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Usamos el método del modelo para comparar passwords
    const passwordValida = await usuario.verificarPassword(password);
    if (!passwordValida) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (!usuario.activo) {
      return res.status(401).json({ error: 'Cuenta desactivada. Contacta al administrador.' });
    }

    // ---- Creamos el JWT ----
    // jwt.sign(payload, secret, opciones)
    // payload: datos que queremos guardar en el token (NO passwords)
    // secret: clave para firmar (debe ser larga y privada)
    // expiresIn: cuánto dura el token (8h = 8 horas)
    const token = jwt.sign(
      {
        id:     usuario._id,
        nombre: usuario.nombre,
        email:  usuario.email,
        rol:    usuario.rol
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: {
        id:     usuario._id,
        nombre: usuario.nombre,
        email:  usuario.email,
        rol:    usuario.rol
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Error en el proceso de login' });
  }
});

module.exports = router;