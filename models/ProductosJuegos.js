const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // Identificador único del producto en la API de Shop2TopUp (ej: "free_fire_100")
  apiProductId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  // Nombre visible (ej: "100 Diamantes Free Fire")
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  // Categoría o Juego (Free Fire, Roblox, Arena Breakout)
  category: {
    type: String,
    required: true,
    index: true
  },
  
  imageUrl: {
    type: String,
    default: '/img/default-game.png'
  },

  // 1. PRECIO SI PAGAN EN USD (Ej: $12)
  priceUsd: {
    type: Number,
    required: true,
    min: 0
  },

  // 2. PRECIO DE REFERENCIA EN USD SI PAGAN EN BS (Ej: $14, para cubrir tus márgenes y comisiones P2P)
  priceBsRefUsd: {
    type: Number,
    required: true,
    min: 0
  },

  stockStatus: {
    type: String,
    enum: ['AVAILABLE', 'OUT_OF_STOCK', 'DISABLED'],
    default: 'AVAILABLE'
  },

  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// =========================================================================
// MÉTODOS PARA OBTENER EL PRECIO SEGÚN EL MÉTODO DE PAGO
// =========================================================================

/**
 * Retorna el precio exacto si el cliente paga en USD
 */
productSchema.methods.getUsdPrice = function() {
  return this.priceUsd;
};

/**
 * Calcula el precio final en Bolívares multiplicando tu referencia en USD (ej: $14) por la tasa de Binance
 */
productSchema.methods.calculateBsPrice = function(tasaBinance) {
  const totalBs = this.priceBsRefUsd * tasaBinance;
  return parseFloat(totalBs.toFixed(2));
};

module.exports = mongoose.model('Product', productSchema);