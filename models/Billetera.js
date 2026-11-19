const mongoose = require('mongoose');

const  BilleteraSchema = new mongoose.Schema({
 
 
  usuario: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },

  saldo: { 
    type: Number, 
    required: true, 
    default: 0,
    min: 0 // Evita saldos negativos a nivel de base de datos
  },
  // Saldo retenido (ej: transacciones en proceso o en disputa)
  saldoRetenido: { 
    type: Number, 
    required: true, 
    default: 0,
    min: 0 
  },
  estado: { 
    type: String, 
    enum: ['ACTIVA', 'BLOQUEADA', 'SUSPENDIDA'], 
    default: 'ACTIVA' 
  },
  // Campo de control de concurrencia optimista (Evita dobles cobros simultáneos)
  __v: { type: Number } 
}, { 
  timestamps: true 
});

// Índice único para asegurar que un usuario solo tenga una billetera por moneda por negocio
 BilleteraSchema.index({  usuario: 1, }, { unique: true });

module.exports = mongoose.model('Billetera', BilleteraSchema);