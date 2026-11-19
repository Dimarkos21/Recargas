const mongoose = require('mongoose');

const pagoSchema = new mongoose.Schema({
    referencia: { 
        type: String, 
        unique: true, // Anti-fraude: MongoDB rechaza duplicados automáticamente
        sparse: true, // Evita error E11000 cuando aún no hay referencia
        trim: true 
    },
    uuid: {
        type: String,
        unique: true,
        sparse: true, // Evita error E11000 antes de recibir el UUID de R4
        index: true,
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
    fechaPago: { 
        type: Date, 
        default: Date.now 
    }
}, { 
    timestamps: true 
});

// Índice compuesto para que los vigilantes consulten sin sobrecargar MongoDB Atlas
pagoSchema.index({ estatus: 1, utilizado: 1, createdAt: 1 });

// Mantiene el nombre de modelo 'Pago' para seguir apuntando a tu colección actual en MongoDB
const Pago = mongoose.models.Pago || mongoose.model('Pago', pagoSchema);

module.exports = Pago;