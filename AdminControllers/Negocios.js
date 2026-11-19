const NegociosControlRouter= require('express').Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
// Modelos necesarios 
const User = require('../models/user'); 
const Negocio = require('../models/negocio'); 
const roleChecker = require('../middleware/roleChecker'); 
const Facturacion =  require('../models/facturacion1'); 

NegociosControlRouter.get('/Contabilidad', async (req, res) => { 


    try {


  const {negocioId} = req.body;
        
const resultadoFinanciero = await Facturacion.aggregate([
    { 
        
        $match: { 
            negocio: new mongoose.Types.ObjectId("6a7f478cd57b91d4ca0c38fc") ,
            tipodeabono: "Credito"
        } 
    },
    { 
        $group: { 
            _id: "$negocio",
            totalVentas: { $sum: "$totalVenta" },
            totalAbonosIniciales: { $sum: "$finanzas.abonoInicial" },
            totalPendiente: { $sum: "$finanzas.saldoPendiente" },
            cantidadTotalFacturas: { $sum: 1 }
        } 
    }
]);
console.log("Resultado financiero:", resultadoFinanciero);
// Resultado listo para usar
const finanzas = resultadoFinanciero[0] || {
    totalVentas: 0,
    totalAbonosIniciales: 0,
    totalPendiente: 0,
    cantidadTotalFacturas: 0
};

console.log(finanzas);
 return res.status(200).json(finanzas);

    } catch (error) {
        console.error("Error al obtener la deuda total:", error.message);
        return res.status(500).json({ error: "Error al obtener la deuda total." });
    }
    
} );
NegociosControlRouter.get(
    "/", 
  
    async (request, response) => { 
        


        
        try {
            const respuesta = await Negocio.find();

   

            return response.status(200).json({
                message: "Lista de empleados recuperada exitosamente.",
                respuesta
            });

        } catch (error) {
            // ... (manejo de errores)
        }
    }
);
// actualizacion de plan
NegociosControlRouter.patch(
    "/api/negociosControl", 
  
    async (request, response) => { 
        


        
        try {

        const {
id,
            nombrePlan,
            monto,
            fechaPago,
            vence,
            transaccionId,
        
        } = request.body;


            const respuesta = await Negocio.updateOne(

                {
                       nombrePlan,
            monto,
            fechaPago,
            vence,
            transaccionId,
         
                }
            );

   

            return response.status(200).json({
                message: "Lista de empleados recuperada exitosamente.",
                respuesta
            });

        } catch (error) {
            // ... (manejo de errores)
        }
    }
);

/**
 * Calcula la fecha de vencimiento sumando días a la fecha actual.
 * @param {number} dias - Cantidad de días de suscripción (por defecto 30).
 * @returns {Date} - Objeto de fecha de JavaScript.
 */
function calcularFechaVencimiento(dias = 30) {
    const fecha = new Date();
    // Usamos el método .getDate() para obtener el día del mes y sumarle los días
    fecha.setDate(fecha.getDate() + dias);
    
    // Opcional: Ajustar la hora al final del día (23:59:59) 
    // para que el usuario tenga todo el último día disponible.
    fecha.setHours(23, 59, 59, 999);
    
    return fecha;
}
NegociosControlRouter.patch(
    "/", // Es buena práctica pasar el ID por la URL
    async (request, response) => { 
        try {
            // Obtenemos el ID de los parámetros o del body
         
        const {
id,
            nombrePlan,
            monto,
            fechaPago,
            vence,
            transaccionId,
        
        } = request.body;
console.log(id,
            nombrePlan,
            monto,
            fechaPago,
            vence,
            transaccionId,
        )

            // 1. Validamos que el ID exista
            if (!id) {
                return response.status(400).json({ message: "El ID es requerido." });
            }

            // 2. Realizamos la actualización
            // { _id: id } es el filtro
               const fechaVencimiento = calcularFechaVencimiento();
            // { $set: updates } indica qué campos cambiar sin borrar el resto
          const respuesta = await Negocio.updateOne(
    { _id: id }, 
    { 
        $set: { 
            planes: { 
                nombrePlan, 
                monto, 
                      vence: fechaVencimiento,
                        fecha: new Date(),
                        
        
                transaccionId 
            } 
        } 
    }
);

            // 3. Verificamos si se encontró y actualizó el documento
            if (respuesta.matchedCount === 0) {
                return response.status(404).json({ message: "Negocio no encontrado." });
            }

            return response.status(200).json({
                message: "Negocio actualizado exitosamente.",
                detalles: respuesta
            });

        } catch (error) {
            return response.status(500).json({
                message: "Error al actualizar el negocio.",
                error: error.message
            });
        }
    }
);


module.exports = NegociosControlRouter;