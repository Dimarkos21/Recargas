const Negocio = require('../../models/negocio');

const registrarPago = async (req, res) => {
    const { idNegocio } = req.params;

    try {
        const negocio = await Negocio.findById(idNegocio);
        if (!negocio) return res.status(404).json({ error: 'Negocio no existe' });

        // Calculamos la nueva fecha (Hoy + 30 días)
        const nuevaFecha = new Date();
        nuevaFecha.setDate(nuevaFecha.getDate() + 30);

        negocio.planExpiresAt = nuevaFecha;
        negocio.status = 'activo';
        negocio.ultimoPago = new Date(); // Guardamos registro de cuándo pagó
        
        await negocio.save();

        res.json({ 
            mensaje: `¡Pago recibido! "${negocio.nombre}" activado hasta el ${nuevaFecha.toLocaleDateString()}` 
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al procesar el pago' });
    }
};

module.exports = { registrarPago };