const Negocio = require('../models/negocio');

const checkSubscription = async (req, res, next) => {
    // 1. Si eres el Super Admin (tienes la cookie AdminSuper), entras sin pagar
    if (req.cookies.AdminSuper) return next();

    // 2. Obtenemos el ID del negocio (usualmente viene en los parámetros de la URL)
    const { idNegocio } = req.params;

    try {
        const negocio = await Negocio.findById(idNegocio);
        if (!negocio) return res.status(404).json({ error: 'Negocio no encontrado' });

        const ahora = new Date();

        // 3. Verificamos si la fecha actual pasó la fecha de expiración
        if (ahora > negocio.planExpiresAt) {
            
            // Si estaba como 'activo', lo pasamos a 'bloqueado' en la base de datos
            if (negocio.status === 'activo') {
                negocio.status = 'bloqueado';
                await negocio.save();
            }

            return res.status(402).json({ 
                error: 'SUSCRIPCION_VENCIDA',
                message: `El acceso a "${negocio.nombre}" está bloqueado. Costo de reactivación: 65$.` 
            });
        }

        // Si todo está bien, permitimos que continúe a la ruta
        next();
    } catch (error) {
        res.status(500).json({ error: 'Error al verificar la suscripción' });
    }
};

module.exports = checkSubscription;