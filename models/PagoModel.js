const mongoose = require('mongoose');

const pagoSchema = new mongoose.Schema({
    referencia: { 
        type: String, 
        trim: true 
    },
    uuid: {
        type: String,
        trim: true
    },
    proveedorRequestId: {
        type: String,
        trim: true,
        index: true
    },
    proveedorOrderId: {
        type: String,
        trim: true,
        index: true
    },
    ordenProcesada: {
        type: Boolean,
        default: false
    },
    responsable: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        index: true 
    },
    monto: { 
        type: Number, 
        required: true 
    },
    montoVES: { 
        type: Number, 
        default: 0 
    },
    montoVESString: {
        type: String
    },
    bancoEmisor: { 
        type: String, 
        default: 'Billetera Interna' 
    },
    telefonoEmisor: { 
        type: String, 
        default: 'N/A' 
    },
    cedula: {
        type: String,
        default: 'N/A'
    },
    Producto: { 
        type: String, 
        required: true 
    },
    juegoId: {
        type: Number
    },
    playerId: {
        type: String
    },
    precioUnitarioUsd: {
        type: Number
    },
    Cantidad: { 
        type: Number, 
        required: true 
    },
    concepto: { 
        type: String 
    },
    tipoTransaccion: { 
        type: String, 
        enum: ['Billetera', 'Pagomovil', 'Binance', 'DebitoInmediato'], 
        default: 'Billetera' 
    },
    referenciaBancaria: {
        type: String,
        trim: true
    },
    codigoErrorR4: {
        type: String
    },
    detalleError: {
        type: String
    },
    estatus: { 
        type: String, 
        enum: [
            'APROBADO', 
            'DEBITO_APROBADO', 
            'PENDIENTE', 
            'RECHAZADO', 
            'REEMBOLSADO', 
            'OTP_SOLICITADO', 
            'PROCESANDO_R4',
            'EN_ESPERA_SIMF',
            'ENVIANDO_PROVEEDOR',
            'REVISION_MANUAL'
        ], 
        default: 'PENDIENTE' 
    },
    utilizado: { 
        type: Boolean, 
        default: false 
    },
    intentosRescate: {
        type: Number,
        default: 0
    },
    rescateTardioRealizado: {
        type: Boolean,
        default: false
    },
    fechaPago: { 
        type: Date, 
        default: Date.now 
    }
}, { 
    timestamps: true 
});

// Índices únicos seguros (ignoran null y strings vacíos evitando errores E11000)
pagoSchema.index(
    { referencia: 1 },
    { unique: true, partialFilterExpression: { referencia: { $type: 'string', $gt: '' } } }
);
pagoSchema.index(
    { uuid: 1 },
    { unique: true, partialFilterExpression: { uuid: { $type: 'string', $gt: '' } } }
);

// Índices compuestos para que los vigilantes consulten sin sobrecargar MongoDB Atlas
pagoSchema.index({ estatus: 1, utilizado: 1, createdAt: 1 });
pagoSchema.index({ estatus: 1, updatedAt: 1 });

// Mantiene el nombre de modelo 'Pago' para seguir apuntando a tu colección actual en MongoDB
const Pago = mongoose.models.Pago || mongoose.model('Pago', pagoSchema);

module.exports = Pago;