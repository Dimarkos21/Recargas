const Negocio = require("../models/negocio");
const mongoose = require("mongoose");

const checkSubscription = async (req, res, next) => {
    try {
        const user = req.user;
        const negocios = Array.isArray(user?.negocio) ? user.negocio : [];
        let negocioId = negocios[0];

        if (negocioId) {
            negocioId = new mongoose.Types.ObjectId(negocioId.toString());
        }

        if (!negocioId) {
            // Este 411 activará el salto a /Planes en tu interceptor de Axios
            return res.status(411).json({ error: "Usuario sin negocio vinculado." });
        }

        const negocio = await Negocio.findById(negocioId);

        if (!negocio) {
            return res.status(411).json({ error: "Negocio no encontrado" });
        }

        // --- LÓGICA DE VERIFICACIÓN ---
        const hoy = new Date();
        let fechaExpiracion = null;

        // Prioridad 1: Campo explícito en el documento principal
       


// 1. Accedemos directamente al objeto 'planes' (según tu JSON)
if (negocio.planes && negocio.planes.vence) {
    // Si usas Mongoose, negocio.planes.vence ya debería ser una fecha.
    // Si es un objeto crudo de MongoDB, accedemos a la propiedad .vence
    fechaExpiracion = new Date(negocio.planes.vence);

}

// 2. Si no hay plan en 'planes', revisamos el historial en 'ordenes' como respaldo
if (!fechaExpiracion && negocio.planes && negocio.planes.length > 0) {
    const ultimaOrden = negocio.planes[negocio.planes.length - 1];
    if (ultimaOrden.vence) {
        fechaExpiracion = new Date(ultimaOrden.vence);
    }
}

// 3. Verificación final y respuesta 411
if (!fechaExpiracion || fechaExpiracion < hoy) {
    console.log(`🚫 Suscripción vencida o inexistente para: ${negocio.nombre}`);
    return res.status(411).json({ 
        error: "Plan vencido", 
        message: "Tu suscripción ha expirado o no tienes un plan activo." 
    });
}
        // Si todo está bien, pasamos el negocio al siguiente controlador
        req.negocio = negocio;
        next();

    } catch (error) {
        console.error("Error en checkSubscription:", error);
        res.status(500).json({ error: "Error interno al verificar suscripción" });
    }
};

module.exports = { checkSubscription };