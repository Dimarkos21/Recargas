const mongoose = require("mongoose");

const EstadisticaSucursalesSchema = new mongoose.Schema({

  anio: { type: Number, required: true },
  mes: { type: Number, required: true },

  // --- FINANZAS ---
 metricas : {
    TotalFacturado: {type: Number , default: 0},
    TotalFacturadoBs: { type: Number, default: 0 },
    ProductosVendidos: { type: Number, default: 0 }
    
 }

  // --- MÉTRICAS DE OPERACIONES ---
 

  // --- MÉTRICAS DE Total Facturado por negocio---

,

    sucursal: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Optica_Sedes", 
    required: true 
  },
    negocio: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "negocios", 
    required: true 
  },

  ultimoMovimiento: { type: String, default: "Sin actividad" }
}, { 
  timestamps: true,
  // minimize: false asegura que Mongoose guarde los objetos vacíos {} 
  // en la base de datos al crearse el documento por primera vez.
  minimize: false 
});

EstadisticaSucursalesSchema .index({ negocio: 1, anio: 1, mes: 1 }, { unique: true });

module.exports = mongoose.model("EstadisticasSucursales", EstadisticaSucursalesSchema );