const mongoose = require('mongoose');

const ClienteSchema = new mongoose.Schema({


      nombre: { type: String, required: true, trim: true },
        // --- IDENTIFICACIÓN DEL CLIENTE ---
  cedula: { 
    type: String, 
    required: true, 
    trim: true,
    uppercase: true 
    // NOTA: Quitamos unique: true de aquí porque el índice único será compuesto
  },

  telefono: { type: String, required: true, trim: true },
  fechaNacimiento: { type: Date },

  ocupacion: { type: String, trim: true },



  totalGastadoHistorico: { type: Number, default: 0 },
  saldoDeudoraTotal: { type: Number, default: 0 },
  fechaRegistro: { type: Date, default: Date.now },
    // --- IDENTIFICADOR DEL NEGOCIO (EL DUEÑO DEL DATO) ---
  negocio: { 
        type: String, // ID del negocio
        required: true
    }
});

// --- EL TRUCO PARA QUE SEA ÚNICO POR NEGOCIO ---
// Esto dice: "Solo puede existir una cédula igual DENTRO del mismo negocio"
ClienteSchema.index({ negocio: 1, cedula: 1 }, { unique: true });

// Índice opcional para búsquedas rápidas por nombre dentro de ese negocio
ClienteSchema.index({ negocio: 1, nombre: 'text' });

module.exports = mongoose.model('Cliente', ClienteSchema);
