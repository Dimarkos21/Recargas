const mongoose = require("mongoose");

const EstadisticasSchema = new mongoose.Schema({
  negocio: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Negocio", 
    required: true 
  },
  anio: { type: Number, required: true },
  mes: { type: Number, required: true },
  // --- Propietario Facturo ---
 
  // --- FINANZAS ---
  resumenFinanciero: {
    ingresos: { type: Number, default: 0 }, 
    egresos: { type: Number, default: 0 },  
    ganancia: { type: Number, default: 0 }  
  },

  // --- MÉTRICAS DE OPERACIONES ---
  metricas: {
    productosVendidos: { type: Number, default: 0 },
    nuevosProductos: { type: Number, default: 0 },
    nuevosClientes: { type: Number, default: 0 },
    clientesActivos: { type: Number, default: 0 },
       CristalesTotalPrecio: { type: Number, default: 0 }  , // Flujo real
    totalFacturado: { type: Number, default: 0 },   // Bruto total
    totalCobrado: { type: Number, default: 0 },     // Flujo real
    cuotasPendientes: { type: Number, default: 0 } , // Deuda por cobrar
  BOLIVAR: { type: Number, default: 0 },
  GastoBolivar :{ type: Number, default: 0 },
      GastoDolar :{ type: Number, default: 0 },
      
  },
metodosPago: {
    Efectivo_Bs: { type: Number, default: 0 },
    Efectivo_Dolares: { type: Number, default: 0 },
    PagoMovil: { type: Number, default: 0 },
    Punto_Venta: { type: Number, default: 0 },
    Zelle: { type: Number, default: 0 },
    Transferencia: { type: Number, default: 0 },
    Binance: { type: Number, default: 0 }
},
  // --- MÉTRICAS DE Total Facturado por negocio---

  // --- NUEVAS MÉTRICAS Y RANKINGS (Estructura dinámica) ---
rankingVendedores: { 
    type: Map, 
    of: new mongoose.Schema({
        nombre: String, // <--- Agregamos esto
        cantidadVentas: { type: Number, default: 0 },
        montoGenerado: { type: Number, default: 0 },
        productosVendidos: { type: Number, default: 0 }
    }),
    default: {} 
},
  rankingProductos: { type: mongoose.Schema.Types.Mixed, default: {} },
  ventasPorCategoria: { type: mongoose.Schema.Types.Mixed, default: {} },
    Impuestos : {
        BaseImponible: Number,
        Iva: Number,
        Exento : Number,

    },
  // --- HISTORIAL ---
  historial: [{
    tipo: { type: String, enum: ['INGRESO', 'EGRESO', 'PAGO_CUOTA'] },
    monto: Number,
    descripcion: String,
    fecha: { type: Date, default: Date.now }
  }],

  ultimoMovimiento: { type: String, default: "Sin actividad" }
}, { 
  timestamps: true,
  // minimize: false asegura que Mongoose guarde los objetos vacíos {} 
  // en la base de datos al crearse el documento por primera vez.
  minimize: false 
});

EstadisticasSchema.index({ negocio: 1, anio: 1, mes: 1 }, { unique: true });

module.exports = mongoose.model("Estadisticas", EstadisticasSchema);