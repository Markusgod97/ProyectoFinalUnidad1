const express  = require('express');
const Usuario  = require('../models/Usuario');
const { verificarToken, soloAdmin } = require('../middleware/auth');

const router = express.Router();

// =============================================
// GET /api/usuarios
// Lista todos los usuarios (solo admins)
// =============================================
router.get('/', verificarToken, soloAdmin, async (req, res) => {
  try {
    // .find({}) trae todos los documentos.
    // .select('-password') excluye el campo password del resultado
    // aunque ya tiene select:false, es buena práctica explicitarlo aquí.
    const usuarios = await Usuario.find({ activo: true }).select('-password');

    res.json({
      total: usuarios.length,
      usuarios
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// =============================================
// GET /api/usuarios/:id
// Obtiene un usuario por su ID
// =============================================
router.get('/:id', verificarToken, async (req, res) => {
  try {
    // req.params.id viene de la URL: /api/usuarios/abc123 → id = 'abc123'
    const usuario = await Usuario.findById(req.params.id).select('-password');

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(usuario);
  } catch (error) {
    // El error de cast ocurre si el id no tiene formato válido de MongoDB ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'ID de usuario inválido' });
    }
    res.status(500).json({ error: 'Error al obtener el usuario' });
  }
});

// =============================================
// POST /api/usuarios
// Crea un usuario desde el panel admin
// (También existe /api/auth/register para auto-registro)
// =============================================
router.post('/', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    const existe = await Usuario.findOne({ email });
    if (existe) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const nuevoUsuario = new Usuario({ nombre, email, password, rol });
    await nuevoUsuario.save();

    res.status(201).json({
      mensaje: 'Usuario creado exitosamente',
      usuario: {
        id:        nuevoUsuario._id,
        nombre:    nuevoUsuario.nombre,
        email:     nuevoUsuario.email,
        rol:       nuevoUsuario.rol,
        createdAt: nuevoUsuario.createdAt
      }
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const mensajes = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: mensajes.join(', ') });
    }
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// =============================================
// PUT /api/usuarios/:id
// Actualiza los datos de un usuario
// ¿Por qué PUT y no PATCH?
// PUT reemplaza el recurso completo, PATCH modifica parcialmente.
// En la práctica para APIs REST simples se usa PUT para "actualizar".
// =============================================
router.put('/:id', verificarToken, async (req, res) => {
  try {
    // Solo el propio usuario o un admin puede actualizar
    const esAdmin = req.usuario.rol === 'admin';
    const esPropioUsuario = req.usuario.id === req.params.id;

    if (!esAdmin && !esPropioUsuario) {
      return res.status(403).json({ error: 'No tienes permiso para editar este usuario' });
    }

    // Campos permitidos para actualizar.
    // NO incluimos password aquí — se haría en un endpoint separado
    // para poder manejar el hash correctamente.
    const { nombre, email } = req.body;
    const camposPermitidos = {};
    if (nombre) camposPermitidos.nombre = nombre;
    if (email)  camposPermitidos.email  = email;

    // Solo admin puede cambiar el rol
    if (esAdmin && req.body.rol) camposPermitidos.rol = req.body.rol;

    // findByIdAndUpdate: busca por ID y actualiza en una sola operación.
    // { new: true } devuelve el documento ACTUALIZADO (no el original).
    // { runValidators: true } aplica las validaciones del schema al actualizar.
    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      req.params.id,
      camposPermitidos,
      { new: true, runValidators: true }
    ).select('-password');

    if (!usuarioActualizado) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      mensaje: 'Usuario actualizado exitosamente',
      usuario: usuarioActualizado
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const mensajes = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: mensajes.join(', ') });
    }
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// =============================================
// DELETE /api/usuarios/:id
// Elimina (desactiva) un usuario
// ¿Por qué "desactivar" y no borrar físicamente?
// Para mantener integridad referencial: si el usuario
// creó armas, esos registros quedarían huérfanos si se borra.
// Este patrón se llama "soft delete".
// =============================================
router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      { activo: false },
      { new: true }
    );

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ mensaje: 'Usuario desactivado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

module.exports = router;
