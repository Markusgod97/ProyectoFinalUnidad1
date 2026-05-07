const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const usuarioSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,       // Tipo de dato
      required: [true, 'El nombre es obligatorio'],  // Validación + mensaje
      trim: true,         // Elimina espacios al inicio y final automáticamente
      minlength: [2, 'El nombre debe tener mínimo 2 caracteres']
    },

    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      unique: true,       // MongoDB crea un índice único → no puede repetirse
      lowercase: true,    // Guarda siempre en minúsculas para evitar duplicados
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'El email no tiene un formato válido'
      ]
    },

    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [6, 'La contraseña debe tener mínimo 6 caracteres'],
      // select: false hace que este campo NO se devuelva en las consultas
      // por defecto. Hay que pedirlo explícitamente con .select('+password')
      select: false
    },

    rol: {
      type: String,
      enum: ['admin', 'usuario'],  // Solo acepta estos dos valores
      default: 'usuario'           // Si no se especifica, será 'usuario'
    },

    activo: {
      type: Boolean,
      default: true
    }
  },
  {
    // timestamps: true agrega automáticamente los campos:
    // createdAt (fecha de creación) y updatedAt (última modificación)
    // ¿Se puede quitar? Sí, pero perderías esa información automática
    timestamps: true
  }
);

usuarioSchema.pre('save', async function (next) {

  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

usuarioSchema.methods.verificarPassword = async function (passwordIngresada) {
  return await bcrypt.compare(passwordIngresada, this.password);
};

module.exports = mongoose.model('Usuario', usuarioSchema);