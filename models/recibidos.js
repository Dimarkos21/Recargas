const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true, // Evita que se dupliquen IDs de pedido (ej: ASX150197)
    index: true
  },
  Metodos: {
    type: String,
    enum: ['Billetera', 'Pagomovil', 'Binance'],
    required: true,
  },
  monto: {
    type: Number,
    required: true
  },
  Datos: {
    Player: Number,
    Game: String,
    productoID: Number,
    cantidad: Number,
  },
  status: {
    type: String,
    enum: ['Pendiente', 'Pagada', 'Expirada', 'Fallida'],
    default: 'Pendiente'
  },
  // Datos que te devuelve Binance al completarse el pago
  TransactionId: {
    type: String,
    unique: true,
    sparse: true, // Permite valores nulos al crear la orden, pero exige que sea único cuando se llena
    default: null
  },
  payerDetails: {
    type: Object,
    default: null
  },
  paidAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true // Crea automáticamente createdAt y updatedAt
});

module.exports = mongoose.model('Payment', paymentSchema);