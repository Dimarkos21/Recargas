const mongoose = require('mongoose');

const GamePrincipalSchema = new mongoose.Schema({
    external_id: { type: Number, required: true, unique: true }, // <-- Asegúrate de tener esto
    name: { type: String, required: true },
    description: String,
    image_url: String
});

module.exports = mongoose.model('GamePrincipal', GamePrincipalSchema);