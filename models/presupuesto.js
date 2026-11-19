const mongoose = require('mongoose');

const PresupuestoSchema = new mongoose.Schema({
/* ============================================================
    LISTA DE PRECIOS / ESQUEMA DE PRESUPUESTOS - ÓPTICA
    (No ejecutable)
    ============================================================

    // Visión Sencilla
    Vision_sencilla: Number,  
    Vision_sencilla_Tratamiento: Number,  
    Vision_sencilla_Tratamiento_Foto: Number,
    Vision_sencilla_Poli: Number, 

    // Visión Tallado
    Vision_Tallado: Number,
    Vision_Tallado_Tratamiento: Number,
    Vision_Tallado_Tratamiento_Foto: Number,
    Vision_Tallado_Poli: Number, 

    // Visión Fórmula Alta
    Vision_Alta_Tratamiento_Foto: Number,
    Vision_Formula_Alta: Number,
    Vision_Formula_Alta_AR: Number,
    Vision_Formula_Alta_Foto: Number,
    Vision_Formula_Alta_Poli: Number, 

    // Bifocales
    Bifocales: Number,
    Bifocales_Tratamiento: Number,
    Bifocales_Tratamiento_Foto: Number,
    Bifocales_Poli: Number, 

    // Bifocales Tallados
    Bifocales_Tallados: Number,
    Bifocales_Tallados_Tratamiento: Number,
    Bifocales_Tallados_Tratamiento_Foto: Number,
    Bifocales_Tallados_Poli: Number, 

    // Bifocales Alta
    Bifocales_Alta: Number,
    Bifocales_Alta_AR: Number,
    Bifocales_Alta_Foto: Number,
    Bifocales_Alta_Poli: Number, 

    // Multifocales
    Multifocales: Number,
    Multifocales_Tratamiento: Number,
    Multifocales_Tratamiento_Foto: Number,
    Multifocales_Poli: Number, 

    // Multifocales Tallados
    Multifocales_Tallados: Number,
    Multifocales_Tallados_Tratamiento: Number,
    Multifocales_Tallados_Tratamiento_Foto: Number,
    Multifocales_Tallados_Poli: Number, 

    // Multifocales Alta
    Multifocales_Alta: Number,
    Multifocales_Alta_AR: Number,
    Multifocales_Alta_Foto: Number,
    Multifocales_Alta_Poli: Number, 
*/

fecha: String,
    beneficiario: {
        nombre: String,
        edad: Number,
        cedula: String,
        telefono: Number,
        direccion: String,
    },




    // Bloque 2: Diagnóstico y Materiales
    evaluacion: String,
    especificaciones: {
        montura: String,
        cristales: String
    },


    
    // Bloque 3: Costos (Usando tu lista comentada)
    // Aquí mapeas el valor seleccionado del catálogo
    cotizacion: {
        precioBase: Number, 
        tasaBCV: Number, // Ejemplo de tasa del día
        totalBs: Number
    },

    // Bloque 4: Seguimiento
    asesor: String,
    estatus: String
     // Puede ser: Pendiente, Pagado, Entregado
,
    checked: Boolean,
    ultimaActualizacion: { type: Date, default: Date.now },

    negocio: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'negocios' 
    }
    ,
    sucursal: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Optica_Sedes',
      
    },
});

module.exports = mongoose.model('Presupuesto', PresupuestoSchema);