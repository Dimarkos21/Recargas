const mongoose = require('mongoose');

const inventarioSchema = new mongoose.Schema({
    producto: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Producto', // Se conecta con tu modelo global de productos
        required: true 
    },
    sucursal: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Optica_Sedes', // Se conecta con tu modelo de sucursales
        required: true 
    },
    stockActual: { 
        type: Number, 
        default: 0,
        required: true 
    },
    stockMinimo: { 
        type: Number, 
        default: 2 
    }
}, { 
    timestamps: true 
});

// Índice compuesto único: Evita que existan dos registros del mismo producto en la misma sucursal
inventarioSchema.index({ producto: 1, sucursal: 1 }, { unique: true });

const Inventario = mongoose.models.Inventario || mongoose.model('Inventario', inventarioSchema);
module.exports = Inventario;