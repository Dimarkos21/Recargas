// models/StockLog.js
const mongoose = require('mongoose');

const StockLogSchema = new mongoose.Schema({
  productoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Producto',
    required: true
  },
  tipoMovimiento: {
    type: String,
    enum: ['entrada', 'salida', 'ajuste'],
    required: true
  },
  cantidad: { type: Number, required: true },
  usuario: { type: String, required: true }, // quién hizo el movimiento
  motivo: { type: String }, // opcional: devolución, venta, compra, etc.
  fecha: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('StockLog', StockLogSchema);
