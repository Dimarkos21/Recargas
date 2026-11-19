const mongoose = require('mongoose');

const FacturacionHistoricoSchema = new mongoose.Schema({
    // --- DATOS DE IDENTIFICACIÓN ORIGINAL ---
    originalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facturacion' },
    negocio: { type: mongoose.Schema.Types.ObjectId, ref: 'Negocio', required: true, index: true },


    // --- DATOS DEL CLIENTE (Snapshot) ---
    // Guardamos los datos como texto por si el cliente cambia o se borra luego
    clienteNombre: String,
   
Responsable : String,

    // --- CONTENIDO DE LA NOTA ---
 

details : { type: Object },

    // --- METADATOS DE ARCHIVADO ---
    fechaCreacionOriginal: { type: Date },
    fechaArchivado: { 
        type: Date, 
        default: Date.now, 
        index: { expires: '10y' } // <--- ELIMINACIÓN AUTOMÁTICA EN 10 AÑOS
    },

    motivoArchivado: { type: String, default: 'Vaciado de papelera' },
    vaciadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }

}, { timestamps: true });

module.exports = mongoose.model('FacturacionHistorico', FacturacionHistoricoSchema);