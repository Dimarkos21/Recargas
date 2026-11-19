// helpers/verificarStockCarrito.js
/**
 * Verifica que los productos del carrito no excedan el stock disponible en la BD
 * @param {Array} carrito - [{ productoId, cantidad }]
 * @param {Array} productosBD - Inventario actual desde la BD
 * @returns {Object} { success: true/false, faltantes: [] }
 */


function verificarStock(carrito, productosBD) {
console.log("🛒 IDs carrito:", carrito.map(c => c._id.toString()));
console.log("📦 IDs inventario:", productosBD.map(p => p._id.toString()));


  const faltantes = [];

  if (!Array.isArray(carrito) || carrito.length === 0) {
    console.log("❌ Carrito no es array o está vacío");
    return { success: false, faltantes: [{ error: "El carrito está vacío o mal formado." }] };
  }

  for (const item of carrito) {
    console.log("➡️ Revisando item del carrito:", item);

    // Buscar producto en BD por _id
    const producto = productosBD.find(p => {
      console.log("🔍 Comparando BD _id:", p._id.toString(), "con carrito _id:", item._id?.toString());
      return p._id.toString() === item._id?.toString();
    });

    if (!producto) {
      console.log("❌ Producto no encontrado en inventario:", item._id);
      faltantes.push({ productoId: item._id, error: "Producto no encontrado en inventario" });
      continue;
    }

    console.log("✅ Producto encontrado:", producto.nombre, "Stock:", producto.cantidad, "Solicitado:", item.cantidad);

    if (producto.cantidad < item.cantidad) {
      console.log("⚠️ Stock insuficiente para:", producto.nombre);
      faltantes.push({
        productoId: item._id,
        nombre: producto.nombre,
        solicitado: item.cantidad,
        disponible: producto.cantidad
      });
    } else {
      console.log("👌 Stock suficiente para:", producto.nombre);
    }
  }

  console.log("📊 Resultado final faltantes:", faltantes);

  return {
    success: faltantes.length === 0,
    faltantes
  };
}




module.exports = verificarStock;
