const mongoose = require('mongoose');

// Define el esquema para los registros de auditoría
const AuditLogSchema = new mongoose.Schema({
    action: { 
        type: String, 
        required: true,
        // Acciones posibles: CREADO, ACTUALIZADO, ELIMINADO
        enum: ['CREATED', 'UPDATED', 'DELETED']
    },
    entityType: { 
        type: String, 
        required: true // Ej: 'Producto', 'Usuario', 'Factura'
    },
    entityId: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true // ID del documento afectado
    },
    userId: { 
        type: String, 
        required: true // Usuario que realizó la acción
    },
     UserAction: {
  type: Object,
  required: true
}
,
    negocio: { 
        type: String, // ID del negocio
        required: true
    },
    timestamp: { 
        type: Date, 
        default: Date.now 
    },
      //     createdAt: { type: Date, default: Date.now, expires: 1296000 },
    // Guarda los datos relevantes del cambio (ej: nombre anterior, precio nuevo, etc.)
    details: mongoose.Schema.Types.Mixed 
});

// Patrón de seguridad para evitar OverwriteModelError
const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);

module.exports = AuditLog;