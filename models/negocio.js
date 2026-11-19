const mongoose = require('mongoose');

const negocioSchema = new mongoose.Schema({
    tipoNegocio: {
    type: String,
    required: true,
    enum: [
        "Optica",
        "Bodega",
        "Boutique",
        "Ferreteria",
        "Repuestos",
        "Cosmeticos",
        "Tecnologia",
        "Panaderia",
        "General"
    ],
    default: "Boutique" // O el valor por defecto que prefieras según tu sistema actual
},
    Info: {
   logo: String,
    rif: String,
    Direccion:  String,
    Celular:  Number,
    

    },
    Pagomovil :{
        Cedula: String,
        Banco: String,
        Telefono : Number,
    },
    nombre: { type: String, required: true },
    direccion: String,
    telefono: String,
    
    // Referencia al usuario que es el propietario legal/principal
    propietario: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
    },
  
    // 1. Fecha exacta en la que vence el acceso
    planExpiresAt: { 
        type: Date, 
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },

    // 2. Estado simplificado para bloqueos rápidos
    status: { 
        type: String, 
        enum: ['activo', 'bloqueado'], 
        default: 'activo' 
    },

    // 3. Historial (Opcional pero recomendado para saber cuándo pagó por última vez)
    ultimoPago: {
        type: Date
    },
     plan: { type: String , default: "Historial_Clinico"},
     permisos: {
        productos: {type: Number , default : 1500},
        Empleados:  {type : Number , default : 2 },

     },
     contadores: {
        sku: { type: Number, default: 0 },
        pacientes: { type: Number, default: 0 }, // <-- NUEVO
        clientes: { type: Number, default: 0 } ,  // <-- NUEVO
        productos: { type: Number, default: 0 }  // <-- NUEVO
    },
     Opticas: { type: Number , default: 1},
    // 🛑 ¡ESTA ES LA CORRECCIÓN CLAVE! 🛑
    // Ahora 'empleados' acepta un objeto (subdocumento) que contiene el ID y el rol.
 // Empleados se mudaron a un subdocumento para incluir el rol directamente en la relación user
    planes: {
        vence: String,
    },
    ordenes:{}
});

module.exports = mongoose.model('Negocio', negocioSchema);