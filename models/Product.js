const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  external_id: { type: Number, required: true, unique: true }, // ID único del producto en la API externa
  name: { type: String, required: true },                       // Nombre del paquete (ej: 880 CP, 1000 G-Coins)
  
  // Precios y costos
  cost_price_usd: { type: Number, required: true },             // Costo base limpio que te cobra la API (USD)
  sell_price_usd: { type: Number, required: true },             // Precio de venta sugerido con tu margen de ganancia (USD)
  
  // Relación con el modelo Game (Categoría Principal)
  game: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Game', 
    required: true 
  },
  Bonos_o_Paquetes: {type: String , },
  category_id: { type: Number, default: null },                 // ID de categoría o servidor de la API si aplica
  product_type: { type: String, default: 'topup' },             // Tipo de producto (ej: 'topup', 'voucher')
  is_available: { type: Boolean, default: true },               // Estado de disponibilidad
  lastSyncedAt: { type: Date, default: Date.now }     
  ,regions: [{ type: String }]
            // Fecha de la última sincronización del cron
}, { 
  timestamps: true // Añade automáticamente createdAt y updatedAt
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;