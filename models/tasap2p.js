
const mongoose = require('mongoose');

// --- Esquema de MongoDB ---
const TasaSchema = new mongoose.Schema({
    nombre: { type: String, default: "P2P", unique: true },
    valor: Number,
    ultimaActualizacion: { type: Date, default: Date.now }
});


module.exports = mongoose.model('P2P', TasaSchema );
