const roleChecker = require("../middleware/roleChecker");
const CajaDiaSchema = require("../models/Billetera");
const CajaDiaRouter   = require('express').Router();

CajaDiaRouter.get("/", 
    roleChecker(['Propietario', 'Administrador', "Gerente", "Vendedor"]), 
    async (req, res) => {
        try {
            const user = req.user;
            if (!user) return res.status(401).json({ error: "Usuario no autenticado" });

            // 1. Validación de negocio
            const negocioId = user.negocio?.[0];
            if (!negocioId) return res.status(401).json({ error: "Usuario sin negocio asociado." });

            // CORRECCIÓN: Sintaxis correcta para validar que si no es dueño, obligatoriamente tenga sucursal
            if (user.rol !== "Propietario" && !user.sucursal) { 
                return res.status(403).json({ error: "Usuario sin sucursal asignada." });
            }

            // 2. Obtener la fecha de hoy EXACTA (Mucho más simple gracias a tu nuevo Schema)
            const ahora = new Date();
            const fechaHoy = ahora.toLocaleDateString('en-CA', { timeZone: 'America/Caracas' }); // Ej: "2026-09-09"

            // Inicializamos en null en lugar de 0
            let response = null; 

            // 3. Búsqueda según el Rol
            if (user.rol === "Propietario" || user.rol === "Administrador") {
                // CORRECCIÓN: Usar find() para devolver un arreglo con las cajas de TODAS las sucursales de hoy
                response = await CajaDiaSchema.find({ 
                    negocio: negocioId, 
                    fechaString: fechaHoy // Búsqueda directa por el string
                }).lean();
            } else {
                // Gerentes y Vendedores usan findOne() porque solo ven la caja de su propia sucursal
                response = await CajaDiaSchema.findOne({ 
                    negocio: negocioId, 
                    sucursal: user.sucursal,
                    fechaString: fechaHoy // Búsqueda directa por el string
                }).lean();
            }

            return res.status(200).json({ response });

        } catch (error) {
            console.error("Error en GET /api/Cajadia:", error.message);
            return res.status(500).json({ error: "Error al obtener estadísticas." });
        }
    }
);

module.exports = CajaDiaRouter;
