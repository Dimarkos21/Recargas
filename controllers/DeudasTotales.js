const DeudasTotal = require('express').Router();


const  DeudalTotal = require('../models/DeudasTotales');


const mongoose = require('mongoose');
const multer = require("multer");
const path = require("path");

const roleChecker = require('../middleware/roleChecker'); 
const Facturacion = require('../models/facturacion1'); // Asegúrate de que la ruta sea correcta hacia tu modelo de Facturacion
DeudasTotal.get('/',  roleChecker(["Propietario", "Administrador"]) , async (req, res) => { 


    try {

    const negocioId = req.user?.negocio?.[0];
    if (!negocioId) {
        return res.status(401).json({ error: "Usuario sin negocio asociado." });
    }

const resultadoFinanciero = await Facturacion.aggregate([
    { 
        $match: { 
            negocio: new mongoose.Types.ObjectId(negocioId) ,
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
DeudasTotal.get('/DeudasTotales',  roleChecker(["Propietario", "Administrador", "Gerente"]) , async (req, res) => { 


    try {

    const negocioId = req.user?.negocio?.[0];
    if (!negocioId) {
        return res.status(401).json({ error: "Usuario sin negocio asociado." });
    }

const resultadoFinanciero = await DeudalTotal.findOne({ negocio: negocioId }).lean();

// Resultado listo para usar



 return res.status(200).json(resultadoFinanciero);

    } catch (error) {
        console.error("Error al obtener la deuda total:", error.message);
        return res.status(500).json({ error: "Error al obtener la deuda total." });
    }
    
} );
module.exports = DeudasTotal;