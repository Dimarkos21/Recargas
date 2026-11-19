const mongoose = require('mongoose');

const FacturacionSchema = new mongoose.Schema({
    cliente: { type: String,default: "Sin Cliente" },

    telefono: { type: Number,default: 0 },
    formula: {
       paciente: String,
       Edad: Number ,
        od: {
            esfera: { type: String },
            cilindro: { type: String },
            eje: { type: String},
            adicion: { type: String }
        },
        oi: {
            esfera: { type: String },
            cilindro: { type: String },
            eje: { type: String },
            adicion: { type: String}
        },
        // --- Detalles Técnicos ---
        cristales: String,      // Tipo de cristales
        tratamiento: String,    // Antirreflejo, Blue Block, etc.
        dp: String,             // Distancia Pupilar
        altura: String ,         // Campo "Altura" de tu imagen
        precio: Number,
    },
      formula1: {
        paciente: String,
Edad: Number,

        od: {
            esfera: { type: String },
            cilindro: { type: String },
            eje: { type: String},
            adicion: { type: String }
        },
        oi: {
            esfera: { type: String },
            cilindro: { type: String },
            eje: { type: String },
            adicion: { type: String}
        },
        // --- Detalles Técnicos ---
        cristales: String,      // Tipo de cristales
        tratamiento: String,    // Antirreflejo, Blue Block, etc.
        dp: String,             // Distancia Pupilar
        altura: String ,         // Campo "Altura" de tu imagen
        precio: Number,
    },
// ARRAY de Formulas para asi poder registrar varios pacientes
// ARRAY estructurado de Fórmulas para registrar varios pacientes con tipado fuerte:
    //formulas: [{
  //      paciente: String, // <-- Crucial agregarlo aquí para saber de quién es cada fórmula
   //     od: {
   //         esfera: String,
   //         cilindro: String,
    //        eje: String,
    //        adicion: String
    //    },
    //    oi: {
    //        esfera: String,
    //        cilindro: String,
     //       eje: String,
     //       adicion: String
     //   },
     //   cristales: String,
    //    tratamiento: String,
    //    dp: String,
     //   altura: String,
     //   precio: Number
   // }], 
    productos: {
        type: mongoose.Schema.Types.Mixed, // Esto permite que sea un String o un Array
        required: true
    },
    Pprecio: String,
    cedula: { type: String,default: "V000000" },
    metodo: String,
    moneda: String,
    precio: String,
    conversion: String,
    tasa: String,
    factura: String,
    tipodeabono: String,
   

    Impuestos : {
        BaseImponible: Number,
        Iva: Number,
        Exento : Number,

    },
    // SECCIÓN DE FINANZAS / CRÉDITO
    finanzas: {
        ABONO:  { type: Number,default: 0 },
        totalVenta: { type: Number, default: 0},
        abonoInicial: { type: Number,default: 0 }, // El pago que hizo al momento
        saldoPendiente: { type: Number,default: 0}, // Lo que quedó restando
        
        cuotas: [{
            nombre: { type: String }, // "Cuota 1", "Cuota 2", etc.z
            monto: { type: Number, required: true },
    Abono:     { type: Number, },
            fechaVencimiento: { type: Date },
            pagado: { type: Boolean, default: false },
            fechaPagoRealizado: { type: Date },
            referencia: { type: String } // Por si pagan por transferencia
        }]
    },
     vendedor: {
        nombre: String,

        numero: Number,
    },
    fecha: String,
    checked: Boolean,

sucursal: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Optica_Sedes',
  
},
negocio: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'negocios' 
    }
}, { timestamps: true }); // <-- AGREGA ESTO AQUÍ


module.exports = mongoose.model('facturacion', FacturacionSchema);
