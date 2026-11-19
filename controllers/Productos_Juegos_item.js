const { syncCatalogWithShop2TopUp } = require('../services/syncService');
const productosJuegosRouter = require('express').Router(); // Router sigue siendo adecuado
const mongoose = require('mongoose');
productosJuegosRouter.post("/", 
   
 
    async (req, res) => {
        try {
    console.log('⚡ [PRUEBA MANUAL] Disparando sincronización desde el navegador...');
    
    // Ejecutamos la función de sincronización
    await syncCatalogWithShop2TopUp();

    return res.status(200).json({
      success: true,
      message: '¡Sincronización manual ejecutada con éxito! Revisa la consola de tu terminal para ver los detalles.'
    });
  } catch (error) {
            if (error.code === 11000) {
                return res.status(409).json({ 
                    error: "Código duplicado", 
                    detalle: `El código (SKU) '${req.body.codigo}' ya está registrado.` 
                });
            }
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: "La imagen excede el límite de 5MB." });
            }

            console.error("❌ Error al guardar producto:", error);
            return res.status(500).json({ error: "Error interno", detalle: error.message });
        }
    }
);


module.exports = productosJuegosRouter;