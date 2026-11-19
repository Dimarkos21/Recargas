const mongoose = require('mongoose');

const  PRouterSchema = new mongoose.Schema({
    nombre: String,
    cantidad: Number,
    
    costo: Number,
    precio: Number,
productoId : String,
    fecha: String,
vendedor: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'user' // El nombre del modelo donde guardas a tus vendedores
},
    imagen: {
        data: Buffer, // Almacena los datos binarios
        contentType: String // Almacena el tipo de archivo (por ejemplo: "image/jpeg")
    },
    checked: Boolean,
 negocio: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'negocios' // Relación con el usuario
    },
    sucursal: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Optica_Sedes',
      
    },
});

module.exports = mongoose.model('PRouter', PRouterSchema);
