const mongoose = require('mongoose');

const Gastos = new mongoose.Schema({
  nombre: { type: String, required: true },

  precio: { type: Number, required: true },
tasaCambio: { type: Number, required: true  },
tasaCambioDia: { type: Number, required: true  },
    categoria: String,
  fecha: { type: Date, default: Date.now },

  // Campos derivados (se llenan solos)
  mes: { type: Number },
  año: { type: Number },
  
  checked: { type: Boolean, default: false },
   negocio: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'negocios' // Relación con el usuario
        
    }
});

// Middleware: Antes de guardar, extrae el mes y año automáticamente de la fecha
Gastos.pre('save', function(next) {
  if (this.fecha) {
    this.mes = this.fecha.getMonth() + 1; // getMonth() devuelve 0-11, por eso +1
    this.año = this.fecha.getFullYear();
  }
  next();
});

module.exports = mongoose.model('Control_Gastos', Gastos);

