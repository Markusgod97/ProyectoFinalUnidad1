const express = require('express');
const Arma    = require('../models/Arma');
const { verificarToken, soloAdmin } = require('../middleware/auth');

const router = express.Router();

// =============================================
// GET /api/armas
// Lista todas las armas. Ruta PÚBLICA.
// ¿Por qué pública? El catálogo debe ser visible
// sin necesidad de iniciar sesión (vitrina).
// =============================================
router.get('/', async (req, res) => {
  try {
    // Filtros opcionales por query params
    // Ejemplo: GET /api/armas?categoria=fusil&disponible=true
    const filtro = { disponible: true };
    if (req.query.categoria) filtro.categoria = req.query.categoria;
    if (req.query.pais)      filtro.pais = req.query.pais;

    // .populate('creadoPor', 'nombre email') reemplaza el ObjectId
    // con los datos del usuario (solo nombre y email).
    // ¿Se puede quitar? Sí, si no necesitas mostrar quién creó el registro.
    const armas = await Arma.find(filtro)
      .populate('creadoPor', 'nombre email')
      .sort({ createdAt: -1 }); // -1 = más reciente primero

    res.json({
      total: armas.length,
      armas
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el catálogo de armas' });
  }
});

// =============================================
// GET /api/armas/categoria/:categoria
// Filtra por categoría. Ruta PÚBLICA.
// IMPORTANTE: esta ruta debe estar ANTES de /:id
// porque Express evalúa rutas en orden.
// Si /:id va primero, 'categoria' se interpretaría
// como un ID y fallaría.
// =============================================
router.get('/categoria/:categoria', async (req, res) => {
  try {
    const categoriasValidas = ['pistola','fusil','ametralladora','francotirador','escopeta','otro'];
    if (!categoriasValidas.includes(req.params.categoria)) {
      return res.status(400).json({ error: 'Categoría no válida' });
    }

    const armas = await Arma.find({
      categoria:  req.params.categoria,
      disponible: true
    }).sort({ nombre: 1 }); // Orden alfabético por nombre

    res.json({ total: armas.length, armas });
  } catch (error) {
    res.status(500).json({ error: 'Error al filtrar por categoría' });
  }
});

// =============================================
// GET /api/armas/:id
// Obtiene una arma por ID. Ruta PÚBLICA.
// =============================================
router.get('/:id', async (req, res) => {
  try {
    const arma = await Arma.findById(req.params.id)
      .populate('creadoPor', 'nombre');

    if (!arma || !arma.disponible) {
      return res.status(404).json({ error: 'Arma no encontrada' });
    }

    res.json(arma);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'ID de arma inválido' });
    }
    res.status(500).json({ error: 'Error al obtener el arma' });
  }
});

// =============================================
// POST /api/armas
// Crea una nueva arma. Requiere autenticación.
// =============================================
router.post('/', verificarToken, async (req, res) => {
  try {
    const {
      nombre, modelo, fabricante, pais,
      categoria, calibre, capacidad,
      alcanceEfectivo, peso, descripcion, imagen
    } = req.body;

    const nuevaArma = new Arma({
      nombre, modelo, fabricante, pais,
      categoria, calibre, capacidad,
      alcanceEfectivo, peso, descripcion, imagen,
      // req.usuario viene del middleware verificarToken
      creadoPor: req.usuario.id
    });

    await nuevaArma.save();

    res.status(201).json({
      mensaje: 'Arma registrada exitosamente',
      arma: nuevaArma
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const mensajes = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: mensajes.join(', ') });
    }
    res.status(500).json({ error: 'Error al registrar el arma' });
  }
});

// =============================================
// PUT /api/armas/:id
// Actualiza una arma. Requiere autenticación.
// =============================================
router.put('/:id', verificarToken, async (req, res) => {
  try {
    const arma = await Arma.findById(req.params.id);

    if (!arma) {
      return res.status(404).json({ error: 'Arma no encontrada' });
    }

    // Solo el creador o un admin pueden editar
    const esCreador = arma.creadoPor?.toString() === req.usuario.id;
    const esAdmin   = req.usuario.rol === 'admin';

    if (!esCreador && !esAdmin) {
      return res.status(403).json({ error: 'No tienes permiso para editar este registro' });
    }

    const armaActualizada = await Arma.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      mensaje: 'Arma actualizada exitosamente',
      arma: armaActualizada
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const mensajes = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: mensajes.join(', ') });
    }
    res.status(500).json({ error: 'Error al actualizar el arma' });
  }
});

// =============================================
// DELETE /api/armas/:id
// Elimina (desactiva) un arma. Solo admins.
// =============================================
router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    const arma = await Arma.findByIdAndUpdate(
      req.params.id,
      { disponible: false },
      { new: true }
    );

    if (!arma) {
      return res.status(404).json({ error: 'Arma no encontrada' });
    }

    res.json({ mensaje: 'Arma eliminada del catálogo exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el arma' });
  }
});

module.exports = router;
