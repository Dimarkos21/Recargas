// stockController.js
const express = require('express');
const router = express.Router();

/**
 * Rebaja productos del stock
 * - Recibe un array de productos con { nombre, cantidad }
 * - Resta la cantidad indicada del inventario actual
 * - Devuelve el inventario actualizado
 */
let inventario = [
  { nombre: 'Laptop', cantidad: 10 },
  { nombre: 'Mouse', cantidad: 20 },
  { nombre: 'Cable', cantidad: 50 }
];

router.post('/rebajar-stock', (req, res) => {
  try {
    const { productos } = req.body;

    if (!Array.isArray(productos)) {
      return res.status(400).json({
        ok: false,
        msg: 'El body debe contener un array "productos".'
      });
    }

    // Procesar rebaja
    productos.forEach(p => {
      if (!p || typeof p.nombre !== 'string' || typeof p.cantidad !== 'number') {
        return; // ignora inválidos
      }

      const item = inventario.find(i => i.nombre === p.nombre);
      if (item) {
        // Validación defensiva: no permitir negativos
        item.cantidad = Math.max(0, item.cantidad - p.cantidad);
      }
    });

    return res.status(200).json({
      ok: true,
      inventario
    });

  } catch (error) {
    console.error('Error en /rebajar-stock:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Error interno al rebajar stock.'
    });
  }
});

module.exports = router;