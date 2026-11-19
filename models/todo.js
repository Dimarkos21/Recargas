const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
    // --- Datos Personales ---
    cliente:String,
    paciente: { type: String, required: true },
    cedula: { type: String, required: true },
    edad: Number,
    telefono: String,
    patologia: String,

    // --- FÓRMULA ÓPTICA (Anidada para mayor orden) ---
    formula: {
        od: {
            esfera: { type: String, default: "0.00" },
            cilindro: { type: String, default: "0.00" },
            eje: { type: String, default: "0" },
            adicion: { type: String, default: "0.00" }
        },
        oi: {
            esfera: { type: String, default: "0.00" },
            cilindro: { type: String, default: "0.00" },
            eje: { type: String, default: "0" },
            adicion: { type: String, default: "0.00" }
        },
        // --- Detalles Técnicos ---
        cristales: String,      // Tipo de cristales
        tratamiento: String,    // Antirreflejo, Blue Block, etc.
        dpOd: String,            // DP Ojo Derecho (Recomendado)
        dpOi: String,            // DP Ojo Izquierdo (Recomendado)
        dpBinocular: String,     // DP Total por si acaso
        dp: String,             // Distancia Pupilar
        altura: String          // Campo "Altura" de tu imagen
    },
    oftamologia : {
        OD : {    Lejos : {  type : String , },
            Cerca: {  type : String , },
            PIO : {  type : String , },
               DNP_L : {  type : String , } ,
               DNP_C: {  type : String , } ,
               DV : {  type : String , } ,
               AP: {  type : String , } ,
               AF  : {  type : String , } ,
        } , 
        
        OI : {
            Lejos : {  type : String , },
            Cerca: {  type : String , },
            PIO : {  type : String , },
               DNP_L : {  type : String , } ,
               DNP_C: {  type : String , } ,
               DV: {  type : String , } ,
             AP  : {  type : String , } ,
             AF : {  type : String , } ,
        },
        
   
    }
,
    // --- Datos de Venta/Servicio ---
    montura: String,
    resultados: String,
    fecha: { type: Date, default: Date.now },
    checked: { type: Boolean, default: true },
      // --- Tiempo de expiracion del producto---
  deletedAt: { type: Date, default: null },
 responsable: {
    nombre: { type: String, required: true },
    ID: {   type: mongoose.Schema.Types.ObjectId, required: true }
},


    // --- Relación con Negocio ---
    negocio: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'negocios',
        required: true
    }
    ,
    sucursal: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Optica_Sedes',
      
    },
}, { 
    timestamps: true // Crea automáticamente createdAt y updatedAt
});


todoSchema.set('toJSON', {

    transform: (document, returnedObject) => {

        returnedObject.id = returnedObject._id.toString();

        delete returnedObject._id;

        delete returnedObject.__v;

    }

});




const Todo = mongoose.models.Todo || mongoose.model('todos', todoSchema);

module.exports = Todo;