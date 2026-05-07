const mongoose = require('mongoose');

const armaSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre del arma es obligatorio'],
      trim: true
    },

    modelo: {
      type: String,
      required: [true, 'El modelo es obligatorio'],
      trim: true
    },

    fabricante: {
      type: String,
      required: [true, 'El fabricante es obligatorio'],
      trim: true
    },

    pais: {
      type: String,
      required: [true, 'El país de origen es obligatorio'],
      trim: true
    },

    // enum restringe los valores aceptados.
    // Si se envía un valor diferente, Mongoose lanza un error de validación.
    categoria: {
      type: String,
      required: [true, 'La categoría es obligatoria'],
      enum: {
        values: ['pistola', 'fusil', 'ametralladora', 'francotirador', 'escopeta', 'otro'],
        message: 'Categoría no válida. Opciones: pistola, fusil, ametralladora, francotirador, escopeta, otro'
      }
    },

    calibre: {
      type: String,
      required: [true, 'El calibre es obligatorio'],
      trim: true
    },

    capacidad: {
      type: Number,
      required: [true, 'La capacidad de cargador es obligatoria'],
      min: [1, 'La capacidad debe ser al menos 1']
    },

    alcanceEfectivo: {
      type: Number,  // En metros
      required: [true, 'El alcance efectivo es obligatorio'],
      min: [1, 'El alcance debe ser mayor a 0']
    },

    peso: {
      type: Number,  // En kilogramos
      required: [true, 'El peso es obligatorio']
    },

    descripcion: {
      type: String,
      trim: true,
      maxlength: [500, 'La descripción no puede superar 500 caracteres']
    },

    imagen: {
      type: String,  // URL o ruta de la imagen
      default: ''
    },

    // Referencia al usuario que creó el registro.
    // type: mongoose.Schema.Types.ObjectId indica que es un ID de MongoDB.
    // ref: 'Usuario' le dice a Mongoose de qué modelo viene ese ID (para populate).
    creadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    },

    disponible: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Arma', armaSchema);