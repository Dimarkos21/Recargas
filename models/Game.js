const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  external_id: { type: Number, required: true, unique: true }, // ID del juego que viene de la API externa
  name: { type: String, required: true },                       // Nombre del juego
  description: { type: String, default: '' },                   // Descripción breve del juego
  image_url: { type: String, default: '' }, 
  regions: [{ type: String }],
  
  // 👉 ESTE ES EL CAMPO QUE AGREGUé PARA VINCULARLO CON LA CATEGORÍA PRINCIPAL:
  game_principal: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'GamePrincipal', 
    default: null 
  }
}, { 
  timestamps: true 
});

const Game = mongoose.model('Game', gameSchema);

module.exports = Game;