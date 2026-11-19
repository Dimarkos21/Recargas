const mongoose = require('mongoose');

const MasterSchema = new mongoose.Schema({
    email: { type: String, required: true },
    password: { type: String, required: true },
    rol: { type: String, default: 'admin_supremo' }
}, { collection: 'master_users' }); // Esto es clave: apunta a tu nueva tabla

module.exports = mongoose.model('Master', MasterSchema);