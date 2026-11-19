// models/Branch.js
const mongoose = require('mongoose');

const OpticaSedesSchema = new mongoose.Schema({
negocio: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true, 
    index: true 
  },

    nombre: { 
    type: String, 
    required: true, 
    trim: true 
  }, // Ej: "Sucursal Centro"
  
  ciudad: { 
    type: String, 
    required: true 
  },
  estado: { 
    type: String, 
    required: true 
  },




direccion: { 
    type: String, 
    required: true 
  },
numero: { 
    type: String 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },

  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Optica_Sedes', OpticaSedesSchema);


