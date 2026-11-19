const mongoose = require('mongoose');

const deudaTotalSchema = new mongoose.Schema({
    negocio: { type: mongoose.Schema.Types.ObjectId, ref: 'Negocio', required: true, unique: true },
    montoTotal: { type: Number, default: 0 }, // Acumulado histórico de todas las ventas a crédito
montoTotalPagado: { type: Number, default: 0 },
    montoTotalPendiente: { type: Number, default: 0 }, // Deuda global de todo el negocio
    cantidadFacturasConDeuda: { type: Number, default: 0 }, // Cuántas facturas tienen saldo pendiente



} , { 
    timestamps: true 
});
const DeudaTotal = mongoose.model('DeudaTotal', deudaTotalSchema);

module.exports = DeudaTotal;
