const mongoose = require('mongoose');
const Facturacion = require('./facturacion1');

const userSchema = new mongoose.Schema({
    name: String,
    email: { 
    type: String, 
    required: true, 
    unique: true,   // <-- ¡Aquí!
    lowercase: true // (Opcional pero muy recomendado para evitar duplicados por mayúsculas)
},
  
    numero: String,


        passwordHash: String,
  googleId: { type: String, required: false }, 
    
    rol: { type: String, default: 'cliente' },

      verified: {
        type: Boolean,
        default: false
    },
       
});



userSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;
        delete returnedObject.passwordHash;
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;